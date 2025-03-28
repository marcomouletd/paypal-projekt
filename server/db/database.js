const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the db directory exists
const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.db');
let db;

/**
 * Initialize the database
 */
function initDb() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      // Create tables if they don't exist
      db.serialize(() => {
        // Sessions table
        db.run(`CREATE TABLE IF NOT EXISTS sessions (
          key TEXT PRIMARY KEY,
          state TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        )`);
        
        // Form data table
        db.run(`CREATE TABLE IF NOT EXISTS form_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_key TEXT NOT NULL,
          form_type TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (session_key) REFERENCES sessions (key)
        )`);
        
        console.log('Database tables created or already exist');
        resolve();
      });
    });
  });
}

/**
 * Create a new session with a unique key
 * @param {string} key - Unique session key
 * @param {string} state - Initial state
 * @param {number} expiresInMinutes - Session expiration time in minutes
 */
function createSession(key, state = 'form_1', expiresInMinutes = 60) {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    const expiresAt = now + (expiresInMinutes * 60 * 1000);
    
    db.run(
      'INSERT INTO sessions (key, state, created_at, updated_at, expires_at) VALUES (?, ?, ?, ?, ?)',
      [key, state, now, now, expiresAt],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ key, state });
      }
    );
  });
}

/**
 * Get session by key
 * @param {string} key - Session key
 */
function getSession(key) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM sessions WHERE key = ?', [key], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!row) {
        resolve(null);
        return;
      }
      
      // Check if session has expired
      if (row.expires_at < Date.now()) {
        resolve(null);
        return;
      }
      
      resolve(row);
    });
  });
}

/**
 * Update session state
 * @param {string} key - Session key
 * @param {string} state - New state
 */
function updateSessionState(key, state) {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    
    db.run(
      'UPDATE sessions SET state = ?, updated_at = ? WHERE key = ?',
      [state, now, key],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('Session not found'));
          return;
        }
        
        resolve({ key, state });
      }
    );
  });
}

/**
 * Save form data
 * @param {string} sessionKey - Session key
 * @param {string} formType - Type of form (e.g., 'form_1', 'form_2')
 * @param {object} data - Form data
 */
function saveFormData(sessionKey, formType, data) {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    const jsonData = JSON.stringify(data);
    
    db.run(
      'INSERT INTO form_data (session_key, form_type, data, created_at) VALUES (?, ?, ?, ?)',
      [sessionKey, formType, jsonData, now],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID, sessionKey, formType, data });
      }
    );
  });
}

/**
 * Get form data for a session
 * @param {string} sessionKey - Session key
 * @param {string} formType - Optional form type filter
 */
function getFormData(sessionKey, formType = null) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM form_data WHERE session_key = ?';
    const params = [sessionKey];
    
    if (formType) {
      query += ' AND form_type = ?';
      params.push(formType);
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Parse JSON data
      const parsedRows = rows.map(row => ({
        ...row,
        data: JSON.parse(row.data)
      }));
      
      resolve(parsedRows);
    });
  });
}

// Export database functions
module.exports = {
  initDb,
  createSession,
  getSession,
  updateSessionState,
  saveFormData,
  getFormData,
  db
};
