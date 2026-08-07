# Use official Node.js 20 LTS lightweight alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package manifest files first for efficient caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
