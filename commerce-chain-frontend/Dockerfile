# Stage 1: Build the application with Node.js
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app for production
RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM nginx:stable-alpine

# Copy the built files from the 'builder' stage to the Nginx static file directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 to the host machine
EXPOSE 80

# Command to run Nginx and keep it in the foreground
CMD ["nginx", "-g", "daemon off;"]
