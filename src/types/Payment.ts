export interface IPayment {
    _id: string;
    userId: number;
    chatId?: number;
    paymentId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}