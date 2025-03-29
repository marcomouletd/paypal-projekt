FROM node:20-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy all files
COPY . .

# Install server dependencies
RUN npm ci

# Install client dependencies and build
WORKDIR /app/client
RUN npm install --legacy-peer-deps
RUN npm run build

WORKDIR /app

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Switch to non-root user for security
USER node

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["node", "server/index.js"]
