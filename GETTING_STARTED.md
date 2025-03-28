# Getting Started Guide

This guide will help you set up and run the Telegram Bot-Controlled React App project in both development and production environments.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- A Telegram account
- A Telegram bot token (obtained from BotFather)
- Docker and Docker Compose (for production deployment)

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
3. Send a message in the group
4. Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` in your browser (replace `<YOUR_BOT_TOKEN>` with your actual token)
5. Look for the "chat" object and find the "id" field. This is your `GROUP_CHAT_ID`.

## Step 3: Configure Environment Variables

Create a `.env` file in the project root directory with the following variables:

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ADMIN_CHAT_ID=your_chat_id
GROUP_CHAT_ID=your_group_chat_id
PORT=3000
NODE_ENV=development
SERVER_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173
```

For production, set:
```
NODE_ENV=production
SERVER_URL=https://your-domain.com
CLIENT_URL=https://your-domain.com
```

## Development Setup

### Option 1: Automatic Setup

Run the setup script to install dependencies and initialize the database:

```bash
npm run setup
```

### Option 2: Manual Setup

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install
cd ..

# Initialize the database
npm run init-db
```

### Starting the Development Server

To start both the frontend and backend servers:

```bash
npm run dev
```

This will start:
- Backend server at http://localhost:3000
- Frontend development server at http://localhost:5173

## Installing Docker and Docker Compose on Ubuntu 22.04

1. **Update your system packages**:
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

2. **Install prerequisites**:
   ```bash
   sudo apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release
   ```

3. **Add Docker's official GPG key**:
   ```bash
   sudo mkdir -p /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg
   ```

4. **Set up the Docker repository**:
   ```bash
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu jammy stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt update
   ```

5. **Install Docker Engine and Docker Compose**:
   ```bash
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

6. **Add your user to the docker group** (to run Docker without sudo):
   ```bash
   sudo usermod -aG docker $USER
   ```
   Note: You'll need to log out and back in for this change to take effect. Alternatively, you can run:
   ```bash
   newgrp docker
   ```

7. **Verify Docker installation**:
   ```bash
   # Check Docker version
   docker --version
   
   # Verify Docker Engine is installed correctly
   docker run hello-world
   ```

8. **Verify Docker Compose installation**:
   ```bash
   # Check Docker Compose version
   docker compose version
   ```

9. **Enable Docker to start on boot**:
   ```bash
   sudo systemctl enable docker
   sudo systemctl status docker
   ```

## Production Deployment

### Option 1: Docker Deployment (Recommended)

1. Make sure Docker and Docker Compose are installed on your server

2. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/your-username/paypal-projekt.git
   cd paypal-projekt
   ```

3. Create a `.env` file with your production settings:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ADMIN_CHAT_ID=your_chat_id
   GROUP_CHAT_ID=your_group_chat_id
   SERVER_URL=https://your-domain.com
   CLIENT_URL=https://your-domain.com
   ```

4. Build and start the Docker containers:
   ```bash
   docker-compose up -d
   ```

5. Your application is now running at http://your-server-ip:3000

### Option 2: Manual Deployment

#### Prerequisites Installation

1. Update your system packages:
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

2. Install Node.js and npm:
   ```bash
   sudo apt install -y curl
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. Verify the installation:
   ```bash
   node -v  # Should show v16.x.x or higher
   npm -v   # Should show v7.x.x or higher
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
   nano .env  # Or use any text editor you prefer
   ```

   Add the following configuration (replace with your actual values):
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ADMIN_CHAT_ID=your_chat_id
   GROUP_CHAT_ID=your_group_chat_id
   PORT=3000
   NODE_ENV=production
   SERVER_URL=https://your-domain.com
   CLIENT_URL=https://your-domain.com
   ```

3. Install dependencies and set up the project:
   ```bash
   npm install
   cd client && npm install
   cd ..
   npm run init-db
   ```

4. Build the client:
   ```bash
   npm run build
   ```

5. Start the production server:
   ```bash
   npm start
   ```

6. For keeping the server running after you log out, use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name "telegram-form-app"
   pm2 save
   pm2 startup
   ```

## Using a Reverse Proxy (Recommended for Production)

For a secure production setup, we recommend using Nginx as a reverse proxy:

1. Install Nginx:
   ```bash
   sudo apt install -y nginx
   ```

2. Create a new Nginx configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/paypal-projekt
   ```

3. Add the following configuration (replace `your-domain.com` with your actual domain):
   ```
   server {
       listen 80;
       server_name your-domain.com;

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
   sudo ln -s /etc/nginx/sites-available/paypal-projekt /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. Set up SSL with Let's Encrypt:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Troubleshooting

### Bot Not Responding
- Check that your `TELEGRAM_BOT_TOKEN` is correct in the `.env` file
- Ensure the bot server is running
- Make sure you've stopped any other instances of the bot
- Check the server logs for any errors

### Group Chat Not Working
- Verify that the bot is an admin in the group
- Ensure you've set the correct `GROUP_CHAT_ID` in the `.env` file
- Check the API response from `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`

### Application Not Starting
- Check that all environment variables are correctly set in your `.env` file
- Ensure all dependencies are installed: `npm install && cd client && npm install`
- Verify that the database is initialized: `npm run init-db`
- Check for port conflicts: make sure port 3000 is not in use by another application

### Docker Issues
- Make sure Docker and Docker Compose are properly installed
- Verify that the `.env` file exists and contains the correct values
- Check Docker logs: `docker-compose logs`
- Ensure the data directory has the correct permissions

## Maintenance

### Updating the Application
1. Pull the latest changes:
   ```bash
   git pull
   ```

2. Install any new dependencies:
   ```bash
   npm install
   cd client && npm install
   cd ..
   ```

3. Rebuild the client:
   ```bash
   npm run build
   ```

4. Restart the server:
   ```bash
   # If using PM2
   pm2 restart telegram-form-app
   
   # If using Docker
   docker-compose down
   docker-compose up -d
   ```

### Backing Up Data
The application stores data in the `data` directory. To back up your data:

```bash
# Create a backup of the data directory
cp -r data data_backup_$(date +%Y%m%d)

# Or create a compressed archive
tar -czvf data_backup_$(date +%Y%m%d).tar.gz data
