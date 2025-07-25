#!/bin/bash

echo "Starting PLP Mentor Platform..."
echo "================================"

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "nest start" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Start Frontend
echo ""
echo "Starting Frontend Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Start Backend
echo ""
echo "Starting Backend Server..."
cd ../backend
# Try to start despite TypeScript errors
npx ts-node-dev --transpile-only --ignore-watch node_modules src/main.ts &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

echo ""
echo "================================"
echo "Servers started!"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for interrupt
trap "echo 'Stopping servers...'; kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; exit" INT TERM
wait