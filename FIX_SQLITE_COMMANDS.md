# Commands to Fix SQLite Database Permissions

Run these commands on your Ubuntu server to fix the SQLite database permissions issue:

```bash
# Stop the Docker container
docker-compose down

# Create the data directory if it doesn't exist
mkdir -p ~/paypal-projekt/data

# Set proper permissions for the data directory
chmod 777 ~/paypal-projekt/data

# Rebuild and restart the container with the updated Dockerfile
# (After you've updated the Dockerfile to add chmod 777)
docker-compose up -d --build

# Check logs to see if the database error is resolved
docker-compose logs -f
```

If you're still seeing the SQLite error after running these commands, try this alternative approach:

```bash
# Enter the Docker container
docker exec -it paypal-projekt_app_1 /bin/sh

# Check the database directory permissions
ls -la /app/data

# Try to manually create a test file to verify write permissions
touch /app/data/test.txt
ls -la /app/data

# Exit the container
exit

# Check if the test file was created in the host's data directory
ls -la ~/paypal-projekt/data
```

If you can't create files inside the container, you might need to temporarily modify your Dockerfile to run as root (not recommended for production, but useful for debugging):

```bash
# Edit your Dockerfile and comment out the USER node line
# USER node

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```
