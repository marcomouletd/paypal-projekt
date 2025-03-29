# Using Existing Certbot Certificates with CloudPanel

Since you already have certificates generated with Certbot, you can configure CloudPanel to use these existing certificates instead of generating new ones.

## 1. Create the SSL Certificates Directory for CloudPanel

```bash
# Create the directory if it doesn't exist
sudo mkdir -p /etc/nginx/ssl-certificates

# Set proper permissions
sudo chmod 700 /etc/nginx/ssl-certificates
```

## 2. Create Symlinks to Your Existing Certificates

```bash
# Create symlinks from your existing Certbot certificates to CloudPanel's expected location
sudo ln -s /etc/letsencrypt/live/paypal.secure00.de/fullchain.pem /etc/nginx/ssl-certificates/paypal.secure00.de.crt
sudo ln -s /etc/letsencrypt/live/paypal.secure00.de/privkey.pem /etc/nginx/ssl-certificates/paypal.secure00.de.key
```

## 3. Configure CloudPanel to Use Your Existing Certificates

1. Go to "Sites" in CloudPanel
2. Click on your domain
3. Click on "SSL/TLS" in the left sidebar
4. Choose "Use Custom Certificate"
5. Enter the paths to your certificate files:
   - Certificate: `/etc/nginx/ssl-certificates/paypal.secure00.de.crt`
   - Private Key: `/etc/nginx/ssl-certificates/paypal.secure00.de.key`

## 4. Restart Nginx in CloudPanel

After configuring the certificates, restart Nginx to apply the changes:

```bash
sudo systemctl restart nginx
```

## 5. Verify Cloudflare SSL Settings

Make sure your Cloudflare SSL/TLS settings are configured correctly:

1. Log in to your Cloudflare account
2. Select your domain
3. Go to "SSL/TLS" > "Overview"
4. Set SSL/TLS encryption mode to "Full" or "Full (Strict)" since you have a valid certificate on your origin server

## 6. Test Your Configuration

Open your browser and navigate to https://paypal.secure00.de to verify that the SSL certificate is working correctly.

## 7. Certificate Renewal

Remember that your existing Certbot certificates will need to be renewed every 90 days. Make sure your renewal process is set up correctly:

```bash
# Test the renewal process
sudo certbot renew --dry-run

# If you don't have a renewal cron job set up, add one
sudo crontab -e
```

Add this line to run the renewal check twice daily (standard practice):
```
0 0,12 * * * certbot renew --quiet
```
