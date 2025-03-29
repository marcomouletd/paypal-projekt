# Setting Up Nginx as a Reverse Proxy for Your PayPal App

This guide will help you set up Nginx as a reverse proxy for your Docker-based PayPal application on Ubuntu 22.04.

## 1. Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

## 2. Configure Nginx

Create a new site configuration file:

```bash
sudo nano /etc/nginx/sites-available/paypal-app
```

Copy and paste the following configuration (replace `your-domain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your actual domain

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
    }
}
```

## 3. Enable the Site Configuration

Create a symbolic link to enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/paypal-app /etc/nginx/sites-enabled/
```

## 4. Test Nginx Configuration

Check if the configuration is valid:

```bash
sudo nginx -t
```

## 5. Update Environment Variables

Update your `.env.docker` file to use the correct URLs:

```bash
# Edit the .env.docker file
sudo nano ~/paypal-projekt/.env.docker
```

Change the SERVER_URL and CLIENT_URL to match your domain:

```
SERVER_URL=https://your-domain.com
CLIENT_URL=https://your-domain.com
```

## 6. Restart Services

Restart Nginx:

```bash
sudo systemctl restart nginx
```

Rebuild and restart your Docker container:

```bash
cd ~/paypal-projekt
docker compose down
docker compose up -d --build
```

## 7. Set Up SSL with Let's Encrypt (Recommended)

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain and install SSL certificate:

```bash
sudo certbot --nginx -d your-domain.com
```

Follow the prompts to complete the SSL setup.

## 8. Troubleshooting

### Check if Docker container is running:
```bash
docker ps
```

### View Docker container logs:
```bash
docker compose logs -f
```

### Check Nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Check Nginx access logs:
```bash
sudo tail -f /var/log/nginx/access.log
```

### Check firewall settings:
```bash
sudo ufw status
```

If needed, allow Nginx through the firewall:
```bash
sudo ufw allow 'Nginx Full'
```

### Check DNS settings:
Make sure your domain's DNS records point to your server's IP address.

## 9. Common Issues and Solutions

### 404 Not Found Error:
- Verify that your Docker container is running and accessible on port 3000
- Check that the Nginx configuration is correct and enabled
- Ensure that the server_name in the Nginx configuration matches your domain

### 502 Bad Gateway Error:
- Check if your Docker container is running
- Verify that the application inside the container is working
- Check Docker logs for any application errors

### Connection Refused:
- Make sure Docker is running
- Check if the container is exposing port 3000
- Verify that there are no firewall rules blocking the connection
