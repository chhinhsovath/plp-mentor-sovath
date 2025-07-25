#!/bin/bash

# Kill any existing processes
lsof -ti :5173 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

echo "Starting mock backend..."
node mock-backend.js &
BACKEND_PID=$!

echo "Starting frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for servers to start
echo "Waiting for servers to start..."
sleep 5

# Run the test
echo "Running test..."
node test-users-page.js

# Clean up
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null