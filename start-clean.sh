#!/bin/bash

set -e

# Function to cleanup processes on exit
cleanup() {
    echo -e "\n🛑 Stopping servers..."
    pkill -f "nest\|vite" 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

# Trap Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

echo "🧹 Cleaning up existing processes..."
pkill -f "nest\|vite" 2>/dev/null || true
sleep 2

echo "🚀 Starting development servers..."
echo ""

# Start backend
echo "📦 Starting backend server (NestJS)..."
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

sleep 3  # Give backend more time to start

# Start frontend
echo "🎨 Starting frontend server (Vite)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Display info
echo ""
echo "🎯 Servers started successfully!"
echo "   Backend (NestJS):  http://localhost:3000"
echo "   Frontend (Vite):   http://localhost:5173"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "💡 Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID