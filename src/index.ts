import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { startServer } from './server.js';
import { checkAccess } from './middleware/auth.js';
import { PaymentService } from './services/PaymentService.js';
import { User } from './models/User.js';
import { messageService } from './services/MessageService.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
    console.error('❌ ОШИБКА: Установите BOT_TOKEN в .env файле');
    process.exit(1);
}

const bot = new Telegraf(token);
(global as any).bot = bot;

bot.use(checkAccess);

async function sendMessageWithPhotos(ctx: any, text: string, photos: string[], buttons?: any[]) {
    try {
        const messageOptions: any = { parse_mode: 'Markdown' };

        if (buttons && buttons.length > 0) {
            const inlineKeyboard = buttons.map(button => {
                if (button.url) {
                    return [Markup.button.url(button.text, button.url)];
                } else if (button.action) {
                    return [Markup.button.callback(button.text, button.action)];
                }
                return [];
            }).filter(row => row.length > 0);

            if (inlineKeyboard.length > 0) {
                messageOptions.reply_markup = Markup.inlineKeyboard(inlineKeyboard).reply_markup;
            }
        }

        if (photos && photos.length > 0) {
            const existingPhotos = photos.filter(photo => {
                const absolutePath = path.isAbsolute(photo) ? photo : path.join(process.cwd(), photo);
                return fs.existsSync(absolutePath);
            });

            if (existingPhotos.length === 0) {
                await ctx.reply(text, messageOptions);
                return;
            }

            if (existingPhotos.length === 1) {
                const absolutePath = path.isAbsolute(existingPhotos[0]) ? existingPhotos[0] : path.join(process.cwd(), existingPhotos[0]);
                messageOptions.caption = text;
                await ctx.replyWithPhoto({ source: absolutePath }, messageOptions);
            } else {
                const mediaGroup = existingPhotos.map((photo, index) => {
                    const absolutePath = path.isAbsolute(photo) ? photo : path.join(process.cwd(), photo);
                    return {
                        type: 'photo',
                        media: { source: absolutePath },
                        caption: index === 0 ? text : undefined,
                        parse_mode: 'Markdown'
                    };
                });

                await ctx.replyWithMediaGroup(mediaGroup);

                if (buttons && buttons.length > 0) {
                    await ctx.reply('👇', messageOptions);
                }
            }
        } else {
            await ctx.reply(text, messageOptions);
        }
    } catch (error) {
        console.error(`Error sending message with photos:`, error);
        await ctx.reply(text, { parse_mode: 'Markdown' });
    }
}

async function sendVideoByUrl(ctx: any, videoUrl: string, caption?: string, thumbnail?: string, buttons?: any[], photos?: string[]) {
    try {
        const options: any = {
            parse_mode: 'Markdown'
        };

        if (caption) {
            options.caption = caption;
        }

        if (thumbnail) {
            const absolutePath = path.isAbsolute(thumbnail) ? thumbnail : path.join(process.cwd(), thumbnail);
            if (fs.existsSync(absolutePath)) {
                options.thumbnail = { source: absolutePath };
            }
        }

        if (buttons && buttons.length > 0) {
            const inlineKeyboard = buttons.map(button => {
                if (button.url) {
                    return [Markup.button.url(button.text, button.url)];
                } else if (button.action) {
                    return [Markup.button.callback(button.text, button.action)];
                }
                return [];
            }).filter(row => row.length > 0);

            if (inlineKeyboard.length > 0) {
                options.reply_markup = Markup.inlineKeyboard(inlineKeyboard).reply_markup;
            }
        }

        await ctx.replyWithVideo(videoUrl, options);
    } catch (error) {
        console.error(`Error sending video by URL ${videoUrl}:`, error);

        if (photos && photos.length > 0) {
            await sendMessageWithPhotos(ctx, caption || '', photos, buttons);
        } else {
            const textOptions: any = { parse_mode: 'Markdown' };

            if (buttons && buttons.length > 0) {
                const inlineKeyboard = buttons.map(button => {
                    if (button.url) {
                        return [Markup.button.url(button.text, button.url)];
                    } else if (button.action) {
                        return [Markup.button.callback(button.text, button.action)];
                    }
                    return [];
                }).filter(row => row.length > 0);

                if (inlineKeyboard.length > 0) {
                    textOptions.reply_markup = Markup.inlineKeyboard(inlineKeyboard).reply_markup;
                }
            }

            await ctx.reply(caption || 'Видео недоступно', textOptions);
        }
    }
}

bot.start(async (ctx) => {
    const startMessage = messageService.getStartMessage();
    await sendMessageWithPhotos(ctx, startMessage.text, startMessage.photos, startMessage.buttons);

    // setTimeout(async () => {
    //     const videoLesson = messageService.getVideoLesson();
    //     await sendVideoByUrl(ctx, videoLesson.video_url, videoLesson.caption, videoLesson.thumbnail, videoLesson.buttons);
    // }, 100);

    setTimeout(async () => {
        const post2 = messageService.getPost2();
        await sendMessageWithPhotos(ctx, post2.text, post2.photos, post2.buttons);
    }, 100);

    setTimeout(async () => {
        const post3 = messageService.getPost3();
        await sendMessageWithPhotos(ctx, post3.text, post3.photos, post3.buttons);
    }, 61000);
});

bot.action('show_tariffs', async (ctx) => {
    await ctx.answerCbQuery();
    await showTariffs(ctx);
});

bot.command('pay', async (ctx) => {
    await showTariffs(ctx);
});

async function showTariffs(ctx: any) {
    const user = (ctx as any).user;

    if (user.hasAccess) {
        return ctx.reply('✅ У вас уже есть доступ к каналу!');
    }

    const tariffMessage = messageService.getTariffMessage();

    const keyboard = Markup.inlineKeyboard([
        tariffMessage.buttons.map(button => Markup.button.callback(button.text, button.action!))
    ]);

    await ctx.reply(tariffMessage.text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
    });
}

bot.action(/pay_tariff_(1|2)/, async (ctx) => {
    const user = (ctx as any).user;
    const tariffNumber = ctx.match[1];

    let amount, description;

    if (tariffNumber === '1') {
        amount = 3000;
        description = 'Тариф 1: Home Glow Alone (самостоятельный формат) - 3000 руб.';
    } else {
        amount = 5000;
        description = 'Тариф 2: Home Glow w/help (с обратной связью) - 5000 руб.';
    }

    await ctx.answerCbQuery();

    try {
        const result = await PaymentService.createPayment(
            user.telegramId,
            amount,
            description
        );

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.url('💳 Оплатить', result.confirmationUrl!)]
        ]);

        await ctx.reply(
            `💸 Выбран тариф ${tariffNumber}: ${amount} руб.\n\n` +
            `Для оплаты перейдите по ссылке ниже. После успешной оплаты вы автоматически получите доступ к каналу.`,
            keyboard
        );
    } catch (error) {
        console.error('Payment creation error:', error);
        await ctx.reply('❌ Ошибка при создании платежа. Попробуйте позже.');
    }
});

bot.command('history', async (ctx) => {
    const user = (ctx as any).user;

    const payments = await PaymentService.getUserPayments(user.telegramId);

    if (payments.length === 0) {
        return ctx.reply('📭 У вас нет платежей');
    }

    let message = '📋 История платежей:\n\n';

    payments.forEach((payment, index) => {
        const date = new Date(payment.createdAt).toLocaleDateString('ru-RU');
        message += `${index + 1}. ${date} - ${payment.amount} руб.\n`;
        message += `Статус: ${payment.status}\n`;
        if (payment.description) {
            message += `Описание: ${payment.description}\n`;
        }
        message += '\n';
    });

    await ctx.reply(message);
});

bot.command('admin', async (ctx) => {
    const user = (ctx as any).user;

    if (!user.isAdmin) {
        return ctx.reply('❌ У вас нет прав администратора');
    }

    const usersCount = await User.countDocuments();
    const paymentsCount = await mongoose.connection.db?.collection('payments').countDocuments();

    await ctx.reply(
        `👑 Админ-панель\n\n` +
        `👥 Пользователей: ${usersCount}\n` +
        `💳 Платежей: ${paymentsCount}\n\n` +
        `Команды:\n` +
        `/users - список пользователей\n` +
        `/stats - статистика`
    );
});

bot.on('text', async (ctx) => {
    if (!ctx.message.text.startsWith('/')) {
        const user = (ctx as any).user;

        if (user.hasAccess) {
            await ctx.reply(`✅ Вы имеете доступ к каналу!\n🔗 Ссылка: ${process.env.SECRET_LINK}`);
        } else {
            await ctx.reply('❌ У вас нет доступа к каналу. Используйте /pay для оплаты.');
        }
    }
});

async function startBot() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ MongoDB connected');

        await startServer();

        await bot.launch();
        console.log('✅ Бот успешно запущен!');

        const stopBot = () => {
            console.log('\n🛑 Останавливаем бота...');
            bot.stop();
            mongoose.disconnect().then(() => {
                console.log('✅ MongoDB отключен');
                process.exit(0);
            });
        };

        process.once('SIGINT', stopBot);
        process.once('SIGTERM', stopBot);

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Необработанное отклонение промиса:', reason);
        });

        process.on('uncaughtException', (error) => {
            console.error('❌ Необработанное исключение:', error);
            stopBot();
        });

    } catch (error) {
        console.error('Startup error:', error);
        process.exit(1);
    }
}

startBot();