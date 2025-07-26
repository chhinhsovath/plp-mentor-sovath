#!/bin/bash

# Quick deployment script for existing setup
# Place this at /var/csv/mentor_api/deploy.sh

cd /var/csv/mentor_api/plp-mentor-sovath

echo "📥 Pulling latest changes..."
git pull origin main

cd backend

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building..."
npm run build || echo "No build step"

echo "♻️  Restarting backend..."
pm2 restart plp-backend || pm2 start npm --name "plp-backend" -- start

echo "✅ Deployment complete!"
pm2 status