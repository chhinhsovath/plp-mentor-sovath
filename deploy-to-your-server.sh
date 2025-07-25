#!/bin/bash

# Deployment script for your specific server setup
# Server IP: 157.10.73.52
# Backend location: /var/csv/mentor_api/plp-mentor-sovath/backend

SERVER_IP="157.10.73.52"
SERVER_USER="root"  # Change this to your server username
BACKEND_PATH="/var/csv/mentor_api/plp-mentor-sovath/backend"

echo "🚀 Deploying PLP Mentoring to your server at $SERVER_IP"
echo "📍 Backend is at: $BACKEND_PATH"

# Step 1: Build frontend locally
echo "📦 Building frontend for HTTP deployment..."
cd frontend
echo "VITE_API_URL=http://$SERVER_IP:3000/api/v1" > .env.production
npm install
npm run build
cd ..

# Step 2: Create deployment commands
echo "📝 Creating server deployment commands..."

cat > server-commands.sh << EOF
#!/bin/bash

echo "🔧 Setting up on server..."

# 1. Update backend code
cd $BACKEND_PATH
git pull origin main
npm install
npm run build

# 2. Update backend .env if needed
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please edit $BACKEND_PATH/.env with your database credentials"
fi

# Make sure CORS allows HTTP access
echo "FRONTEND_URL=http://$SERVER_IP" >> .env

# 3. Restart backend with PM2
pm2 stop plp-backend 2>/dev/null || true
pm2 start dist/main.js --name plp-backend
pm2 save

# 4. Setup frontend directory
mkdir -p /var/www/html/plp-mentoring
rm -rf /var/www/html/plp-mentoring/*

echo "✅ Server setup complete!"
EOF

# Step 3: Deploy to server
echo "📤 Deploying to server..."

# Copy frontend build to server
scp -r frontend/dist/* $SERVER_USER@$SERVER_IP:/var/www/html/plp-mentoring/

# Copy and run server commands
scp server-commands.sh $SERVER_USER@$SERVER_IP:/tmp/
ssh $SERVER_USER@$SERVER_IP 'bash /tmp/server-commands.sh'

# Step 4: Setup Nginx configuration
echo "🔧 Setting up Nginx..."

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
# Create Nginx config
cat > /etc/nginx/sites-available/plp-mentoring << 'NGINX'
server {
    listen 80;
    server_name 157.10.73.52;

    # Frontend files
    root /var/www/html/plp-mentoring;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        
        # Add CORS headers for same-origin
        add_header 'Access-Control-Allow-Origin' '*' always;
    }

    # API proxy - backend is on port 3000
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

# Enable the site
ln -sf /etc/nginx/sites-available/plp-mentoring /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx

# Set proper permissions
chown -R www-data:www-data /var/www/html/plp-mentoring
ENDSSH

echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your application at: http://$SERVER_IP"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - You MUST access via HTTP: http://$SERVER_IP"
echo "   - NOT via HTTPS: https://mentoring.openplp.com"
echo "   - HTTPS will block HTTP API calls!"
echo ""
echo "🔍 To test:"
echo "   1. Backend health: curl http://$SERVER_IP:3000/api/v1/health"
echo "   2. Frontend: curl http://$SERVER_IP"
echo "   3. Login: Visit http://$SERVER_IP in your browser"

# Cleanup
rm -f server-commands.sh