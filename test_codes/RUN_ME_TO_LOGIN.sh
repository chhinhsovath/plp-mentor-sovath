#!/bin/bash

echo "🚀 PLP Mentoring Platform - Quick Start"
echo "====================================="
echo ""
echo "This script will:"
echo "1. Start the backend server"
echo "2. Start the frontend server" 
echo "3. Open the login page in your browser"
echo "4. Run Puppeteer test to verify login works"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Start backend
echo -e "\n${YELLOW}Starting Backend...${NC}"
cd backend
npm run start:dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend
echo "Waiting for backend to start..."
sleep 10

# Check if backend is running
curl -s http://localhost:3000/api/v1/auth/login > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend is running!${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo "Check the logs above for errors"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo -e "\n${YELLOW}Starting Frontend...${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend
echo "Waiting for frontend to start..."
sleep 8

# Check if frontend is running
curl -s http://localhost:5173 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend is running!${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

# Success message
echo -e "\n${GREEN}✅ Both servers are running!${NC}"
echo ""
echo "📋 Login Information:"
echo "===================="
echo "URL: http://localhost:5173/login"
echo "Username: chhinhs"
echo "Password: password"
echo ""

# Open browser (works on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Opening browser..."
    open http://localhost:5173/login
fi

# Run Puppeteer test
echo -e "\n${YELLOW}Running automated login test...${NC}"
cd ..
sleep 5
node test-login-puppeteer.js

# Keep running
echo ""
echo "Servers are running. Press Ctrl+C to stop all servers."
echo ""

# Wait and handle shutdown
trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait