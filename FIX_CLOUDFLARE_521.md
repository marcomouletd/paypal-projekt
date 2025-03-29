# Fixing Cloudflare Error 521 (Web Server Down)

Error 521 means that Cloudflare can't connect to your origin server. Here's how to fix it:

## 1. Check if Your Web Server is Running

```bash
# Check if Nginx is running
sudo systemctl status nginx

# If it's not running, start it
sudo systemctl start nginx

# Check if your Docker container is running
docker ps

# If it's not running, start it
cd ~/paypal-projekt
docker compose up -d
```

## 2. Check Firewall Settings

Make sure your firewall allows incoming connections on ports 80 and 443:

```bash
# Check UFW status
sudo ufw status

# Allow Nginx through the firewall
sudo ufw allow 'Nginx Full'

# Allow specific ports if needed
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## 3. Verify Cloudflare IP Ranges

Ensure your server accepts connections from Cloudflare IP ranges:

```bash
# Install the Cloudflare IP updater tool
sudo apt install -y curl

# Create a script to update Cloudflare IPs
cat > /tmp/cloudflare-update-ips.sh << 'EOF'
#!/bin/bash
# Fetch the current Cloudflare IP ranges
ipv4_ips=$(curl -s https://www.cloudflare.com/ips-v4)
ipv6_ips=$(curl -s https://www.cloudflare.com/ips-v6)

# Allow these IPs through the firewall
for ip in $ipv4_ips $ipv6_ips; do
  sudo ufw allow from $ip to any port 80 proto tcp
  sudo ufw allow from $ip to any port 443 proto tcp
done

# Reload the firewall
sudo ufw reload
EOF

# Make the script executable
chmod +x /tmp/cloudflare-update-ips.sh

# Run the script
sudo /tmp/cloudflare-update-ips.sh
```

## 4. Check Cloudflare SSL/TLS Settings

1. Log in to your Cloudflare account
2. Select your domain
3. Go to "SSL/TLS" > "Overview"
4. Set SSL/TLS encryption mode to "Full" (not "Strict" until your origin certificate is properly set up)

## 5. Test Direct Connection to Your Server

Bypass Cloudflare to test if your server is working:

```bash
# Edit your local hosts file to point directly to your server
# On Windows: C:\Windows\System32\drivers\etc\hosts
# On Mac/Linux: /etc/hosts
# Add: YOUR_SERVER_IP paypal.00secure.de
```

Then try accessing your site directly in a browser.

## 6. Check Nginx Configuration

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## 7. Temporarily Disable Cloudflare Proxy

In Cloudflare dashboard:
1. Go to DNS settings
2. Find your A record for paypal.00secure.de
3. Click the orange cloud icon to turn it gray (DNS only mode)
4. Wait a few minutes for DNS to propagate
5. Test your site directly

## 8. Restart All Services

```bash
# Restart Nginx
sudo systemctl restart nginx

# Restart Docker container
cd ~/paypal-projekt
docker compose down
docker compose up -d
```

## 9. Check if Your Server is Listening on the Correct Ports

```bash
# Check listening ports
sudo netstat -tulpn | grep -E ':80|:443'
```

## 10. Verify Docker Container is Accessible

```bash
# Test if your Docker container is accessible
curl http://localhost:3000
```

If this returns content, your Docker container is working but Nginx or Cloudflare configuration might be wrong.
