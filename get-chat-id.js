// Script to get Telegram chat IDs
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Get bot token from environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

// Create a new bot instance with webhook mode (doesn't conflict with polling)
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Set up a webhook temporarily to avoid conflicts
bot.setWebHook('https://example.com/temporary-webhook')
  .then(() => {
    console.log('Temporary webhook set to avoid conflicts');
    console.log('Bot is ready to receive messages');
    console.log('\n1. Add the bot to your group');
    console.log('2. Send a message with "/getchatid" in the group');
    console.log('3. The bot will respond with the group chat ID');
    console.log('\nPress Ctrl+C to exit when done\n');

    // Set up message handler
    bot.on('message', (msg) => {
      const chatId = msg.chat.id;
      const chatType = msg.chat.type;
      const chatTitle = msg.chat.title || 'Direct Message';

      if (msg.text && msg.text.toLowerCase() === '/getchatid') {
        console.log(`\nReceived message from chat:`);
        console.log(`- Chat ID: ${chatId}`);
        console.log(`- Chat Type: ${chatType}`);
        console.log(`- Chat Title: ${chatTitle}`);
        console.log(`\nTo use this chat ID, add it to your .env file as:`);
        
        if (chatType === 'group' || chatType === 'supergroup') {
          console.log(`GROUP_CHAT_ID=${chatId}`);
          
          // Also send the ID to the chat
          bot.sendMessage(chatId, `Die Chat-ID dieser Gruppe ist: ${chatId}\n\nFügen Sie diese ID zu Ihrer .env-Datei hinzu als:\nGROUP_CHAT_ID=${chatId}`);
        } else {
          console.log(`ADMIN_CHAT_ID=${chatId}`);
          
          // Also send the ID to the chat
          bot.sendMessage(chatId, `Ihre Chat-ID ist: ${chatId}\n\nFügen Sie diese ID zu Ihrer .env-Datei hinzu als:\nADMIN_CHAT_ID=${chatId}`);
        }
      }
    });

    // Set up polling with a very short interval
    bot.startPolling({ polling: true });
  })
  .catch((error) => {
    console.error('Error setting webhook:', error);
    process.exit(1);
  });
