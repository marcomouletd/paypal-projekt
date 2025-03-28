# Getting Started Guide

This guide will help you set up and run the Telegram Bot-Controlled React App project.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A Telegram account
- A Telegram bot token (obtained from BotFather)

## Step 1: Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Start a chat with BotFather and send `/newbot`
3. Follow the instructions to create a new bot
4. Once created, BotFather will give you a token. Save this token for later use.

## Step 2: Get Your Chat ID

1. Open Telegram and search for `@userinfobot`
2. Start a chat with this bot
3. The bot will reply with your Chat ID. Save this ID for later use.

## Step 3: Configure Environment Variables

1. In the project root directory, edit the `.env` file:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ADMIN_CHAT_ID=your_chat_id
   PORT=3000
   NODE_ENV=development
   ```

## Step 4: Set Up the Project

Run the setup script to install dependencies and initialize the database:

```
npm run setup
```

Alternatively, you can run these commands manually:

```
npm install
cd client && npm install
npm run init-db
```

## Step 5: Test the Telegram Bot

To verify that your Telegram bot is working correctly:

```
npm run test-bot
```

Then, open Telegram and send a message to your bot. You should see a response.

## Step 6: Start the Development Server

To start both the frontend and backend servers:

```
npm run dev
```

This will start:
- Backend server at http://localhost:3000
- Frontend development server at http://localhost:5173

## Step 7: Generate a Session Link

1. In Telegram, send `/generate` to your bot
2. The bot will respond with a unique URL
3. Open this URL in your browser to start the form flow

## Project Structure

- `/client` - React frontend (Vite)
- `/server` - Node.js + Express backend
- `/server/bot` - Telegram bot integration
- `/server/db` - Database models and migrations
- `/data` - SQLite database files

## Available Scripts

- `npm run dev` - Start development servers
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend server
- `npm run build` - Build the frontend for production
- `npm start` - Start the production server
- `npm run init-db` - Initialize the database
- `npm run test-bot` - Test the Telegram bot connection

## Troubleshooting

### Bot Not Responding
- Check that your `TELEGRAM_BOT_TOKEN` is correct
- Ensure the bot server is running
- Try restarting the bot with `npm run test-bot`

### Database Issues
- Delete the database file in `/data` and run `npm run init-db` again
- Check server logs for database connection errors

### Frontend Not Connecting to Backend
- Ensure both servers are running
- Check that the proxy settings in `vite.config.ts` match your backend URL
- Look for CORS errors in the browser console

## Next Steps

- Customize the forms to collect the specific data you need
- Enhance the Telegram bot with additional commands
- Add authentication for admin access
- Implement email notifications for form submissions
