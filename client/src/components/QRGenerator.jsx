import React, { useState } from 'react';
import { generateQR } from '../api/mpesaApi';
import { QrCode, Download, Activity, AlertCircle, RefreshCw } from 'lucide-react';

const QRGenerator = () => {
    const [formData, setFormData] = useState({
        merchantName: 'M-Pesa API Test',
        refNo: 'Invoice123',
        amount: '',
        trxCode: 'PB' // Paybill
    });
    const [qrBase64, setQrBase64] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await generateQR(formData);
            setQrBase64(res.data.QRCode);
        } catch (err) {
            setError('Failed to generate QR code. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="card mt-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900 border-b pb-4">
                <QrCode className="w-5 h-5 text-mpesa-green" />
                Dynamic QR Generator
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <form onSubmit={handleGenerate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Merchant Name</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green outline-none text-sm"
                                value={formData.merchantName}
                                onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Ref Number</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green outline-none text-sm"
                                value={formData.refNo}
                                onChange={(e) => setFormData({ ...formData, refNo: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Amount (KES)</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green outline-none text-sm"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Type</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green outline-none text-sm appearance-none bg-white font-medium"
                                value={formData.trxCode}
                                onChange={(e) => setFormData({ ...formData, trxCode: e.target.value })}
                            >
                                <option value="PB">Paybill</option>
                                <option value="BG">Buy Goods</option>
                                <option value="SM">Send Money</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary flex items-center justify-center gap-2 h-[42px]"
                    >
                        {loading ? <Activity className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                        Generate New QR
                    </button>

                    {error && (
                        <div className="mt-2 p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </form>

                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl p-6 bg-slate-50/50">
                    {qrBase64 ? (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                            <div className="bg-white p-4 rounded-xl shadow-lg inline-block border border-slate-100">
                                <img
                                    src={`data:image/png;base64,${qrBase64}`}
                                    alt="M-Pesa QR Code"
                                    className="w-48 h-48"
                                />
                            </div>
                            <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scan to Pay KES {formData.amount}</p>
                            <button
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `data:image/png;base64,${qrBase64}`;
                                    link.download = `mpesa-qr-${formData.refNo}.png`;
                                    link.click();
                                }}
                                className="mt-4 text-mpesa-green text-xs font-bold flex items-center gap-1 hover:underline"
                            >
                                <Download className="w-3 h-3" />
                                Download QR Code
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-slate-300">
                            <QrCode className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Scan result will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default QRGenerator;
