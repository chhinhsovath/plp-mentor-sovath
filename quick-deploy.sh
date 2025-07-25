#!/bin/bash

# Quick deployment script now that backend is working

echo "🚀 Quick Deploy - Frontend Only"
echo "Backend already running at: http://157.10.73.52:3001"

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Deploy to server
echo "📤 Deploying frontend to server..."
scp -r frontend/dist/* ubuntu@157.10.73.52:/tmp/frontend-dist/

# Move files on server
ssh ubuntu@157.10.73.52 << 'EOF'
# Setup frontend
sudo mkdir -p /var/www/html/plp-mentoring
sudo cp -r /tmp/frontend-dist/* /var/www/html/plp-mentoring/
sudo chown -R www-data:www-data /var/www/html/plp-mentoring
rm -rf /tmp/frontend-dist

# Check if Nginx is configured
if [ ! -f /etc/nginx/sites-enabled/plp-mentoring ]; then
    echo "⚠️  Nginx not configured. Run nginx-setup-commands.sh on the server."
fi

echo "✅ Frontend deployed!"
EOF

echo ""
echo "✅ Deployment complete!"
echo "🌐 Access your app at: http://157.10.73.52"
echo ""
echo "⚠️  Remember: Use HTTP, not HTTPS!"