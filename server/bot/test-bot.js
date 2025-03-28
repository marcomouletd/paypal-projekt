/**
 * Test script for the Telegram bot
 * Run this script to test your bot token and admin chat ID
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Check if token is available
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

// Check if admin chat ID is available
const adminChatId = process.env.ADMIN_CHAT_ID;
if (!adminChatId) {
  console.warn('ADMIN_CHAT_ID is not set in environment variables');
  console.log('The bot will still start, but you need to set this for proper functionality');
}

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });
console.log('Telegram bot initialized for testing');

// Log when the bot is connected
console.log('Bot is now connected to Telegram API');
console.log('Press Ctrl+C to exit');

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, `Welcome to the Form Control Bot!\n\nYour Chat ID is: ${chatId}\n\nAdd this to your .env file as ADMIN_CHAT_ID=`);
  
  // If this is the admin, send a test message with inline buttons
  if (adminChatId && chatId.toString() === adminChatId.toString()) {
    bot.sendMessage(chatId, 'Test Admin Controls', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Confirm', callback_data: 'test_confirm' },
            { text: '🔁 Request New', callback_data: 'test_new' }
          ],
          [
            { text: '❌ End Session', callback_data: 'test_end' }
          ]
        ]
      }
    });
  }
});

// Handle callback queries (button clicks)
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  
  bot.answerCallbackQuery(query.id, { text: 'Button clicked!' });
  bot.sendMessage(chatId, `You clicked: ${query.data}`);
});

// Log all messages to see the chat ID
bot.on('message', (msg) => {
  console.log(`Message from chat ID: ${msg.chat.id}`);
});
