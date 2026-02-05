import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const getBaseUrl = () => {
    return process.env.MPESA_ENV === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';
};

export const getOAuthToken = async () => {
    const consumer_key = process.env.MPESA_CONSUMER_KEY;
    const consumer_secret = process.env.MPESA_CONSUMER_SECRET;
    const url = `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;

    const auth = Buffer.from(`${consumer_key}:${consumer_secret}`).toString('base64');

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting OAuth token:', error.response ? error.response.data : error.message);
        throw error;
    }
};

export const getTimestamp = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
};

export const getPassword = (shortcode, passkey, timestamp) => {
    return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
};
