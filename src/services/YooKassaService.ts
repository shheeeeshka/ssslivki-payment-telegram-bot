import { YooCheckout } from '@a2seven/yoo-checkout';
import type { ICreatePayment } from '@a2seven/yoo-checkout';
import dotenv from 'dotenv';

dotenv.config();

const checkout = new YooCheckout({
    shopId: process.env.YOOKASSA_SHOP_ID!,
    secretKey: process.env.YOOKASSA_SECRET_KEY!
});

export class YooKassaService {
    static async createPayment(amount: number, description: string, userId: number) {
        const paymentData: ICreatePayment = {
            amount: {
                value: amount.toFixed(2),
                currency: 'RUB'
            },
            payment_method_data: {
                type: 'bank_card'
            },
            confirmation: {
                type: 'redirect',
                return_url: process.env.YOOKASSA_RETURN_URL || `https://t.me/${process.env.BOT_USERNAME}`
            },
            capture: true,
            description,
            metadata: {
                userId: userId.toString(),
                testMode: process.env.YOOKASSA_TEST_MODE === 'true'
            }
        };

        try {
            const payment = await checkout.createPayment(paymentData);
            console.log(`Payment created: ${payment.id} (test: ${process.env.YOOKASSA_TEST_MODE === 'true'})`);
            return payment;
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        }
    }

    static async getPayment(paymentId: string) {
        try {
            const payment = await checkout.getPayment(paymentId);
            return payment;
        } catch (error) {
            console.error('Error getting payment:', error);
            throw error;
        }
    }

    static async capturePayment(paymentId: string, amount: number) {
        try {
            const payment = await checkout.capturePayment(paymentId, {
                amount: {
                    value: amount.toFixed(2),
                    currency: 'RUB'
                }
            });
            return payment;
        } catch (error) {
            console.error('Error capturing payment:', error);
            throw error;
        }
    }

    static async cancelPayment(paymentId: string) {
        try {
            const payment = await checkout.cancelPayment(paymentId);
            return payment;
        } catch (error) {
            console.error('Error canceling payment:', error);
            throw error;
        }
    }
}