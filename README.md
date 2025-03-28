# Telegram Bot-Controlled React App

A React web application where users follow a unique link, complete a series of forms, and are guided through the process by a Telegram bot which controls the app state remotely.

## Features

- React frontend with multiple form states
- Node.js + Express backend
- Telegram bot integration for admin control
- Real-time updates via WebSockets
- SQLite database for state persistence

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ADMIN_CHAT_ID=your_admin_chat_id
   PORT=3000
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

- `/client` - React frontend (Vite)
- `/server` - Node.js + Express backend
- `/server/bot` - Telegram bot integration
- `/server/db` - Database models and migrations

## User Flow

1. User receives a unique URL from Telegram
2. User completes Form 1 (basic data)
3. Admin approves via Telegram bot
4. User enters code in Form 2
5. Admin verifies code via Telegram bot
6. User sees success or failure message

## License

MIT
