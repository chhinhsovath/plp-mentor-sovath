#!/bin/bash

set -e  # Exit on any error

# Function to cleanup processes on exit
cleanup() {
    echo -e "\n🛑 Stopping servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo "✅ Servers stopped"
    exit 0
}

# Trap Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

echo "🚀 Starting development servers..."
echo ""

# Check if directories exist
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found"
    exit 1
fi

# Start backend
echo "📦 Starting backend server (NestJS)..."
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

sleep 2  # Give backend time to start

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