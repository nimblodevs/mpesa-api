import mongoose from 'mongoose';

const StandingOrderSchema = new mongoose.Schema({
    StandingOrderName: { type: String, required: true },
    PhoneNumber: { type: String, required: true },
    Amount: { type: Number, required: true },
    StartDate: { type: String, required: true }, // YYYYMMDD
    EndDate: { type: String, required: true },   // YYYYMMDD
    Frequency: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4, 5, 6, 7, 8] // 1:Once, 2:Daily, 3:Weekly, 4:Monthly, etc.
    },
    AccountReference: { type: String, required: true },
    TransactionType: {
        type: String,
        default: 'Standing Order Customer Pay Bill',
        enum: ['Standing Order Customer Pay Bill', 'Standing Order Customer Pay Merchant']
    },
    Status: {
        type: String,
        enum: ['ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING'],
        default: 'PENDING'
    },
    ConversationID: String,
    OriginatorConversationID: String,
    RawResponse: Object,
}, { timestamps: true });

export default mongoose.model('StandingOrder', StandingOrderSchema);
