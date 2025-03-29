# Correct Commands to Fix SQLite Permissions

Run these commands on your Ubuntu server:

```bash
# Create the data directory if it doesn't exist
mkdir -p ~/paypal-projekt/data

# Set proper permissions
chmod 777 ~/paypal-projekt/data

# Edit the Dockerfile to include the correct permissions
# You should have already updated this file with:
# RUN mkdir -p /app/data && chown -R node:node /app/data && chmod 777 /app/data

# Rebuild and restart your Docker container
docker-compose down
docker-compose up -d --build

# Check logs to see if the database error is resolved
docker-compose logs -f
```

These commands will:
1. Create the data directory on your host system
2. Set the correct permissions on that directory
3. Rebuild your Docker container with the updated Dockerfile
4. Start the container and check the logs

The Dockerfile changes (which you've already made) ensure that the /app/data directory inside the container has the correct permissions.
