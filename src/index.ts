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
import { Video } from './models/Video.js';

dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
    console.error('❌ ОШИБКА: Установите BOT_TOKEN в .env файле');
    process.exit(1);
}

const adminUploadStates = new Map<number, boolean>();
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
        await ctx.reply(text, { parse_mode: 'Markdown', protect_content: true });
    }
}

async function sendVideoByUrl(ctx: any, videoUrl: string, caption?: string, thumbnail?: string, buttons?: any[], photos?: string[]) {
    try {
        const options: any = {
            parse_mode: 'Markdown',
            protect_content: true
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
    }, 30000);
});

bot.action('show_tariffs', async (ctx) => {
    await ctx.answerCbQuery();
    await showDetails(ctx);

    setTimeout(async () => {
        await showTariffs(ctx);
    }, 2000);
});

bot.command('pay', async (ctx) => {
    await showTariffs(ctx);
});

bot.action('admin_upload_video', async (ctx) => {
    const user = (ctx as any).user;

    if (!user.isAdmin) {
        await ctx.answerCbQuery('❌ Требуются права администратора');
        return;
    }

    await ctx.answerCbQuery();

    adminUploadStates.set(user.telegramId, true);

    setTimeout(() => {
        adminUploadStates.delete(user.telegramId);
    }, 300000);

    await ctx.reply(
        '📤 Отправьте видео для урока:\n\n' +
        '• Максимальный размер: 2 ГБ\n' +
        '• Формат: MP4, MOV, AVI\n' +
        '• Просто отправьте видео файл\n\n' +
        '❌ Отправка отменяется через 5 минут'
    );
});

bot.on('video', async (ctx) => {
    const user = (ctx as any).user;

    if (!user || !user.isAdmin) return;

    if (!adminUploadStates.get(user.telegramId)) {
        console.log(`Not in upload state for user ${user.telegramId}`);
        return;
    }

    adminUploadStates.delete(user.telegramId);

    const video = ctx.message.video;

    await ctx.reply('📥 Получил видео, начинаю обработку...');

    if (!video.file_size) {
        return ctx.reply('❌ Не удалось получить размер файла');
    }

    if (video.file_size > 2000 * 1024 * 1024) {
        return ctx.reply('❌ Файл слишком большой (максимум 2 ГБ)');
    }

    if (!video.file_id) {
        return ctx.reply('❌ Не удалось получить File ID');
    }

    try {
        await ctx.reply('⏳ Загружаю видео в Telegram Cloud...');

        const videoDoc = await Video.findOneAndUpdate(
            { name: 'video_lesson' },
            {
                name: 'video_lesson',
                fileId: video.file_id,
                fileSize: video.file_size,
                duration: video.duration || 0,
                mimeType: video.mime_type || 'video/mp4'
            },
            { upsert: true, new: true }
        );

        messageService.setVideoFileId(video.file_id);

        await ctx.replyWithVideo(
            video.file_id,
            {
                caption: `✅ Видео успешно загружено!\n\n` +
                    `📊 Информация:\n` +
                    `• Размер: ${(video.file_size / (1024 * 1024)).toFixed(2)} МБ\n` +
                    `• Длительность: ${video.duration || 'Неизвестно'} сек.\n` +
                    `• MIME: ${video.mime_type || 'Не указан'}\n` +
                    `• File ID: ${video.file_id.substring(0, 30)}...\n\n` +
                    `Теперь видео будет отправляться через Telegram Cloud`,
                parse_mode: 'Markdown',
                protect_content: true
            }
        );

        console.log(`✅ Video uploaded: ${video.file_id}`);

    } catch (error) {
        console.error('Error saving video:', error);
        await ctx.reply('❌ Ошибка при сохранении видео');
    }
});

bot.command('delete_video', async (ctx) => {
    const user = (ctx as any).user;
    if (!user.isAdmin) return;

    const videos = await Video.find().sort({ createdAt: -1 });

    if (videos.length === 0) {
        return ctx.reply('📭 Нет загруженных видео для удаления');
    }

    const buttons = videos.map((video, index) => {
        const shortId = video._id.toString().substring(18, 24);
        return [Markup.button.callback(
            `❌ ${index + 1}. ${video.name}`,
            `delvid_${shortId}`
        )];
    });

    buttons.push([Markup.button.callback('🔙 Отмена', 'cancel_delete')]);

    await ctx.reply(
        '🗑️ Выберите видео для удаления:',
        Markup.inlineKeyboard(buttons)
    );
});

bot.action('cancel_delete', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
});

bot.action(/^delvid_(.+)/, async (ctx) => {
    const user = (ctx as any).user;
    if (!user.isAdmin) return;

    const shortId = ctx.match[1];

    if (!shortId) {
        await ctx.answerCbQuery('❌ Неверный ID видео');
        return;
    }

    try {
        const videos = await Video.find().sort({ createdAt: -1 });
        const video = videos.find(v => v._id.toString().includes(shortId));

        if (!video) {
            await ctx.answerCbQuery('❌ Видео не найдено');
            return;
        }

        await Video.findByIdAndDelete(video._id);

        if (video.name === 'video_lesson') {
            messageService.clearVideoFileId();
        }

        await ctx.answerCbQuery('✅ Видео удалено');
        await ctx.deleteMessage();

        await ctx.reply(`✅ Видео "${video.name}" успешно удалено`);
    } catch (error) {
        console.error('Error deleting video:', error);
        await ctx.answerCbQuery('❌ Ошибка при удалении');
    }
});

bot.action(/^delete_video_/, async (ctx) => {
    const user = (ctx as any).user;
    if (!user.isAdmin) return;

    const match = ctx.match[0];
    const videoId = match.replace('delete_video_', '');
    console.log({ match, videoId });

    if (!videoId) {
        await ctx.answerCbQuery('❌ Неверный ID видео');
        return;
    }

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            await ctx.answerCbQuery('❌ Видео не найдено');
            return;
        }

        await Video.findByIdAndDelete(videoId);

        if (video.name === 'video_lesson') {
            messageService.clearVideoFileId();
        }

        await ctx.answerCbQuery('✅ Видео удалено');
        await ctx.deleteMessage();

        await ctx.reply(`✅ Видео "${video.name}" успешно удалено`);
    } catch (error) {
        console.error('Error deleting video:', error);
        await ctx.answerCbQuery('❌ Ошибка при удалении');
    }
});

bot.command('upload_lesson', async (ctx) => {
    const user = (ctx as any).user;
    if (!user.isAdmin) {
        return ctx.reply('❌ Требуются права администратора');
    }

    adminUploadStates.set(user.telegramId, true);

    setTimeout(() => {
        adminUploadStates.delete(user.telegramId);
    }, 300000);

    await ctx.reply(
        '📤 Отправьте видео для урока:\n\n' +
        '• Максимальный размер: 2 ГБ\n' +
        '• Формат: MP4, MOV, AVI\n' +
        '• Просто отправьте видео файл\n\n' +
        '❌ Отменяется через 5 минут'
    );
});

bot.command('videos', async (ctx) => {
    const user = (ctx as any).user;
    if (!user.isAdmin) return;

    const videos = await Video.find().sort({ createdAt: -1 });

    if (videos.length === 0) {
        return ctx.reply('📭 Нет загруженных видео');
    }

    let message = '📹 Загруженные видео:\n\n';

    videos.forEach((video, index) => {
        const sizeMB = video.fileSize ? (video.fileSize / (1024 * 1024)).toFixed(2) : '?';
        message += `${index + 1}. ${video.name}\n`;
        message += `   📏 ${sizeMB} МБ | ⏱ ${video.duration || '?'} сек.\n`;
        message += `   📅 ${video.createdAt.toLocaleDateString('ru-RU')}\n`;
        message += `   🆔 ${video.fileId.substring(0, 20)}...\n\n`;
    });

    message += '\n❌ Для удаления используйте команду /delete_video';

    await ctx.reply(message);
});

async function showDetails(ctx: any) {
    const detailMessage = messageService.getPost4();

    try {
        if (detailMessage.photos && detailMessage.photos.length > 0) {
            if (detailMessage.photos.length >= 2) {
                const mediaGroup = detailMessage.photos.map((photo, index) => {
                    const absolutePath = path.isAbsolute(photo) ? photo : path.join(process.cwd(), photo);
                    return {
                        type: 'photo',
                        media: { source: absolutePath },
                        caption: index === 0 ? detailMessage.text : undefined,
                        parse_mode: 'Markdown'
                    };
                });

                await ctx.replyWithMediaGroup(mediaGroup);
            } else if (detailMessage.photos.length === 1) {
                const photo = detailMessage.photos[0];
                const absolutePath = path.isAbsolute(photo) ? photo : path.join(process.cwd(), photo);
                await ctx.replyWithPhoto(
                    { source: absolutePath },
                    { caption: detailMessage.text, parse_mode: 'Markdown' }
                );
            }
        } else {
            await ctx.reply(detailMessage.text, { parse_mode: 'Markdown' });
        }

        if (detailMessage.buttons && detailMessage.buttons.length > 0) {
            const keyboardButtons = detailMessage.buttons.map(button => {
                if (button.action) {
                    return [Markup.button.callback(button.text, button.action)];
                }
                return [];
            }).filter(row => row.length > 0);

            if (keyboardButtons.length > 0) {
                setTimeout(async () => {
                    await ctx.reply(
                        '👇',
                        Markup.inlineKeyboard(keyboardButtons)
                    );
                }, 100);
            }
        }
    } catch (error) {
        console.error('Error showing details:', error);
        await ctx.reply(detailMessage.text, {
            parse_mode: 'Markdown',
            reply_markup: Markup.inlineKeyboard([
                detailMessage.buttons.map(button => Markup.button.callback(button.text, button.action!))
            ]).reply_markup
        });
    }
}

async function showTariffs(ctx: any) {
    const user = (ctx as any).user;

    if (user.hasAccess) {
        return ctx.reply('✅ У вас уже есть доступ к каналу!');
    }

    const tariffMessage = messageService.getTariffMessage();

    try {
        if (tariffMessage.photos && tariffMessage.photos.length >= 2) {
            const mediaGroup = tariffMessage.photos.map((photo, index) => {
                const absolutePath = path.isAbsolute(photo) ? photo : path.join(process.cwd(), photo);
                return {
                    type: 'photo',
                    media: { source: absolutePath },
                    caption: index === 0 ? tariffMessage.text : undefined,
                    parse_mode: 'Markdown'
                };
            });

            await ctx.replyWithMediaGroup(mediaGroup);
        } else if (tariffMessage.photos && tariffMessage.photos.length === 1) {
            const photo = tariffMessage.photos[0];
            const absolutePath = path.isAbsolute(photo) ? photo : path.join(process.cwd(), photo);
            await ctx.replyWithPhoto(
                { source: absolutePath },
                { caption: tariffMessage.text, parse_mode: 'Markdown' }
            );
        } else {
            await ctx.reply(tariffMessage.text, { parse_mode: 'Markdown' });
        }

        await ctx.reply(
            tariffMessage.button_caption || '👇',
            Markup.inlineKeyboard([
                tariffMessage.buttons.map(button => Markup.button.callback(button.text, button.action!))
            ])
        );
    } catch (error) {
        console.error('Error showing tariffs:', error);
        await ctx.reply(tariffMessage.text, {
            parse_mode: 'Markdown',
            reply_markup: Markup.inlineKeyboard([
                tariffMessage.buttons.map(button => Markup.button.callback(button.text, button.action!))
            ]).reply_markup
        });
    }
}

async function sendVideoLesson(ctx: any) {
    const videoLesson = await messageService.getVideoLesson();

    if (videoLesson.telegramFileId) {
        const success = await messageService.sendTelegramVideo(
            ctx,
            videoLesson.telegramFileId,
            videoLesson.caption,
            videoLesson.buttons
        );

        if (success) return;
    }

    if (videoLesson.video_url) {
        await sendVideoByUrl(ctx, videoLesson.video_url, videoLesson.caption,
            videoLesson.thumbnail, videoLesson.buttons);
    }
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

bot.action('watch_free_lesson', async (ctx) => {
    await ctx.answerCbQuery();

    const videoLesson = await messageService.getVideoLesson();

    if (videoLesson.telegramFileId) {
        try {
            await ctx.replyWithVideo(videoLesson.telegramFileId);
            return;
        } catch (error) {
            console.error('Telegram video error:', error);
        }
    }

    if (videoLesson.video_url) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.url('💌 Смотри урок здесь', videoLesson.video_url)]
        ]);
        await ctx.reply('📹 Видео доступно по ссылке:', keyboard);
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
        `/stats - статистика\n` +
        `/videos - список видео\n` +
        `/delete_video - удалить видео`,
        Markup.inlineKeyboard([
            [Markup.button.callback('📤 Загрузить видео для урока', 'admin_upload_video')],
            [Markup.button.callback('🗑️ Удалить видео', 'delete_video_admin')]
        ])
    );
});

bot.action('delete_video_admin', async (ctx) => {
    const user = (ctx as any).user;
    if (!user.isAdmin) return;

    await ctx.answerCbQuery();
    await ctx.deleteMessage();

    const videos = await Video.find().sort({ createdAt: -1 });

    if (videos.length === 0) {
        return ctx.reply('📭 Нет загруженных видео для удаления');
    }

    const buttons = videos.map((video, index) => {
        const shortId = video._id.toString().substring(18, 24);
        return [Markup.button.callback(
            `❌ ${index + 1}. ${video.name}`,
            `delvid_${shortId}`
        )];
    });

    buttons.push([Markup.button.callback('🔙 Отмена', 'cancel_delete')]);

    await ctx.reply(
        '🗑️ Выберите видео для удаления:',
        Markup.inlineKeyboard(buttons)
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