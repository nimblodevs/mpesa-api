import express from 'express';
import axios from 'axios';
import Transaction from '../models/Transaction.js';
import StandingOrder from '../models/StandingOrder.js';
import { getOAuthToken, getTimestamp, getPassword, getBaseUrl } from '../utils/mpesaUtils.js';
import logger from '../utils/logger.js';
import { retryRequest } from '../utils/retryUtils.js';

const router = express.Router();

// STK Push Request
router.post('/stkpush', async (req, res) => {
    const { phoneNumber, amount } = req.body;
    const timestamp = getTimestamp();
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = getPassword(shortcode, passkey, timestamp);

    try {
        const token = await getOAuthToken();
        const shortcode = process.env.MPESA_SHORTCODE;
        const timestamp = getTimestamp();
        const password = getPassword(shortcode, process.env.MPESA_PASSKEY, timestamp);
        const url = `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`;

        const response = await retryRequest(() => axios.post(url, {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: shortcode,
            PhoneNumber: phoneNumber,
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: 'MpesaAPI',
            TransactionDesc: 'Payment for services'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        }));

        // Save initial transaction
        const transaction = new Transaction({
            MerchantRequestID: response.data.MerchantRequestID,
            CheckoutRequestID: response.data.CheckoutRequestID,
            ResponseCode: response.data.ResponseCode,
            ResponseDescription: response.data.ResponseDescription,
            Amount: amount,
            PhoneNumber: phoneNumber,
            TransactionType: 'STK_PUSH',
            Status: 'PENDING'
        });
        await transaction.save();
        logger.info('STK Push initiated successfully: %s', response.data.CheckoutRequestID);

        res.status(200).json(response.data);
    } catch (error) {
        logger.error('STK Push Error: %o', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'STK Push failed' });
    }
});

// Callback Handler
router.post('/callback', async (req, res) => {
    const { Body } = req.body;
    const { stkCallback } = Body;

    logger.info('M-Pesa Callback Received for CheckoutID: %s', stkCallback.CheckoutRequestID);
    logger.debug('Callback Data: %o', req.body);

    try {
        const transaction = await Transaction.findOne({ CheckoutRequestID: stkCallback.CheckoutRequestID });
        if (transaction) {
            transaction.ResultCode = stkCallback.ResultCode;
            transaction.ResultDesc = stkCallback.ResultDesc;
            transaction.Status = stkCallback.ResultCode === 0 ? 'SUCCESS' : 'FAILED';
            transaction.RawCallbackData = stkCallback;

            if (stkCallback.CallbackMetadata) {
                const items = stkCallback.CallbackMetadata.Item;
                const mpesaReceipt = items.find(item => item.Name === 'MpesaReceiptNumber');
                const amount = items.find(item => item.Name === 'Amount');
                const date = items.find(item => item.Name === 'TransactionDate');

                if (mpesaReceipt) transaction.MpesaReceiptNumber = mpesaReceipt.Value;
                if (amount) transaction.Amount = amount.Value;
                if (date) {
                    // M-Pesa date format: YYYYMMDDHHMMSS
                    const d = String(date.Value);
                    transaction.TransactionDate = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(8, 10)}:${d.slice(10, 12)}:${d.slice(12, 14)}`);
                }
            }
            await transaction.save();
        }
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
        console.error('Callback Error:', error);
        res.status(500).json({ ResultCode: 1, ResultDesc: 'Failed' });
    }
});

// C2B Register URL
router.post('/c2b/register', async (req, res) => {
    try {
        const token = await getOAuthToken();
        const url = `${getBaseUrl()}/mpesa/c2b/v1/registerurl`;
        const response = await axios.post(url, {
            ShortCode: process.env.MPESA_SHORTCODE,
            ResponseType: 'Completed',
            ConfirmationURL: process.env.MPESA_CALLBACK_URL,
            ValidationURL: process.env.MPESA_CALLBACK_URL,
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'C2B Register failed' });
    }
});

// B2C Payment Request
router.post('/b2c', async (req, res) => {
    const { amount, phoneNumber, remarks } = req.body;
    try {
        const token = await getOAuthToken();
        const url = `${getBaseUrl()}/mpesa/b2c/v1/paymentrequest`;
        const response = await axios.post(url, {
            OriginatorConversationID: '', // Optional
            InitiatorName: 'testapi',
            SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || 'pass',
            CommandID: 'BusinessPayment',
            Amount: amount,
            PartyA: process.env.MPESA_SHORTCODE,
            PartyB: phoneNumber,
            Remarks: remarks || 'B2C Payment',
            QueueTimeOutURL: process.env.MPESA_CALLBACK_URL,
            ResultURL: process.env.MPESA_CALLBACK_URL,
            Occasion: 'Gift'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        logger.info('B2C request sent for phone: %s', phoneNumber);
        res.status(200).json(response.data);
    } catch (error) {
        logger.error('B2C Error: %o', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'B2C failed' });
    }
});

// B2B Payment Request
router.post('/b2b', async (req, res) => {
    const { amount, receiverShortcode, remarks } = req.body;
    try {
        const token = await getOAuthToken();
        const url = `${getBaseUrl()}/mpesa/b2b/v1/paymentrequest`;
        const response = await retryRequest(() => axios.post(url, {
            Initiator: 'testapi',
            SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || 'pass',
            CommandID: 'BusinessPayBill',
            SenderIdentifierType: '4', // Shortcode
            RecieverIdentifierType: '4', // Shortcode
            Amount: amount,
            PartyA: process.env.MPESA_SHORTCODE,
            PartyB: receiverShortcode,
            Remarks: remarks || 'B2B Payment',
            AccountReference: 'B2BPay',
            QueueTimeOutURL: process.env.MPESA_CALLBACK_URL,
            ResultURL: process.env.MPESA_CALLBACK_URL,
        }, {
            headers: { Authorization: `Bearer ${token}` }
        }));
        logger.info('B2B request sent to: %s', receiverShortcode);
        res.status(200).json(response.data);
    } catch (error) {
        logger.error('B2B Error: %o', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'B2B failed' });
    }
});

// Account Balance
router.get('/balance', async (req, res) => {
    try {
        const token = await getOAuthToken();
        const url = `${getBaseUrl()}/mpesa/accountbalance/v1/query`;
        const response = await retryRequest(() => axios.post(url, {
            Initiator: 'testapi',
            SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || 'pass',
            CommandID: 'AccountBalance',
            PartyA: process.env.MPESA_SHORTCODE,
            IdentifierType: '4', // 4 for shortcode
            Remarks: 'Balance query',
            QueueTimeOutURL: process.env.MPESA_CALLBACK_URL,
            ResultURL: process.env.MPESA_CALLBACK_URL,
        }, {
            headers: { Authorization: `Bearer ${token}` }
        }));
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Balance query failed' });
    }
});

// Transaction Status Query
router.post('/query', async (req, res) => {
    const { transactionID } = req.body;
    try {
        const token = await getOAuthToken();
        const url = `${getBaseUrl()}/mpesa/transactionstatus/v1/query`;
        const response = await retryRequest(() => axios.post(url, {
            Initiator: 'testapi',
            SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || 'pass',
            CommandID: 'TransactionStatusQuery',
            TransactionID: transactionID,
            PartyA: process.env.MPESA_SHORTCODE,
            IdentifierType: '4',
            Remarks: 'Status query',
            QueueTimeOutURL: process.env.MPESA_CALLBACK_URL,
            ResultURL: process.env.MPESA_CALLBACK_URL,
        }, {
            headers: { Authorization: `Bearer ${token}` }
        }));
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Query failed' });
    }
});

// History endpoint
router.get('/history', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(50);
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Transaction Reversal
router.post('/reversal', async (req, res) => {
    const { transactionID, amount, remarks } = req.body;
    try {
        const token = await getOAuthToken();
        const url = `${getBaseUrl()}/mpesa/reversal/v1/request`;
        const response = await retryRequest(() => axios.post(url, {
            Initiator: 'testapi',
            SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || 'pass',
            CommandID: 'TransactionReversal',
            TransactionID: transactionID,
            Amount: amount,
            ReceiverIdentifierType: '11',
            Remarks: remarks || 'Reversal Request',
            QueueTimeOutURL: process.env.MPESA_CALLBACK_URL,
            ResultURL: process.env.MPESA_CALLBACK_URL,
            Occasion: 'Reversal'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        }));
        res.status(200).json(response.data);
    } catch (error) {
        logger.error('Reversal Error: %o', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Reversal failed' });
    }
});

// Manual Reconciliation (Pull -> Sync -> Save)
router.post('/sync-manual', async (req, res) => {
    const { transactionID } = req.body;
    try {
        const token = await getOAuthToken();
        const url = `${getBaseUrl()}/mpesa/transactionstatus/v1/query`;

        // Pull status from M-Pesa
        const response = await retryRequest(() => axios.post(url, {
            Initiator: 'testapi',
            SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || 'pass',
            CommandID: 'TransactionStatusQuery',
            TransactionID: transactionID,
            PartyA: process.env.MPESA_SHORTCODE,
            IdentifierType: '4',
            Remarks: 'Manual Sync',
            QueueTimeOutURL: process.env.MPESA_CALLBACK_URL,
            ResultURL: process.env.MPESA_CALLBACK_URL,
        }, {
            headers: { Authorization: `Bearer ${token}` }
        }));

        // In a real scenario, we'd wait for the result callback or 
        // if the API returns immediate info (Daraja usually is asynchronous).
        // For Manual Entry, we are essentially "registering" our interest.
        // If we want to save it IMMEDIATELY as a SUCCESS, we'd need the details.

        // Since Daraja status query is asynchronous, we save an initial record 
        // if it doesn't exist, and the callback handler will update it.
        let transaction = await Transaction.findOne({ MpesaReceiptNumber: transactionID });

        if (!transaction) {
            transaction = new Transaction({
                MpesaReceiptNumber: transactionID,
                TransactionType: 'SYNC_MANUAL',
                Status: 'PENDING',
                ResponseDescription: 'Manually initiated sync'
            });
            await transaction.save();
        }

        res.status(200).json({
            message: 'Manual sync initiated. The system will update once Safaricom processes the request.',
            data: response.data
        });
    } catch (error) {
        logger.error('Manual Sync Error: %o', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Manual sync failed' });
    }
});

// M-Pesa Ratiba (Standing Orders) - Create
router.post('/ratiba/create', async (req, res) => {
    const { standingOrderName, phoneNumber, amount, startDate, endDate, frequency, accountReference } = req.body;
    try {
        const token = await getOAuthToken();
        const url = `${getBaseUrl()}/mpesa/standingorder/v1/create`;

        const response = await axios.post(url, {
            StandingOrderName: standingOrderName,
            ReceiverShortCode: process.env.MPESA_SHORTCODE,
            ReceiverIdentifierType: '4',
            Amount: amount,
            StartDate: startDate,
            EndDate: endDate,
            Frequency: frequency, // 1-8
            AccountReference: accountReference,
            TransactionType: 'Standing Order Customer Pay Bill',
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            PhoneNumber: phoneNumber,
            Description: `Ratiba for ${standingOrderName}`
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const standingOrder = new StandingOrder({
            StandingOrderName: standingOrderName,
            PhoneNumber: phoneNumber,
            Amount: amount,
            StartDate: startDate,
            EndDate: endDate,
            Frequency: frequency,
            AccountReference: accountReference,
            ConversationID: response.data.ConversationID,
            OriginatorConversationID: response.data.OriginatorConversationID,
            RawResponse: response.data,
            Status: 'PENDING'
        });
        await standingOrder.save();

        res.status(200).json(response.data);
    } catch (error) {
        logger.error('Ratiba Create Error: %o', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Ratiba creation failed' });
    }
});

// Ratiba - Cancel
router.post('/ratiba/cancel', async (req, res) => {
    const { standingOrderName, phoneNumber } = req.body;
    try {
        const token = await getOAuthToken();
        const url = `${getBaseUrl()}/mpesa/standingorder/v1/cancel`;

        const response = await axios.post(url, {
            StandingOrderName: standingOrderName,
            ReceiverShortCode: process.env.MPESA_SHORTCODE,
            PhoneNumber: phoneNumber,
            CallBackURL: process.env.MPESA_CALLBACK_URL
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        await StandingOrder.findOneAndUpdate(
            { StandingOrderName: standingOrderName, PhoneNumber: phoneNumber },
            { Status: 'CANCELLED' }
        );

        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Ratiba cancellation failed' });
    }
});

// Ratiba - Query
router.get('/ratiba/list', async (req, res) => {
    try {
        const orders = await StandingOrder.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Ratiba orders' });
    }
});

// Dynamic QR Code Generation
router.post('/qrcode/generate', async (req, res) => {
    const { merchantName, refNo, amount, trxCode } = req.body;
    try {
        const token = await getOAuthToken();
        const url = `${getBaseUrl()}/mpesa/qrcode/v1/generate`;

        const response = await axios.post(url, {
            MerchantName: merchantName || 'M-Pesa API Test',
            RefNo: refNo || 'Ref123',
            Amount: amount,
            TrxCode: trxCode || 'PB', // PB for Paybill, BG for Buy Goods
            CPI: process.env.MPESA_SHORTCODE,
            Size: '300'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        res.status(200).json(response.data);
    } catch (error) {
        logger.error('QR Generate Error: %o', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'QR Code generation failed' });
    }
});

export default router;

