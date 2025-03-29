# Fixing SQLite Database Permissions in Docker

The 502 Bad Gateway error is occurring because your application can't open the SQLite database file. This is a permissions issue in your Docker container.

## Solution

Follow these steps to fix the SQLite permissions issue:

### 1. Check your database file path

First, let's check where your application is trying to store the SQLite database:

```bash
# Check the server code to find the database path
grep -r "new sqlite3.Database" server/
```

### 2. Update your docker-compose.yml file

Ensure the volume mapping is correct and the database directory exists:

```bash
# Edit docker-compose.yml
nano docker-compose.yml
```

Make sure it includes:

```yaml
volumes:
  - ./data:/app/data
```

### 3. Create the data directory and set permissions

```bash
# Create the data directory if it doesn't exist
mkdir -p data

# Set proper permissions
chmod 777 data
```

### 4. Update your Dockerfile

Modify your Dockerfile to ensure the node user has write permissions:

```bash
# Edit Dockerfile
nano Dockerfile
```

Update the relevant section:

```dockerfile
# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app/data && chmod 777 /app/data
```

### 5. Rebuild and restart your container

```bash
# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Check logs to ensure the database connects properly
docker-compose logs -f
```

### 6. If still not working, try running as root temporarily

If you're still having issues, you can temporarily modify your Dockerfile to run as root (not recommended for production):

```dockerfile
# Comment out the USER node line
# USER node
```

### 7. Check if the application is now working

```bash
# Check if the application is responding
curl http://localhost:3000

# Check CloudPanel to see if the 502 error is resolved
```

## Prevention for Future Deployments

To prevent similar issues in the future:

1. **Explicit database path**: Make sure your application uses an explicit, configurable database path
2. **Environment variables**: Use environment variables to configure the database path
3. **Volume permissions**: Always ensure proper permissions on Docker volumes
4. **Health checks**: Add a health check endpoint to your application
