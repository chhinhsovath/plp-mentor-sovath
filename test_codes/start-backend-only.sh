#!/bin/bash

echo "🚀 Starting Backend Locally"
echo "=========================="
echo ""

# Stop Docker backend
echo "Stopping Docker backend (if running)..."
docker stop mentoring-backend 2>/dev/null

cd backend

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "Starting backend server..."
echo "This may take a moment..."
echo ""

npm run start:dev