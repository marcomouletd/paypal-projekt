# Project Context: React App + Telegram Bot Control System

## 🔧 Project Goal
Create a React web app where users follow a unique link, complete a series of forms, and are guided through the process by a Telegram bot which controls the app state remotely.

---

## 📱 User Flow Summary

1. **User receives a unique URL** (e.g., `https://page.com?key=abc123`) from Telegram.
2. The frontend redirects to `https://page.com/abc123` after verifying the key.
3. User sees **Form 1** (basic data form).
4. On submission, data is sent to the backend and forwarded to a **Telegram bot**.
5. User sees a **loading screen** ("Please wait…").
6. In Telegram, the admin sees the data and presses **✅ Confirm** or **🔁 Request New Code**.
7. If confirmed, the user is shown **Form 2** (code entry).
8. On code submission, the code is sent to Telegram again.
9. Admin can then either:
   - Confirm the code → user sees **pending screen**
   - Request re-entry → user is told "Something went wrong. Please re-enter the code."
10. When the admin presses final ✅ Confirm, user sees a final success or failure message.
11. On failure, show a screen saying:
    > ❌ Something went wrong.  
    > Please try again later.  
    > [Go to Google](https://google.com)

---

## 🧱 Tech Stack

- **Frontend**: React (Vite)
- **Backend**: Node.js + Express
- **Database**: SQLite or PostgreSQL
- **Bot**: `node-telegram-bot-api` (in same Node project)
- **Realtime**: WebSocket (preferred) or Polling
- **Hosting**: Can be deployed on a single server/container

---

## 🧠 Key Functional Requirements

### Frontend
- Read `?key=abc123` from URL → redirect to `/abc123`
- Show correct form/view depending on state:
  - `form_1`, `loading`, `form_2`, `reenter_code`, `pending`, `error`
- Poll or listen for state updates via WebSocket or API
- All views should show spinner/loading state when waiting

### Backend
- Validate keys
- Store user state in DB (state machine-like)
- Routes:
  - `POST /api/form` → saves data, notifies Telegram bot
  - `POST /api/code` → saves code, notifies bot
  - `GET /api/status/:key` → returns current state
  - `POST /api/state` (bot → backend) → update user flow

### Telegram Bot
- Hosted in same project (via `node-telegram-bot-api`)
- On receiving form data or code:
  - Send message to admin with **inline buttons**:
    - ✅ Confirm
    - 🔁 Request New Code
    - ❌ End Session
- On button press → bot sends `POST` to backend to update state

---

## 🛡️ Security & UX Notes
- Keys should be UUIDs or similar (non-guessable)
- Expire sessions after X minutes
- Debounce polling or optimize WebSocket performance
- Include clear messages on every screen for user feedback

---

## ✅ Bonus Ideas
- Add WebSocket room per key for faster updates
- Optional: Email notifications or logs for submissions
- Telegram bot admin-only access

---

Let me know when ready to generate the starter boilerplate or wiring the views!
