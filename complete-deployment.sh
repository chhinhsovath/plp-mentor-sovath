#!/bin/bash

# Complete deployment script with your server details
# Server: 157.10.73.52 (ubuntu user)
# Backend path: /var/csv/mentor_api/plp-mentor-sovath/backend

SERVER_IP="157.10.73.52"
SERVER_USER="ubuntu"
BACKEND_PATH="/var/csv/mentor_api/plp-mentor-sovath/backend"

echo "🚀 Complete PLP Mentoring Deployment"
echo "📍 Server: $SERVER_USER@$SERVER_IP"
echo "📍 Backend: $BACKEND_PATH"
echo "=" * 50

# Step 1: Update backend .env configuration
echo "📝 Creating backend .env configuration..."
cat > backend.env << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://admin:P@ssw0rd@157.10.73.52:5432/plp_mentoring_sovath

# Alternative DB Config
DB_HOST=157.10.73.52
DB_PORT=5432
DB_NAME=plp_mentoring_sovath
DB_USER=admin
DB_PASSWORD=P@ssw0rd
DB_SSL=false

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Frontend URL for CORS
FRONTEND_URL=http://157.10.73.52

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
EOF

# Step 2: Build frontend with correct API URL
echo "📦 Building frontend..."
cd frontend
cat > .env.production << EOF
# Production API URL for your server
VITE_API_URL=http://$SERVER_IP:3000/api/v1
VITE_APP_NAME=PLP Mentoring Platform
VITE_APP_VERSION=1.0.0
EOF

npm install
npm run build
cd ..

# Step 3: Create deployment script for server
cat > deploy-on-server.sh << 'DEPLOY'
#!/bin/bash

echo "🔧 Deploying on server..."

# Update backend
cd /var/csv/mentor_api/plp-mentor-sovath
git pull origin main

cd backend
npm install
npm run build

# Stop current backend process
pm2 stop plp-backend 2>/dev/null || true
pkill -f "node.*main.js" 2>/dev/null || true

# Start backend with PM2
pm2 start dist/main.js --name plp-backend
pm2 save
pm2 startup

# Check if backend is running
sleep 3
pm2 status

echo "✅ Backend deployment complete!"
DEPLOY

# Step 4: Deploy to server
echo "📤 Connecting to server and deploying..."

# Copy files to server
echo "Copying backend .env file..."
scp backend.env $SERVER_USER@$SERVER_IP:$BACKEND_PATH/.env

echo "Copying frontend build..."
ssh $SERVER_USER@$SERVER_IP "sudo mkdir -p /var/www/html/plp-mentoring"
scp -r frontend/dist/* $SERVER_USER@$SERVER_IP:/tmp/frontend-dist/
ssh $SERVER_USER@$SERVER_IP "sudo cp -r /tmp/frontend-dist/* /var/www/html/plp-mentoring/ && sudo chown -R www-data:www-data /var/www/html/plp-mentoring"

echo "Copying deployment script..."
scp deploy-on-server.sh $SERVER_USER@$SERVER_IP:/tmp/

# Run deployment on server
ssh $SERVER_USER@$SERVER_IP 'bash /tmp/deploy-on-server.sh'

# Step 5: Configure Nginx
echo "🔧 Configuring Nginx..."
ssh $SERVER_USER@$SERVER_IP << 'NGINX_CONFIG'
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/plp-mentoring > /dev/null << 'NGINX'
server {
    listen 80;
    server_name 157.10.73.52;

    # Frontend
    root /var/www/html/plp-mentoring;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long operations
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX

# Enable site
sudo ln -sf /etc/nginx/sites-available/plp-mentoring /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t && sudo systemctl reload nginx
NGINX_CONFIG

# Step 6: Test the deployment
echo ""
echo "🧪 Testing deployment..."
echo ""

# Test backend
echo "Testing backend API..."
curl -s http://$SERVER_IP:3000/api/v1/health || echo "Backend not responding on port 3000"

# Test frontend through Nginx
echo ""
echo "Testing frontend..."
curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP || echo "Frontend not accessible"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your application at: http://$SERVER_IP"
echo ""
echo "📝 Login credentials:"
echo "   Username: chhinhs"
echo "   Password: password"
echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "1. You MUST access via HTTP: http://$SERVER_IP"
echo "2. DO NOT use: https://mentoring.openplp.com (HTTPS will block HTTP API)"
echo "3. Check backend logs: ssh $SERVER_USER@$SERVER_IP 'pm2 logs plp-backend'"
echo "4. Check backend status: ssh $SERVER_USER@$SERVER_IP 'pm2 status'"
echo ""
echo "🔍 Troubleshooting commands:"
echo "   - Backend logs: pm2 logs plp-backend"
echo "   - Backend restart: pm2 restart plp-backend"
echo "   - Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   - Test API: curl http://$SERVER_IP:3000/api/v1/health"

# Cleanup
rm -f backend.env deploy-on-server.sh