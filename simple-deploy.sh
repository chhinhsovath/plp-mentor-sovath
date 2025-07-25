#!/bin/bash

# Simple deployment without git operations

echo "🚀 Simple Deployment (No Git Push)"
echo "=================================="

cd /var/csv/mentor_api/plp-mentor-sovath

# Backend
echo "📦 Building Backend..."
cd backend
npm install
npm run build
pm2 stop plp-backend 2>/dev/null
pm2 start dist/main.js --name plp-backend
pm2 save

# Frontend  
echo "📦 Building Frontend..."
cd ../frontend
npm install
npm run build
sudo rm -rf /var/www/html/mentoring/*
sudo cp -r dist/* /var/www/html/mentoring/
sudo chown -R www-data:www-data /var/www/html/mentoring

echo "✅ Deployment Complete!"
echo "🌐 Access at: https://mentoring.openplp.com"