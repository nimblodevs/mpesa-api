import React, { useState, useEffect } from 'react';
import { stkPush, getHistory } from '../api/mpesaApi';
import { History, Send, Smartphone, Activity, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentForms from '../components/PaymentForms';
import RatibaForm from '../components/RatibaForm';
import QRGenerator from '../components/QRGenerator';
import { getRatibaList } from '../api/mpesaApi';

const Dashboard = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [ratibaList, setRatibaList] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });

    // New states for B2B and Sync
    const [b2bData, setB2bData] = useState({ receiverShortcode: '', amount: '' });
    const [syncID, setSyncID] = useState('');

    useEffect(() => {
        fetchHistory();
        fetchRatiba();
        const interval = setInterval(() => {
            fetchHistory();
            fetchRatiba();
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchHistory = async () => {
        setIsSyncing(true);
        try {
            const res = await getHistory();
            setHistory(res.data);
        } catch (err) {
            console.error('Fetch history error:', err);
        } finally {
            setIsSyncing(false);
        }
    };

    const fetchRatiba = async () => {
        try {
            const res = await getRatibaList();
            setRatibaList(res.data);
        } catch (err) {
            console.error('Fetch ratiba error:', err);
        }
    };

    const handleStkPush = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: 'Processing STK Push...', type: 'info' });
        try {
            await stkPush({ phoneNumber, amount });
            setMessage({ text: 'STK Push sent! Please check your phone.', type: 'success' });
            setPhoneNumber('');
            setAmount('');
            fetchHistory();
        } catch (err) {
            setMessage({ text: err.response?.data?.error || 'STK Push failed', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleReversal = async (transactionID, amount) => {
        if (!window.confirm(`Are you sure you want to request a reversal for KES ${amount}?`)) return;

        setLoading(true);
        setMessage({ text: 'Requesting reversal...', type: 'info' });
        try {
            await reverseTransaction({ transactionID, amount: 1 }); // Amount 1 for sandbox test
            setMessage({ text: 'Reversal request sent! Check your phone for confirmation.', type: 'success' });
            fetchHistory();
        } catch (err) {
            setMessage({ text: 'Reversal request failed.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleB2B = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: 'Processing B2B Payout...', type: 'info' });
        try {
            await b2bPayout(b2bData);
            setMessage({ text: 'B2B Payout initiated!', type: 'success' });
            setB2bData({ receiverShortcode: '', amount: '' });
            fetchHistory();
        } catch (err) {
            setMessage({ text: 'B2B payout failed.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSyncManual = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: 'Pulling transaction from M-Pesa...', type: 'info' });
        try {
            await syncManualTransaction(syncID);
            setMessage({ text: 'Sync initiated! The system will update shortly.', type: 'success' });
            setSyncID('');
            fetchHistory();
        } catch (err) {
            setMessage({ text: 'Manual sync failed.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'SUCCESS': return <CheckCircle className="text-green-500 w-5 h-5" />;
            case 'FAILED': return <XCircle className="text-red-500 w-5 h-5" />;
            default: return <Clock className="text-amber-500 w-5 h-5" />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="bg-mpesa-green text-white p-2 rounded-lg">M</span>
                    M-Pesa Pay
                </h1>
                <p className="text-slate-500">Real-time payment integration system</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <section className="card">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-mpesa-green" />
                            STK Push (Lipa na M-Pesa)
                        </h2>
                        <form onSubmit={handleStkPush} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    placeholder="2547XXXXXXXX"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green focus:border-transparent outline-none"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (KES)</label>
                                <input
                                    type="number"
                                    placeholder="10"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green focus:border-transparent outline-none"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Activity className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                                Send Payment Request
                            </button>
                        </form>

                        <AnimatePresence>
                            {message.text && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`mt-4 p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' :
                                        message.type === 'success' ? 'bg-green-50 text-green-700' :
                                            'bg-blue-50 text-blue-700'
                                        }`}
                                >
                                    {message.text}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>

                    {/* Manual Sync Section */}
                    <section className="card">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-mpesa-green" />
                            Manual Entry Sync
                        </h2>
                        <p className="text-xs text-slate-500 mb-4">Pull missing transactions using M-Pesa Receipt Number.</p>
                        <form onSubmit={handleSyncManual} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Receipt Number (e.g. NLJ7RT6S9)"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green focus:border-transparent outline-none"
                                value={syncID}
                                onChange={(e) => setSyncID(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Sync Transaction
                            </button>
                        </form>
                    </section>

                    {/* B2B Section */}
                    <section className="card">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Send className="w-5 h-5 text-mpesa-green" />
                            B2B Payout
                        </h2>
                        <form onSubmit={handleB2B} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Receiver Shortcode"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green focus:border-transparent outline-none text-sm"
                                value={b2bData.receiverShortcode}
                                onChange={(e) => setB2bData({ ...b2bData, receiverShortcode: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Amount"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green focus:border-transparent outline-none text-sm"
                                value={b2bData.amount}
                                onChange={(e) => setB2bData({ ...b2bData, amount: e.target.value })}
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                Send B2B Payment
                            </button>
                        </form>
                    </section>
                </div>

                <div className="lg:col-span-2">
                    <section className="card h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <History className="w-5 h-5 text-mpesa-green" />
                                Transaction History
                            </h2>
                            <div className="flex items-center gap-2">
                                {isSyncing && <Activity className="w-4 h-4 text-mpesa-green animate-spin" />}
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Updates</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-slate-100">
                                        <th className="pb-3 font-medium text-slate-500 text-sm">Receipt</th>
                                        <th className="pb-3 font-medium text-slate-500 text-sm">Phone</th>
                                        <th className="pb-3 font-medium text-slate-500 text-sm">Type</th>
                                        <th className="pb-3 font-medium text-slate-500 text-sm">Amount</th>
                                        <th className="pb-3 font-medium text-slate-500 text-sm">Status</th>
                                        <th className="pb-3 font-medium text-slate-500 text-sm">Date</th>
                                        <th className="pb-3 font-medium text-slate-500 text-sm">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {history.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 text-sm font-mono text-slate-600">{tx.MpesaReceiptNumber || tx.CheckoutRequestID?.slice(0, 10)}</td>
                                            <td className="py-3 text-sm text-slate-600 font-medium">{tx.PhoneNumber}</td>
                                            <td className="py-3 text-sm"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">{tx.TransactionType}</span></td>
                                            <td className="py-3 text-sm font-bold text-slate-900">KES {tx.Amount}</td>
                                            <td className="py-3 text-sm">
                                                <div className="flex items-center gap-1">
                                                    {getStatusIcon(tx.Status)}
                                                    <span className={`text-[11px] font-semibold ${tx.Status === 'SUCCESS' ? 'text-green-600' :
                                                        tx.Status === 'FAILED' ? 'text-red-600' : 'text-amber-600'
                                                        }`}>{tx.Status}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-sm text-slate-400">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 text-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleQueryStatus(tx.MpesaReceiptNumber || tx.CheckoutRequestID)}
                                                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-mpesa-green transition-colors"
                                                        title="Query Status"
                                                    >
                                                        <Activity className="w-4 h-4" />
                                                    </button>
                                                    {tx.Status === 'SUCCESS' && (
                                                        <button
                                                            onClick={() => handleReversal(tx.MpesaReceiptNumber, tx.Amount)}
                                                            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-orange-500 transition-colors"
                                                            title="Request Reversal"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-400">No transactions found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
            <RatibaForm onSuccess={fetchRatiba} />

            {/* Ratiba List */}
            {ratibaList.length > 0 && (
                <section className="card mt-8">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900 border-b pb-4">
                        <Clock className="w-5 h-5 text-mpesa-green" />
                        Active Standing Orders (Ratiba)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ratibaList.map(order => (
                            <div key={order._id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800">{order.StandingOrderName}</h4>
                                    <span className="text-[10px] font-bold bg-mpesa-green/10 text-mpesa-green px-2 py-0.5 rounded uppercase">{order.Status}</span>
                                </div>
                                <p className="text-sm text-slate-500 mb-1 flex justify-between">
                                    <span>Amount:</span>
                                    <span className="font-bold text-slate-900">KES {order.Amount}</span>
                                </p>
                                <p className="text-sm text-slate-500 mb-1 flex justify-between">
                                    <span>Phone:</span>
                                    <span className="text-slate-700 font-mono">{order.PhoneNumber}</span>
                                </p>
                                <div className="mt-4 pt-4 border-t border-slate-200/60 flex justify-between items-center text-[10px] text-slate-400">
                                    <span>Start: {order.StartDate}</span>
                                    <span>End: {order.EndDate}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <QRGenerator />

            <PaymentForms />
        </div>
    );
};

export default Dashboard;
