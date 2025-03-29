# Fixing 502 Bad Gateway Error in Docker Deployment

The 502 Bad Gateway error you're experiencing is caused by a missing dependency (`axios`) in your Docker container. The Telegram bot requires this package, but it's not included in your `package.json` file.

## Solution

Follow these steps to fix the issue:

### 1. Update package.json

Add axios to your dependencies in package.json:

```json
"dependencies": {
  "axios": "^1.6.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "node-telegram-bot-api": "^0.64.0",
  "socket.io": "^4.7.2",
  "sqlite3": "^5.1.6",
  "uuid": "^9.0.1"
}
```

### 2. Update your Dockerfile

Modify your Dockerfile to use `npm install` instead of `npm ci` to handle new dependencies without requiring an updated package-lock.json:

```dockerfile
# Build stage for client
FROM node:20-alpine as client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --legacy-peer-deps

COPY client/ ./
RUN npm run build

# Main application stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install

# Copy server files
COPY server/ ./server/

# Copy built client files from the builder stage
COPY --from=client-builder /app/client/dist ./client/dist

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Switch to non-root user for security
USER node

# Expose the port the app will run on
EXPOSE 3000

# Start the application with environment variables from .env.docker
CMD ["node", "-r", "dotenv/config", "server/index.js"]
```

### 3. Update docker-compose.yml

Make sure your docker-compose.yml file correctly loads the environment variables:

```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    env_file:
      - .env.docker
    restart: always
```

### 4. Rebuild and restart your container

```bash
# Stop any running containers
docker-compose down

# Rebuild the container with the updated dependencies
docker-compose up -d --build

# Check logs to ensure everything is working
docker-compose logs -f
```

## Troubleshooting

If you still encounter issues:

1. **Check Docker logs**: Continue monitoring `docker-compose logs -f` for any errors
2. **Verify environment variables**: Make sure all required environment variables are set in `.env.docker`
3. **Check CloudPanel configuration**: Ensure the Nginx reverse proxy is correctly configured
4. **Test direct access**: Try accessing your application directly via the server IP and port 3000

## Prevention for Future Deployments

To prevent similar issues in the future:

1. **Update package-lock.json locally**: Run `npm install` locally before committing changes to package.json
2. **Use dependency management tools**: Consider using tools like npm-check or depcheck to identify missing dependencies
3. **Implement health checks**: Add a health check endpoint to your application and configure Docker to use it
4. **Set up proper logging**: Implement more detailed logging to quickly identify issues
