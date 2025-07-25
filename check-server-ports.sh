#!/bin/bash

# Quick script to check what's running on server ports

SERVER="ubuntu@157.10.73.52"

echo "🔍 Checking server ports..."

ssh $SERVER << 'EOF'
echo "Port 80:"
sudo lsof -i :80 | head -5

echo -e "\nPort 3001:"
sudo lsof -i :3001 | head -5

echo -e "\nNginx status:"
sudo systemctl status nginx --no-pager 2>/dev/null || echo "Nginx not installed"

echo -e "\nPM2 processes:"
pm2 list 2>/dev/null || echo "PM2 not installed"

echo -e "\nChecking /var/www/html contents:"
ls -la /var/www/html/ 2>/dev/null || echo "Directory not found"
EOF