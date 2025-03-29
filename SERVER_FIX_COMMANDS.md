# Server Commands to Fix SQLite Database Issue

Run these commands on your Ubuntu server to fix the SQLite database permissions issue:

```bash
# Stop the Docker container
docker-compose down

# Make sure the data directory exists with proper permissions
mkdir -p ~/paypal-projekt/data
chmod 777 ~/paypal-projekt/data

# Check if any files exist in the data directory
ls -la ~/paypal-projekt/data

# Rebuild and restart the container with the updated Dockerfile
# (which now includes chmod 777 for the /app/data directory)
docker-compose up -d --build

# Check logs to see if the database error is resolved
docker-compose logs -f
```

If you're still seeing the SQLite error, try these debugging steps:

```bash
# Enter the Docker container
docker exec -it paypal-projekt_app_1 /bin/sh

# Check the database directory permissions
ls -la /app/data

# Check if the node user can write to the directory
touch /app/data/test.txt
ls -la /app/data

# Check the node user ID
id

# Exit the container
exit
```

If you need to check the exact database path in your code:

```bash
# View the database.js file
cat server/db/database.js | grep dbPath
```

The database path in your code is:
```javascript
const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'app.db');
```

This resolves to `/app/data/app.db` inside your Docker container.
