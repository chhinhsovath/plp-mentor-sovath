#!/bin/bash

echo "🚀 Starting PLP Mentoring Platform Development Environment"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Backend setup
echo -e "\n${YELLOW}1. Setting up Backend...${NC}"
cd backend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "   Installing backend dependencies..."
    npm install
fi

# Check database setup
echo -e "\n${YELLOW}2. Checking Database Connection...${NC}"
node check-setup.js

if [ $? -ne 0 ]; then
    echo -e "${RED}   Database connection failed. Please check your .env configuration.${NC}"
    exit 1
fi

# Seed development users
echo -e "\n${YELLOW}3. Seeding Development Users...${NC}"
npx ts-node seed-dev-users.ts

# Check if backend port is already in use
if check_port 3000; then
    echo -e "${YELLOW}   ⚠️  Port 3000 is already in use. Backend might be running.${NC}"
else
    # Start backend in background
    echo -e "\n${YELLOW}4. Starting Backend Server...${NC}"
    npm run start:dev &
    BACKEND_PID=$!
    echo "   Backend starting with PID: $BACKEND_PID"
    
    # Wait for backend to be ready
    echo "   Waiting for backend to be ready..."
    sleep 5
fi

# Frontend setup
echo -e "\n${YELLOW}5. Setting up Frontend...${NC}"
cd ../frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "   Installing frontend dependencies..."
    npm install
fi

# Check if frontend port is already in use
if check_port 5173; then
    echo -e "${YELLOW}   ⚠️  Port 5173 is already in use. Frontend might be running.${NC}"
else
    # Start frontend
    echo -e "\n${YELLOW}6. Starting Frontend Server...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    echo "   Frontend starting with PID: $FRONTEND_PID"
fi

# Summary
echo -e "\n${GREEN}✅ Development Environment Started!${NC}"
echo "========================================"
echo "📌 Backend:  http://localhost:3000"
echo "📌 API Docs: http://localhost:3000/api/docs"
echo "📌 Frontend: http://localhost:5173"
echo ""
echo "🔐 Login Credentials:"
echo "   Username: chhinhs"
echo "   Password: password"
echo "   Role: Administrator"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running
wait