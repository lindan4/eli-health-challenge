#Node LTS backend Dockerfile
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Build TypeScript (optional)
RUN npm run build

# Expose port
EXPOSE 5000

# Start app
CMD ["npm", "run", "dev"]