import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api/mpesa',
});

export const stkPush = (data) => api.post('/stkpush', data);
export const getHistory = () => api.get('/history');
export const getBalance = () => api.get('/balance');
export const queryTransaction = (transactionID) => api.post('/query', { transactionID });
export const registerC2B = () => api.post('/c2b/register');

// Ratiba
export const createRatiba = (data) => api.post('/ratiba/create', data);
export const cancelRatiba = (data) => api.post('/ratiba/cancel', data);
export const getRatibaList = () => api.get('/ratiba/list');
export const generateQR = (data) => api.post('/qrcode/generate', data);
export const reverseTransaction = (data) => api.post('/reversal', data);
export const b2bPayout = (data) => api.post('/b2b', data);
export const syncManualTransaction = (transactionID) => api.post('/sync-manual', { transactionID });

export default api;
