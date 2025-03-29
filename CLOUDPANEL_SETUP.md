# Setting Up Your PayPal App with CloudPanel

This guide will help you set up your Docker-based PayPal application using CloudPanel, which provides an easy-to-use interface for managing web applications.

## 1. Install CloudPanel (if not already installed)

```bash
curl -sSL https://installer.cloudpanel.io/ce/v2/install.sh | sudo bash
```

## 2. Access CloudPanel

Open your web browser and navigate to:
```
https://your-server-ip:8443
```

Complete the initial setup process if this is your first time using CloudPanel.

## 3. Create a Site in CloudPanel

1. Log in to CloudPanel
2. Go to "Sites" and click "Add Site"
3. Enter your domain (e.g., paypal.secure00.de)
4. Select "Node.js" as the application type
5. Complete the site creation process

## 4. Configure Node.js Application

1. Go to "Sites" and click on your domain
2. Click on "Node.js" in the left sidebar
3. Configure the following settings:
   - **Port**: 3000 (the port your Docker container uses)
   - **Application Root**: /home/cloudpanel/htdocs/your-domain/node_app
   - **Application File**: server.js (or your main entry file)
   - **Node.js Version**: Select the version that matches your Docker container (e.g., 20.x)

## 5. Set Up Reverse Proxy to Docker

Instead of running the Node.js application directly through CloudPanel, we'll set up a reverse proxy to your Docker container:

1. Go to "Sites" and click on your domain
2. Click on "Vhost" in the left sidebar
3. Add the following to the Nginx configuration:

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

## 6. Set Up SSL Certificate

1. Go to "Sites" and click on your domain
2. Click on "SSL/TLS" in the left sidebar
3. Click "Request Let's Encrypt Certificate"
4. Follow the prompts to complete the SSL setup

## 7. Configure Cloudflare

1. Log in to your Cloudflare account
2. Select your domain
3. Go to "SSL/TLS" > "Overview"
4. Set SSL/TLS encryption mode to "Full" or "Full (Strict)"
5. Go to "SSL/TLS" > "Edge Certificates"
6. Enable "Always Use HTTPS"
7. Enable "Automatic HTTPS Rewrites"

## 8. Update Docker Environment Variables

Update your `.env.docker` file with the correct URLs:

```
SERVER_URL=https://paypal.secure00.de
CLIENT_URL=https://paypal.secure00.de
```

## 9. Restart Your Docker Container

```bash
cd ~/paypal-projekt
docker compose down
docker compose up -d --build
```

## 10. Test Your Application

Open your web browser and navigate to your domain (https://paypal.secure00.de).

## Troubleshooting

### If you still see a 502 Bad Gateway error:

1. **Check Docker Container**:
   ```bash
   docker ps
   docker compose logs -f
   ```

2. **Check CloudPanel Nginx Logs**:
   ```bash
   tail -f /home/cloudpanel/logs/nginx/your-domain/error.log
   ```

3. **Verify Docker Network**:
   Make sure your Docker container is accessible from the host:
   ```bash
   curl http://localhost:3000
   ```

4. **Check Cloudflare SSL Mode**:
   Ensure you're using "Full" or "Full (Strict)" mode, not "Flexible"

5. **Try Development Mode**:
   Temporarily enable Development Mode in Cloudflare to bypass caching

### If you need to modify the Nginx configuration further:

1. Go to "Sites" > your domain > "Vhost"
2. Modify the configuration as needed
3. Save and restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```
