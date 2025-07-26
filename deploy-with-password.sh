#!/bin/bash

# Deployment script that handles password authentication

SERVER_IP="157.10.73.52"
SERVER_USER="ubuntu"
SERVER_PASS='en_&xdX#!N(^OqCQzc3RE0B)m6ogU!'

echo "🚀 Starting deployment to $SERVER_IP"
echo "===================================="

# Push to GitHub first
echo "📤 Pushing to GitHub..."
git add -A
git commit -m "Deployment $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin main

# Deploy to server using sshpass
echo "🔧 Deploying to server..."

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    else
        sudo apt-get install -y sshpass
    fi
fi

# Create deployment command
DEPLOY_CMD='
cd /var/csv/mentor_api/plp-mentor-sovath
git pull origin main
cd backend
npm install
npm run build || echo "No build step"
pm2 restart plp-backend || pm2 start npm --name "plp-backend" -- start
pm2 status
'

# Execute deployment
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$DEPLOY_CMD"

echo "✅ Deployment complete!"
echo "🏥 Check health: http://$SERVER_IP:3001/api/v1/health"