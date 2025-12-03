import { Telegraf } from 'telegraf'
import dotenv from 'dotenv'

dotenv.config()

const token = process.env.BOT_TOKEN

if (!token) {
    console.error('❌ ОШИБКА: Установите BOT_TOKEN в .env файле')
    process.exit(1)
}

const bot = new Telegraf(token)

// Команда /start
bot.start((ctx) => {
    console.log(`👤 Новый пользователь: ${ctx.from.username || ctx.from.first_name}`)
    ctx.reply(
        `👋 Привет ${ctx.from.first_name}!\n\n` +
        `✅ Бот успешно запущен!\n` +
        `🆔 Ваш ID: ${ctx.from.id}\n` +
        `📝 Для проверки отправьте /ping`
    )
})

// Команда /ping
bot.command('ping', (ctx) => {
    console.log(`🏓 Ping от ${ctx.chat.id}`)
    ctx.reply('🏓 Pong! Бот работает на Telegraf!')
})

// Простое эхо
bot.on('text', (ctx) => {
    if (!ctx.message.text.startsWith('/')) {
        ctx.reply(`Вы сказали: "${ctx.message.text}"`)
    }
})

// Обработка ошибок
bot.catch((err, ctx) => {
    console.error(`❌ Ошибка для ${ctx.updateType}:`, err)
    ctx.reply('Произошла ошибка, попробуйте позже')
})

// Запуск бота
console.log('🚀 Запуск бота на Telegraf...')
bot.launch().then(() => {
    console.log('✅ Бот успешно запущен!')
    console.log('📱 Отправьте /start вашему боту в Telegram')
    console.log('🛑 Для остановки нажмите Ctrl+C')
})

// Корректное завершение
process.once('SIGINT', () => {
    console.log('\n🛑 Остановка бота...')
    bot.stop('SIGINT')
})
process.once('SIGTERM', () => {
    console.log('\n🛑 Остановка бота...')
    bot.stop('SIGTERM')
})