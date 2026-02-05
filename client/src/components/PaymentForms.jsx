import React, { useState } from 'react';
import { getBalance, registerC2B } from '../api/mpesaApi';
import { RefreshCw, ShieldCheck, Search, Calendar, QrCode } from 'lucide-react';

const PaymentForms = () => {
    const [balance, setBalance] = useState(null);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [queryId, setQueryId] = useState('');
    const [regStatus, setRegStatus] = useState('');

    const handleGetBalance = async () => {
        setLoadingBalance(true);
        try {
            const res = await getBalance();
            setBalance(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingBalance(false);
        }
    };

    const handleRegisterC2B = async () => {
        try {
            await registerC2B();
            setRegStatus('C2B URLs Registered Successfully!');
        } catch (err) {
            setRegStatus('C2B Registration Failed');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-mpesa-green" />
                        Account Balance
                    </h3>
                    <button
                        onClick={handleGetBalance}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        disabled={loadingBalance}
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-400 ${loadingBalance ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                {balance ? (
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Current Balance</p>
                        <p className="text-2xl font-bold text-slate-900">KES 1,240.50</p>
                        <p className="text-[10px] text-slate-400 mt-2">ID: {balance.ConversationID || 'N/A'}</p>
                    </div>
                ) : (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg text-slate-300 text-sm">
                        Click refresh to view balance
                    </div>
                )}
            </div>

            <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-mpesa-green" />
                    Advanced Tools
                </h3>
                <div className="space-y-3">
                    <button
                        onClick={handleRegisterC2B}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <span className="text-sm font-medium text-slate-700">Register C2B URLs</span>
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    </button>
                    {regStatus && <p className="text-[10px] text-center font-bold text-mpesa-green">{regStatus}</p>}

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Query Transaction ID"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-mpesa-green outline-none"
                            value={queryId}
                            onChange={(e) => setQueryId(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    </div>

                    <div className="flex gap-3">
                        <button className="flex-1 flex items-center justify-center gap-2 p-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:opacity-90">
                            <Calendar className="w-3.5 h-3.5" />
                            M-Pesa Ratiba
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 p-2 bg-mpesa-green text-white rounded-lg text-xs font-semibold hover:opacity-90">
                            <QrCode className="w-3.5 h-3.5" />
                            Dynamic QR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentForms;
