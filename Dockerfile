FROM node:20-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install dependencies with better layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy client package files and install dependencies
COPY client/package*.json ./client/
RUN cd client && npm ci --only=production

# Copy the rest of the application
COPY . .

# Build the client
RUN cd client && npm run build

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Switch to non-root user for security
USER node

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["node", "server/index.js"]
