import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { YooKassaService } from './YooKassaService.js';
import { messageService } from './MessageService.js';

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

                    let messageData;
                    let messageText = '';

                    if (payment.description?.includes('Тариф 1')) {
                        messageData = messageService.getAfterPaymentTariff1();
                        messageText = messageData.text.replace('[ссылка на доступ в закрытый тг-канал]', secretLink || '');
                    } else if (payment.description?.includes('Тариф 2')) {
                        messageData = messageService.getAfterPaymentTariff2();
                        messageText = messageData.text.replace('[вступить в клуб]', secretLink || '');
                    } else {
                        messageText = `✅ Оплата успешно получена!\n🔗 Ссылка на закрытый канал: ${secretLink}\n\nТеперь у вас есть доступ.`;
                    }

                    if (messageData && messageData.photos && messageData.photos.length > 0) {
                        try {
                            const photos = messageData.photos;
                            const mediaGroup = photos.map((photo, index) => ({
                                type: 'photo',
                                media: { source: photo },
                                caption: index === 0 ? messageText : undefined,
                                parse_mode: 'Markdown'
                            }));

                            await bot.telegram.sendMediaGroup(payment.userId, mediaGroup);
                        } catch (photoError) {
                            console.error('Error sending photos:', photoError);
                            await bot.telegram.sendMessage(
                                payment.userId,
                                messageText,
                                { parse_mode: 'Markdown' }
                            );
                        }
                    } else {
                        await bot.telegram.sendMessage(
                            payment.userId,
                            messageText,
                            { parse_mode: 'Markdown' }
                        );
                    }
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