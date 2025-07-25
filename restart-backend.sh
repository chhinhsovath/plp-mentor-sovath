#!/bin/bash

echo "🔄 Restarting backend server to apply validation pipe fixes..."
echo ""

# Change to backend directory
cd backend

# Check if the backend is running with pm2
if command -v pm2 &> /dev/null; then
    echo "Checking PM2 processes..."
    if pm2 list | grep -q "plp-backend\|backend"; then
        echo "Found backend process in PM2, restarting..."
        pm2 restart backend || pm2 restart plp-backend
        echo "✅ Backend restarted with PM2"
        exit 0
    fi
fi

# Check if running with npm
if lsof -i :3000 &> /dev/null; then
    echo "Backend is running on port 3000, stopping it..."
    # Find and kill the process on port 3000
    kill $(lsof -t -i:3000) 2>/dev/null
    sleep 2
fi

# Start the backend
echo "Starting backend server..."
npm run start:dev &

echo ""
echo "✅ Backend server is restarting..."
echo "⏳ Please wait about 10-15 seconds for the server to fully start"
echo ""
echo "Once started, the users page should work properly!"
echo "Test with: username: chhinhs, password: password"