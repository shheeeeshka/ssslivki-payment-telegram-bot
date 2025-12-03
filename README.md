# SSSLIVKI Payment Telegram Bot 🤖

A robust Telegram payment bot built with Node.js, TypeScript, and Telegraf that provides automated access to premium channels through YooKassa payments.

## 🚀 Features

- **Secure Payments**: Integration with YooKassa payment gateway
- **Automated Access**: Automatic channel access upon successful payment
- **Telegram Bot**: Built with Telegraf framework
- **TypeScript**: Full type safety and modern JavaScript features
- **Database**: SQLite for persistent user and payment data
- **Admin Panel**: Web interface for managing payments and users

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Telegraf (Telegram Bot API)
- **Payment**: YooKassa API
- **Database**: SQLite with better-sqlite3
- **Web Framework**: Express.js
- **Queue**: Bull for background jobs
- **Document Processing**: PDF parsing, Excel generation, OCR with Tesseract.js
- **Image Processing**: Sharp for image manipulation

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- YooKassa Merchant Account
- SQLite3 (optional, for manual database access)

## 🔧 Installation

1. **Clone the repository**

```bash
git clone https://github.com/shheeeeshka/ssslivki-payment-telegram-bot.git
cd ssslivki-payment-telegram-bot
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

```env
# Telegram Bot
BOT_TOKEN=your_telegram_bot_token_here

# YooKassa Configuration
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# Application
NODE_ENV=development
PORT=3000
ADMIN_PASSWORD=secure_admin_password

# Channel Access
CHANNEL_LINK=https://t.me/your_channel_link
CHANNEL_ID=-1001234567890

# Payment Settings
PAYMENT_AMOUNT=10000  # Amount in kopecks (100.00 RUB)
ACCESS_DAYS=30        # Days of channel access
```

4. **Database Setup**

```bash
npm run build
npm run start
```

## 🚦 Usage

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run start
```

### Other Commands

```bash
npm run clean      # Remove dist directory
npm run rebuild    # Clean and rebuild
```

## 📁 Project Structure

```
ssslivki-payment-telegram-bot/
├── src/
│   ├── index.ts          # Main bot entry point
│   ├── database/         # Database models and queries
│   ├── payments/         # YooKassa payment handling
│   ├── handlers/         # Telegram command handlers
│   ├── admin/            # Admin panel and web interface
│   └── utils/            # Utility functions
├── dist/                 # Compiled JavaScript
├── database/             # SQLite database files
└── logs/                 # Application logs
```

## 💳 Payment Flow

1. User sends `/start` to the bot
2. Bot responds with payment options
3. User clicks "Buy Access" (100 RUB for 30 days)
4. Bot creates YooKassa payment and sends payment link
5. User completes payment on YooKassa
6. YooKassa sends webhook to bot (or user clicks "Check Payment")
7. Bot verifies payment and grants channel access
8. User receives private channel invitation link

## 🔐 Admin Features

- Web dashboard at `/admin` (password protected)
- View all payments and user statistics
- Manual payment verification
- User management
- Export data to Excel

## 🛡️ Security

- Environment variables for sensitive data
- SQL injection protection
- Input validation and sanitization
- Rate limiting
- Secure payment processing with YooKassa
- Admin authentication

## 📊 Database Schema

- `users`: Telegram user information
- `payments`: Payment records and status
- `access_logs`: Channel access history
- `admin_logs`: Administrative actions

## 🔌 API Endpoints

- `POST /api/payment/webhook`: YooKassa payment webhook
- `GET /api/payment/status/:id`: Check payment status
- `GET /api/admin/stats`: Admin statistics (authenticated)

## 🧪 Testing

Run tests (when implemented):

```bash
npm test
```

## 🐛 Troubleshooting

### Common Issues

1. **Bot not responding**

   - Check BOT_TOKEN in `.env`
   - Verify internet connection
   - Check bot privacy settings in @BotFather

2. **Payments not processing**

   - Verify YooKassa credentials
   - Check webhook URL configuration
   - Ensure sufficient funds in YooKassa account

3. **Database errors**
   - Check file permissions for database directory
   - Verify SQLite is installed (for manual access)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support, please contact the repository owner or create an issue in the GitHub repository.

---

**Note**: Ensure compliance with Telegram's Terms of Service and local regulations regarding payment processing.
