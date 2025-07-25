#!/bin/bash

echo "🚀 Starting Backend Locally (to bypass Docker issues)"
echo "==================================================="
echo ""

# Stop Docker backend to free up port 3000
echo "1️⃣ Stopping Docker backend container..."
docker stop mentoring-backend 2>/dev/null
echo "   ✅ Docker backend stopped"

# Start local backend
echo ""
echo "2️⃣ Starting backend locally..."
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi

echo "   Starting NestJS backend..."
npm run start:dev &
BACKEND_PID=$!

echo "   Backend PID: $BACKEND_PID"
echo ""
echo "3️⃣ Waiting for backend to start..."

# Wait for backend to be ready
for i in {1..30}; do
    if curl -s http://localhost:3000/api/v1/auth/login >/dev/null 2>&1; then
        echo "   ✅ Backend is ready!"
        break
    fi
    sleep 2
    echo -n "."
done

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "Frontend (Docker): http://localhost:5173"
echo "Backend (Local): http://localhost:3000"
echo "API Docs: http://localhost:3000/api/docs"
echo ""
echo "Login with:"
echo "Username: chhinhs"
echo "Password: password"
echo ""
echo "Press Ctrl+C to stop the backend"

# Keep running
trap "kill $BACKEND_PID 2>/dev/null; exit" INT TERM
wait