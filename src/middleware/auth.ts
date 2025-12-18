import { Context } from 'telegraf';
import { User } from '../models/User.js';

export async function checkAccess(ctx: Context, next: Function) {
    const userId = ctx.from?.id;

    if (!userId) {
        return ctx.reply('Ошибка идентификации пользователя');
    }

    let user = await User.findOne({ telegramId: userId });

    if (!user) {
        user = new User({
            telegramId: userId,
            username: ctx.from?.username,
            firstName: ctx.from?.first_name,
            lastName: ctx.from?.last_name
        });
        await user.save();
    }

    (ctx as any).user = user;
    return next();
}