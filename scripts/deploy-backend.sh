#!/bin/bash

# Deployment script for PLP Mentor backend
# This script should be placed on the server at /home/ubuntu/deploy-backend.sh

APP_DIR="/var/csv/mentor_api/plp-mentor-sovath"
BACKEND_DIR="$APP_DIR/backend"
PM2_APP_NAME="plp-backend"

echo "🚀 Starting deployment..."

# Create app directory if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
    echo "📁 Creating application directory..."
    mkdir -p "$APP_DIR"
fi

cd "$APP_DIR"

# Clone or pull the latest code
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone https://github.com/chhinhsovath/plp-mentor-sovath.git .
fi

# Navigate to backend directory
cd "$BACKEND_DIR"

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application (if build script exists)
if npm run | grep -q "build"; then
    echo "🔨 Building application..."
    npm run build
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Start or restart the application
if pm2 list | grep -q "$PM2_APP_NAME"; then
    echo "♻️  Restarting application..."
    pm2 restart "$PM2_APP_NAME"
else
    echo "▶️  Starting application..."
    pm2 start npm --name "$PM2_APP_NAME" -- start
fi

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Health check
echo "🏥 Performing health check..."
sleep 5
if curl -f http://localhost:3001/api/v1/health; then
    echo "✅ Deployment successful! Backend is running."
else
    echo "❌ Health check failed. Please check the logs."
    pm2 logs "$PM2_APP_NAME" --lines 50
fi

echo "📊 Current PM2 processes:"
pm2 list