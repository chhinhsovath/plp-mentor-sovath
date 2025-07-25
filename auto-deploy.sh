#!/bin/bash

# Auto-deployment script for PLP Mentoring Platform
# Deploys to: https://mentoring.openplp.com
# Backend API: https://mentoring.openplp.com/api/v1

# Configuration
SERVER_IP="157.10.73.52"
SERVER_USER="ubuntu"
BACKEND_PATH="/var/csv/mentor_api/plp-mentor-sovath/backend"
FRONTEND_PATH="/var/www/html/mentoring"
REPO_URL="https://github.com/chhinhsovath/plp-mentor-sovath.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        print_status "✓ $1"
    else
        print_error "✗ $1"
        exit 1
    fi
}

# Start deployment
print_status "Starting automated deployment to $SERVER_IP"
echo "=============================================="

# Step 1: Push local changes to GitHub
print_status "Checking for local changes..."
if [[ -n $(git status -s) ]]; then
    print_status "Found local changes, committing and pushing..."
    git add -A
    git commit -m "Auto-commit before deployment $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin main
    check_status "Pushed local changes to GitHub"
else
    print_status "No local changes to commit"
fi

# Step 2: Create deployment script for server
print_status "Creating server deployment script..."

cat > /tmp/server-deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash

# Server deployment script
echo "Starting deployment on server..."

# Configuration
REPO_URL="https://github.com/chhinhsovath/plp-mentor-sovath.git"
APP_DIR="/var/csv/mentor_api/plp-mentor-sovath"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
WEB_DIR="/var/www/html/mentoring"

# Database configuration
DB_HOST="157.10.73.52"
DB_PORT="5432"
DB_NAME="plp_mentoring_sovath"
DB_USER="admin"
DB_PASSWORD="P@ssw0rd"

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
cd $APP_DIR
git fetch origin
git reset --hard origin/main
git pull origin main

# Backend deployment
echo "🔧 Deploying backend..."
cd $BACKEND_DIR

# Create production .env file
cat > .env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SSL=false
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://mentoring.openplp.com
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
LOG_LEVEL=info
EOF

# Install dependencies and build
npm install
npm run build

# Stop and restart backend with PM2
pm2 stop plp-backend 2>/dev/null || true
pm2 delete plp-backend 2>/dev/null || true
pm2 start dist/main.js --name plp-backend
pm2 save

echo "✅ Backend deployed and running on port 3001"

# Frontend deployment
echo "🎨 Deploying frontend..."
cd $FRONTEND_DIR

# Create production environment file
cat > .env.production << EOF
# Production API URL - MUST use HTTPS
VITE_API_URL=https://mentoring.openplp.com/api/v1
VITE_APP_NAME=PLP Mentoring Platform
VITE_APP_VERSION=1.0.0
VITE_BASE_URL=/mentoring/
EOF

# Build frontend
npm install
npm run build

# Deploy to web directory
sudo rm -rf $WEB_DIR/*
sudo mkdir -p $WEB_DIR
sudo cp -r dist/* $WEB_DIR/
sudo chown -R www-data:www-data $WEB_DIR

echo "✅ Frontend deployed to $WEB_DIR"

# Configure Nginx if needed
if [ ! -f /etc/nginx/sites-available/plp-mentoring ]; then
    echo "🔧 Configuring Nginx..."
    sudo tee /etc/nginx/sites-available/plp-mentoring > /dev/null << 'NGINX_CONFIG'
server {
    listen 80;
    server_name 157.10.73.52;

    # Frontend at /mentoring
    location /mentoring {
        alias /var/www/html/mentoring;
        try_files $uri $uri/ /mentoring/index.html;
        
        # Add headers for subdirectory
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Root redirect to mentoring
    location = / {
        return 301 /mentoring;
    }
}
NGINX_CONFIG

    sudo ln -sf /etc/nginx/sites-available/plp-mentoring /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx configured"
fi

# Test deployment
echo "🧪 Testing deployment..."
curl -s http://localhost:3001/api/v1/health | jq . || echo "Backend health check"
echo ""
echo "✅ Deployment complete!"
echo "🌐 Access the application at: https://mentoring.openplp.com"
DEPLOY_SCRIPT

check_status "Created deployment script"

# Step 3: Copy and execute on server
print_status "Deploying to server..."

# Copy script to server
scp /tmp/server-deploy.sh $SERVER_USER@$SERVER_IP:/tmp/
check_status "Copied deployment script to server"

# Execute deployment on server
ssh $SERVER_USER@$SERVER_IP 'bash /tmp/server-deploy.sh'
check_status "Executed deployment on server"

# Step 4: Update frontend configuration for subdirectory
print_status "Updating frontend configuration for subdirectory deployment..."

# Update vite.config.ts for subdirectory
cat > frontend/vite.config.ts << 'VITE_CONFIG'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/mentoring/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
        },
      },
    },
  },
})
VITE_CONFIG

# Update index.html for subdirectory
print_status "Updating HTML base path..."
sed -i.bak 's|<head>|<head>\n    <base href="/mentoring/">|' frontend/index.html 2>/dev/null || \
sed -i '' 's|<head>|<head>\
    <base href="/mentoring/">|' frontend/index.html

# Commit configuration changes
if [[ -n $(git status -s) ]]; then
    git add -A
    git commit -m "Configure frontend for subdirectory deployment at /mentoring"
    git push origin main
    check_status "Pushed configuration changes"
fi

# Step 5: Final deployment with updated config
print_status "Running final deployment with updated configuration..."
ssh $SERVER_USER@$SERVER_IP 'bash /tmp/server-deploy.sh'

# Step 6: Test the deployment
print_status "Testing deployment..."
echo ""

# Test backend
print_status "Testing backend API..."
curl -s http://$SERVER_IP:3001/api/v1/health | python3 -m json.tool || curl -s http://$SERVER_IP:3001/api/v1/health

# Test frontend
print_status "Testing frontend..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP/mentoring/)
if [ "$HTTP_STATUS" -eq 200 ]; then
    print_status "✓ Frontend is accessible"
else
    print_error "Frontend returned status code: $HTTP_STATUS"
fi

# Clean up
rm -f /tmp/server-deploy.sh

# Summary
echo ""
echo "=============================================="
print_status "🎉 Deployment Complete!"
echo ""
echo "📍 Frontend: https://mentoring.openplp.com"
echo "🔌 Backend API: https://mentoring.openplp.com/api/v1"
echo "📊 Health Check: https://mentoring.openplp.com/api/v1/health"
echo ""
echo "📝 Default Login:"
echo "   Username: chhinhs"
echo "   Password: password"
echo ""
echo "🔍 Logs:"
echo "   Backend: ssh $SERVER_USER@$SERVER_IP 'pm2 logs plp-backend'"
echo "   Nginx: ssh $SERVER_USER@$SERVER_IP 'sudo tail -f /var/log/nginx/error.log'"
echo "=============================================="