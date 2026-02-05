import React, { useState } from 'react';
import { createRatiba } from '../api/mpesaApi';
import { Calendar, Clock, DollarSign, User, Activity, AlertCircle } from 'lucide-react';

const RatibaForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        standingOrderName: '',
        phoneNumber: '',
        amount: '',
        startDate: '',
        endDate: '',
        frequency: 4, // Default Monthly
        accountReference: 'RatibaRef'
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ text: '', type: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ text: 'Setting up Ratiba...', type: 'info' });

        // Format dates from YYYY-MM-DD to YYYYMMDD
        const formattedData = {
            ...formData,
            startDate: formData.startDate.replace(/-/g, ''),
            endDate: formData.endDate.replace(/-/g, ''),
            frequency: parseInt(formData.frequency)
        };

        try {
            await createRatiba(formattedData);
            setStatus({ text: 'Standing Order Scheduled! Check M-Pesa for setup confirmation.', type: 'success' });
            if (onSuccess) onSuccess();
        } catch (err) {
            setStatus({ text: 'Failed to schedule Ratiba. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="card mt-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-mpesa-green" />
                M-Pesa Ratiba (Schedule Payments)
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Order Name</label>
                        <div className="relative">
                            <input
                                name="standingOrderName"
                                type="text"
                                placeholder="Rent / Internet Bill"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green outline-none text-sm"
                                onChange={handleChange}
                                required
                            />
                            <Activity className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Customer Phone</label>
                        <div className="relative">
                            <input
                                name="phoneNumber"
                                type="text"
                                placeholder="2547XXXXXXXX"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green outline-none text-sm"
                                onChange={handleChange}
                                required
                            />
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Amount (KES)</label>
                        <div className="relative">
                            <input
                                name="amount"
                                type="number"
                                placeholder="2500"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green outline-none text-sm"
                                onChange={handleChange}
                                required
                            />
                            <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Start Date</label>
                            <input
                                name="startDate"
                                type="date"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green outline-none text-sm"
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">End Date</label>
                            <input
                                name="endDate"
                                type="date"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green outline-none text-sm"
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Frequency</label>
                        <select
                            name="frequency"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-mpesa-green outline-none text-sm appearance-none bg-white"
                            onChange={handleChange}
                            value={formData.frequency}
                        >
                            <option value="1">One Off / Once</option>
                            <option value="2">Daily</option>
                            <option value="3">Weekly</option>
                            <option value="4">Monthly</option>
                            <option value="8">Yearly</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-auto bg-slate-900 text-white p-3 rounded-lg font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 h-[42px]"
                    >
                        {loading ? <Activity className="animate-spin w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        Schedule Standing Order
                    </button>
                </div>
            </form>

            {status.text && (
                <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${status.type === 'error' ? 'bg-red-50 text-red-700' :
                        status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{status.text}</span>
                </div>
            )}
        </section>
    );
};

export default RatibaForm;
