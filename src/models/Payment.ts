import mongoose from 'mongoose';
import { IPayment } from '../types/Payment.js';

const PaymentSchema = new mongoose.Schema<IPayment>({
    userId: { type: Number, required: true },
    chatId: { type: Number },
    paymentId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'RUB' },
    status: {
        type: String,
        enum: ['pending', 'waiting_for_capture', 'succeeded', 'canceled'],
        default: 'pending'
    },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

PaymentSchema.pre('save', function () {
    this.set({ updatedAt: new Date() });
});

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);