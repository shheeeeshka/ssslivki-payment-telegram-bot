import fs from 'fs/promises';
import path from 'path';
import { Markup } from 'telegraf';
import { Video } from '../models/Video.js';

interface Button {
    text: string;
    url?: string;
    action?: string;
}

interface VideoLesson {
    id: string;
    telegramFileId?: string;
    video_url?: string;
    thumbnail?: string;
    caption: string;
    buttons: Button[];
}

interface StartMessage {
    id: string;
    text: string;
    buttons: Button[];
    photos: string[];
}

interface PostMessage {
    id: string;
    text: string;
    photos: string[];
    buttons: Button[];
}

interface TariffMessage {
    id: string;
    text: string;
    photos: string[];
    buttons: Button[];
    button_caption?: string;
}

interface AfterPaymentMessage {
    id: string;
    text: string;
    photos: string[];
}

interface MessagesData {
    start_message: StartMessage;
    video_lesson: VideoLesson;
    post_2: PostMessage;
    post_3: PostMessage;
    post_4: PostMessage;
    tariff_message: TariffMessage;
    after_payment_tariff_1: AfterPaymentMessage;
    after_payment_tariff_2: AfterPaymentMessage;
}

class MessageService {
    private messages: MessagesData | null = null;

    constructor() {
        this.loadMessages();
    }

    private async loadMessages() {
        try {
            const data = await fs.readFile(
                path.join(process.cwd(), 'data', 'messages.json'),
                'utf-8'
            );
            this.messages = JSON.parse(data);
        } catch (error) {
            console.error('Error loading messages:', error);
            this.messages = {
                start_message: {
                    id: "pre_start",
                    text: "Привет, красотка! 🤍✨\n\nРада, что ты здесь.\nЯ — Вика Сливки, бьюти-блогер, работала с крупными бьюти-брендами от D'Alba до Loreal, визажист, и помогу тебе сделать **чистый и эффектный новогодний макияж своими руками** — без визажиста и тонны ненужной косметики.\n\nЯ подготовила для тебя **бесплатный урок** 💌, который поможет начать уже сегодня.",
                    buttons: [],
                    photos: ["photos/1.jpg"]
                },
                video_lesson: {
                    id: "video_lesson",
                    video_url: "https://example.com/videos/flaming_horse_lesson.mp4",
                    thumbnail: "photos/video_thumb.jpg",
                    caption: "**Бесплатный урок: Flaming Horse Makeup Новогодний макияж 2026** 🎄🖤\n\nВ этом уроке ты узнаешь:\n— как сделать идеальный тон\n— какие ошибки делают при построении стрелки\n— как сделать макияж на удачу в год лошади: трендовый шоколадный макияж сезона\n\nСохраняй & будь самой роскошной в эту новогоднюю ночь!",
                    buttons: [
                        {
                            text: "💌 Смотри урок здесь",
                            url: "https://example.com/videos/flaming_horse_lesson.mp4"
                        }
                    ]
                },
                post_2: {
                    id: "post_2",
                    text: "Дорогая, рада, что ты посмотрела урок! 🎄\n\nНовогодний макияж кажется сложным не потому, что ты «не умеешь»,\nа потому что никто не показал **систему**.\n\nЧасто новогодний макияж ищут как: *«идею на один вечер»*\n\nНо! Важно не просто «повторить», а **освоить технику**, чтобы:\n— делать разные варианты образов\n— менять акценты под платье, настроение, формат праздника\n— чувствовать себя уверенно без визажиста\n\nИменно этому я и учу в своем **закрытом предновогоднем тг-канале для girl's girls🎄** — не шаблонам, а **работающей системе макияжа**",
                    photos: ["photos/1.jpg"],
                    buttons: [
                        {
                            text: "Хочу личную систему макияжа до НГ!🎄",
                            action: "show_tariffs"
                        }
                    ]
                },
                post_3: {
                    id: "post_3",
                    text: "Дорогая, рада, что ты посмотрела урок! 🎄\n\nНовогодний макияж кажется сложным не потому, что ты «не умеешь»,\nа потому что никто не показал **систему**.\n\nЧасто новогодний макияж ищут как: *«идею на один вечер»*\n\nНо! Важно не просто «повторить», а **освоить технику**, чтобы:\n— делать разные варианты образов\n— менять акценты под платье, настроение, формат праздника\n— чувствовать себя уверенно без визажиста\n\nИменно этому я и учу в своем **закрытом предновогоднем тг-канале для girl's girls🎄** — не шаблонам, а **работающей системе макияжа**",
                    photos: ["photos/2.jpeg", "photos/3.jpeg"],
                    buttons: [
                        {
                            text: "Хочу личную систему макияжа до НГ!🎄",
                            action: "show_tariffs"
                        }
                    ]
                },
                post_4: {
                    id: "post_4",
                    text: "**«Home alone Home Glow: Новогодний макияж своими руками» 🦌 ☕🧣🧺🧸**\n\nПредновогодний клуб по макияжу — пошаговая система из 3 видео-уроков + мои авторские техники чистого макияжа.\n\n**Чтобы ты:**\n— сделала макияж сама БЕЗ визажиста и сложных техник\n— получила чистый результат, а не маску\n— выглядела эффектно и уверенно со стойким макияжем\n\n**📦 Что внутри клуба:**\n🧦 Урок 1 — Christmas Sparkle Red Makeup: красные блестящие губы и легкая дымка\n❄️ Урок 2 — Frozen makeup: тренд 2026\n💄 Урок 3 — Extra rich chic makeup: бронзовые смоки, «дорогой» образ\n\n**🎁 Бонус** — мои фишки и любимые приёмы, подборки «хочу/могу»\n\n**Кому подойдет?**\n🤍 Новичкам в макияже\n🤍 Тем, кто идёт на корпоратив или новогоднюю вечеринку\n🤍 Тем, кто хочет получить мои авторские техники чистого макияжа без визажиста\n🤍 Бьюти-блогерам",
                    photos: ["photos/5.jpeg", "photos/6.jpeg"],
                    buttons: []
                },
                tariff_message: {
                    id: "tariff_message",
                    text: "**1 тариф. Home Glow Alone 🧣🧸🎀🎄**\n\n**Самостоятельный формат — 3 000 ₽ (= 1 румяна)**\n\n🥨 3 видео-урока\n🥨 авторские техники\n🥨 доступ сразу\n\n**2 тариф. Home Glow w/help☕🍪🤎📜🧸**\n\n**С обратной связью от меня — 5 000 ₽ (=1 палетка теней)**\n\n🥨 всё из самостоятельного формата\n🥨 моя личная обратная связь по твоему макияжу\n🥨 рекомендации и корректировки\n🥨 разбор косметички",
                    photos: ["photos/tariff_1.jpg", "photos/tariff_2.jpg"],
                    buttons: [
                        {
                            text: "🧸 Купить 1 тариф (без обратной связи)",
                            action: "pay_tariff_1"
                        },
                        {
                            text: "🎀🎄 Купить 2 тариф (с обратной связью)",
                            action: "pay_tariff_2"
                        }
                    ],
                    button_caption: "Осталось только кликнуть и курс твой! ✨"
                },
                after_payment_tariff_1: {
                    id: "after_payment_tariff_1",
                    text: "Добро пожаловать, красотка! Ты оформила **самостоятельный формат** 🍓🥨⭐️\n\nДоступ ко всем урокам уже открыт:\n[ссылка на доступ в закрытый тг-канал]\n\nПриятного обучения и красивого Нового года! 🎄✨",
                    photos: ["photos/after_payment_1.jpg", "photos/after_payment_2.jpg"]
                },
                after_payment_tariff_2: {
                    id: "after_payment_tariff_2",
                    text: "Красотка, добро пожаловать! Ты оформила формат **с моей обратной связью** 🥨🍓✨\n\nДоступ ко всем урокам уже открыт: [вступить в клуб]\n\nЧтобы я могла проверить твой макияж и дать рекомендации:\n1. Сделай фото своего макияжа до и после уроков, а также косметичку\n2. Пришли мне сюда (в этот чат)\n3. Я дам комментарии и подскажу, как улучшить результат\n\nПриятного обучения и красивого Нового года! 🎄✨",
                    photos: ["photos/after_payment_1.jpg", "photos/after_payment_2.jpg"]
                }
            };
        }
    }

    getStartMessage(): StartMessage {
        return this.messages!.start_message;
    }

    async getVideoLesson(): Promise<VideoLesson> {
        const lesson = { ...this.messages!.video_lesson };

        try {
            const video = await Video.findOne({ name: 'video_lesson' });
            if (video && video.fileId) {
                lesson.telegramFileId = video.fileId;
            }
        } catch (error) {
            console.error('Error getting video from DB:', error);
        }

        return lesson;
    }

    getPost2(): PostMessage {
        return this.messages!.post_2;
    }

    getPost3(): PostMessage {
        return this.messages!.post_3;
    }

    getPost4(): PostMessage {
        return this.messages!.post_4;
    }

    getTariffMessage(): TariffMessage {
        return this.messages!.tariff_message;
    }

    getAfterPaymentTariff1(): AfterPaymentMessage {
        return this.messages!.after_payment_tariff_1;
    }

    getAfterPaymentTariff2(): AfterPaymentMessage {
        return this.messages!.after_payment_tariff_2;
    }

    setVideoFileId(fileId: string) {
        console.log('upd: fileid', fileId);
        if (this.messages) {
            this.messages.video_lesson.telegramFileId = fileId;
        }
    }

    clearVideoFileId() {
        if (this.messages) {
            this.messages.video_lesson.telegramFileId = '';
        }
    }

    getVideoLessonWithoutCaption(): VideoLesson {
        const lesson = { ...this.messages!.video_lesson };
        lesson.caption = '';
        return lesson;
    }

    async sendTelegramVideo(ctx: any, fileId: string, caption?: string, buttons?: any[]) {
        try {
            const options: any = {
                parse_mode: 'HTML',
                protect_content: true
            };

            if (caption) {
                const formattedCaption = caption
                    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                    .replace(/~~(.*?)~~/g, '<s>$1</s>')
                    .replace(/\*(.*?)\*/g, '<i>$1</i>');
                options.caption = formattedCaption;
            }

            if (buttons && buttons.length > 0) {
                const inlineKeyboard = buttons.map(button => {
                    if (button.url) {
                        return [Markup.button.url(button.text, button.url)];
                    }
                    return [];
                }).filter(row => row.length > 0);

                if (inlineKeyboard.length > 0) {
                    options.reply_markup = Markup.inlineKeyboard(inlineKeyboard).reply_markup;
                }
            }

            await ctx.replyWithVideo(fileId, options);
            return true;
        } catch (error) {
            console.error('Error sending Telegram video:', error);
            return false;
        }
    }
}

export const messageService = new MessageService();
