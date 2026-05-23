# Use light official Node.js image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install production-only dependencies
RUN npm install --production

# Copy backend files
COPY . .

# Expose backend port
EXPOSE 5000

# Start Express server
CMD ["node", "server.js"]
