#!/bin/bash

echo "🚀 Starting PLP Mentor Platform (Local Development)"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start backend
echo "🔧 Starting backend server..."
cd backend
node simple-server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Check if backend started successfully
if lsof -i:3000 > /dev/null 2>&1; then
    echo "✅ Backend started successfully (PID: $BACKEND_PID)"
else
    echo "❌ Backend failed to start. Check backend.log for details"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 5

# Check if frontend started successfully
if lsof -i:5173 > /dev/null 2>&1; then
    echo "✅ Frontend started successfully (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend failed to start. Check frontend.log for details"
    exit 1
fi

echo ""
echo "✨ Application is ready!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3000/api/v1"
echo ""
echo "👤 Login with:"
echo "   Username: admin"
echo "   Password: any password"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop all services, run:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Or use: pkill -f 'node simple-server.js' && pkill -f 'npm run dev'"