FROM node:20-alpine

# Install Nginx and FFmpeg
RUN apk add --no-cache nginx ffmpeg

# Set working directory
WORKDIR /app

# Copy package info and install
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set up start script
RUN chmod +x start.sh

# Create uploads directory structure
RUN mkdir -p uploads/thumbnails uploads/audio uploads/hls uploads/private

# Expose Nginx port
EXPOSE 80

# Start Nginx and Node.js
CMD ["./start.sh"]
