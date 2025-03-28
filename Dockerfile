FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy client package files and install dependencies
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy the rest of the application
COPY . .

# Build the client
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
