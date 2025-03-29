# Server Commands to Troubleshoot 502 Bad Gateway

Run these commands on your Ubuntu server to diagnose and fix the 502 Bad Gateway issue:

## 1. Check if the Docker container is running and view logs

```bash
# Check running containers
docker ps

# View container logs
docker-compose logs -f
```

## 2. Test if the application is accessible locally on the server

```bash
# Test if the application responds on port 3000
curl http://localhost:3000
```

## 3. Check if the Docker container is exposing port 3000 correctly

```bash
# Check port mappings
docker port paypal-projekt_app_1
```

## 4. Check CloudPanel's Nginx configuration and logs

```bash
# Check CloudPanel's Nginx configuration
cat /home/cloudpanel/htdocs/paypal.00secure.de/vhost.conf

# Check CloudPanel's Nginx error logs
sudo tail -f /home/cloudpanel/logs/error.log
```

## 5. Restart the CloudPanel Nginx service

```bash
# Restart CloudPanel's Nginx
sudo systemctl restart clp-nginx
```

## 6. Check if the Docker container can access the internet (for Telegram API)

```bash
# Get into the container
docker exec -it paypal-projekt_app_1 /bin/sh

# Test internet connectivity
wget -O- https://api.telegram.org
```

## 7. Check if the environment variables are properly loaded

```bash
# Check environment variables in the container
docker exec -it paypal-projekt_app_1 env
```

## 8. Modify the CMD in Dockerfile to ensure dotenv is loading properly

If the container is running but the app isn't working, you might need to modify how environment variables are loaded:

```bash
# Edit the Dockerfile
nano Dockerfile

# Change the CMD line to:
# CMD ["node", "-r", "dotenv/config", "server/index.js"]

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```
