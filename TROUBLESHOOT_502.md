# Troubleshooting 502 Bad Gateway in CloudPanel

If you're still seeing a 502 Bad Gateway error after successfully building your Docker container, follow these troubleshooting steps:

## 1. Check if the Docker container is running

```bash
# Check running containers
docker ps

# If your container isn't listed, check all containers
docker ps -a
```

If the container is not running or keeps restarting, check the logs:

```bash
docker-compose logs -f
```

## 2. Test direct access to the application

Try accessing your application directly using the server IP and port 3000:

```bash
# Test if the application responds on port 3000
curl http://localhost:3000

# Or use wget
wget -O- http://localhost:3000
```

If this works but CloudPanel still shows 502, it's a proxy configuration issue.

## 3. Check CloudPanel Nginx configuration

1. In CloudPanel, go to "Sites" and click on your domain
2. Click on "Vhost" in the left sidebar
3. Make sure the proxy configuration is correct:

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

4. Save and check CloudPanel's Nginx logs:

```bash
sudo tail -f /home/cloudpanel/logs/error.log
```

## 4. Check firewall settings

Make sure port 3000 is accessible to CloudPanel:

```bash
# Check if port 3000 is allowed
sudo ufw status

# If not, allow it
sudo ufw allow 3000/tcp
```

## 5. Check environment variables

Make sure your .env.docker file has all the required variables:

```bash
# View your environment variables
cat .env.docker

# Make sure they're being loaded
docker-compose exec app env
```

## 6. Restart CloudPanel's Nginx

```bash
sudo systemctl restart clp-nginx
```

## 7. Check for network issues between CloudPanel and Docker

Docker creates its own network. Make sure CloudPanel can access it:

```bash
# Get Docker container IP
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' paypal-projekt_app_1

# Try accessing the container using its IP
curl http://CONTAINER_IP:3000
```

If this works but localhost:3000 doesn't, update your CloudPanel configuration to use the container IP.

## 8. Restart the entire stack

Sometimes a full restart resolves issues:

```bash
# Restart Docker container
docker-compose down
docker-compose up -d

# Restart CloudPanel
sudo systemctl restart cloudpanel
```
