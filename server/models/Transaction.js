import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
    MerchantRequestID: { type: String, unique: true, sparse: true },
    CheckoutRequestID: { type: String, unique: true, sparse: true },
    ResponseCode: String,
    ResponseDescription: String,
    ResultCode: Number,
    ResultDesc: String,
    Amount: Number,
    MpesaReceiptNumber: { type: String, unique: true, sparse: true },
    TransactionDate: Date,
    PhoneNumber: String,
    TransactionType: {
        type: String,
        enum: ['C2B', 'B2C', 'B2B', 'STK_PUSH', 'REVERSAL', 'RATIBA', 'SYNC_MANUAL'],
        required: true
    },
    Status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
        default: 'PENDING'
    },
    RawCallbackData: Object,
}, { timestamps: true });

export default mongoose.model('Transaction', TransactionSchema);
