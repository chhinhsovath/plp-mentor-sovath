#!/bin/bash

echo "🧪 Testing if both servers are accessible..."
echo ""

# Test backend
echo "📦 Testing Backend (NestJS) at http://localhost:3000..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Backend is accessible"
else
    echo "❌ Backend is not accessible"
fi

echo ""

# Test frontend
echo "🎨 Testing Frontend (Vite) at http://localhost:5173..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
fi

echo ""
echo "🎯 Test complete!"