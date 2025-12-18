import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { YooKassaService } from './YooKassaService.js';

export class PaymentService {
    static async createPayment(userId: number, amount: number, description: string) {
        try {
            const yooPayment = await YooKassaService.createPayment(amount, description, userId);

            const payment = new Payment({
                userId,
                paymentId: yooPayment.id,
                amount,
                description,
                status: yooPayment.status
            });

            await payment.save();
            return { payment, confirmationUrl: yooPayment.confirmation?.confirmation_url };
        } catch (error) {
            throw error;
        }
    }

    static async handleWebhook(paymentId: string) {
        try {
            const yooPayment = await YooKassaService.getPayment(paymentId);
            const payment = await Payment.findOne({ paymentId });

            if (!payment) {
                throw new Error('Payment not found');
            }

            payment.status = yooPayment.status;
            await payment.save();

            if (yooPayment.status === 'succeeded') {
                const user = await User.findOne({ telegramId: payment.userId });
                if (user) {
                    user.hasAccess = true;
                    await user.save();
                }

                const bot = (global as any).bot;
                if (bot) {
                    const secretLink = process.env.SECRET_LINK;
                    let welcomeMessage = '';

                    if (payment.description?.includes('Тариф 1')) {
                        welcomeMessage = `Добро пожаловать, красотка! Ты оформила **самостоятельный формат** 💄\n\nДоступ ко всем урокам уже открыт:\n${secretLink}\n\nПриятного обучения и красивого Нового года! 🎄✨`;
                    } else if (payment.description?.includes('Тариф 2')) {
                        welcomeMessage = `Красотка, добро пожаловать! Ты оформила формат **с моей обратной связью** ✨\n\nДоступ ко всем урокам уже открыт: ${secretLink}\n\nЧтобы я могла проверить твой макияж и дать рекомендации:\n1. Сделай фото своего макияжа до и после уроков, а также косметичку\n2. Пришли мне сюда (в этот чат)\n3. Я дам комментарии и подскажу, как улучшить результат\n\nПриятного обучения и красивого Нового года! 🎄✨`;
                    } else {
                        welcomeMessage = `✅ Оплата успешно получена!\n🔗 Ссылка на закрытый канал: ${secretLink}\n\nТеперь у вас есть доступ.`;
                    }

                    await bot.telegram.sendMessage(
                        payment.userId,
                        welcomeMessage
                    );
                }

                return { success: true, userId: payment.userId, payment };
            }

            return { success: false, status: yooPayment.status };
        } catch (error) {
            throw error;
        }
    }

    static async getUserPayments(userId: number) {
        return Payment.find({ userId }).sort({ createdAt: -1 });
    }
}