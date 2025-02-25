# Use Node.js as base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose backend port
EXPOSE 5000

# Command to start the server
CMD ["npm", "start"]

