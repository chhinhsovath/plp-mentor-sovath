#!/bin/bash

# Safe deployment script with error handling
cd /var/csv/mentor_api/plp-mentor-sovath

echo "🔧 Checking git configuration..."
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [[ "$REMOTE_URL" != "https://github.com/chhinhsovath/plp-mentor-sovath.git" ]]; then
    echo "❌ Invalid git remote: $REMOTE_URL"
    echo "🔧 Fixing git remote..."
    git remote remove origin 2>/dev/null || true
    git remote add origin https://github.com/chhinhsovath/plp-mentor-sovath.git
fi

echo "📥 Pulling latest changes..."
git fetch origin
git reset --hard origin/main || git reset --hard HEAD
git pull origin main || echo "Pull failed, continuing with current code"

echo "🔧 Deploying backend..."
cd backend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ No package.json found in backend directory!"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building backend..."
npm run build || echo "No build step configured"

echo "♻️  Restarting backend service..."
pm2 restart plp-backend || pm2 start npm --name "plp-backend" -- start

echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🏥 Health check:"
sleep 3
curl -s http://localhost:3001/api/v1/health | jq . || curl http://localhost:3001/api/v1/health

echo ""
echo "✅ Deployment complete!"