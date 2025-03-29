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

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install server dependencies
COPY package*.json ./
RUN npm ci

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

# Start the application
CMD ["node", "server/index.js"]
