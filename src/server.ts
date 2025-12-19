import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PaymentService } from './services/PaymentService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', async (req, res) => {
    return res.status(200);
});

app.post('/webhook/yookassa', async (req, res) => {
    try {
        const signature = req.headers['x-webhook-signature'] as string;
        // Здесь должна быть проверка подписи вебхука
        // Для упрощения пока пропускаем

        const { event, object } = req.body;
        console.log(`Webhook received: ${event} for payment ${object.id}`);

        if (event === 'payment.succeeded' || event === 'payment.waiting_for_capture') {
            const result = await PaymentService.handleWebhook(object.id);
            res.status(200).send('OK');
        } else {
            res.status(200).send('OK');
        }
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error');
    }
});

app.get('/health', (_, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

async function startServer() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env');
        }

        await mongoose.connect(process.env.MONGODB_URI).catch(err => {
            console.error('MongoDB connection error:', err);
        });
        console.log('✅ MongoDB connected');

        app.listen(PORT, () => {
            console.log(`🚀 Webhook server running on port ${PORT}`);
            console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook/yookassa`);
        });
    } catch (error) {
        console.error('Server startup error:', error);
    }
}

export { app, startServer };