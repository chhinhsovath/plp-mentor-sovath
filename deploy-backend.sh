#!/bin/bash

# Backend Deployment Script for PLP Mentoring Platform
# This script deploys the backend to your server at 157.10.73.52

echo "🚀 Starting backend deployment..."

# Configuration
SERVER_IP="157.10.73.52"
SERVER_USER="ubuntu"
REMOTE_DIR="/home/ubuntu/plp-mentor-sovath"
PM2_APP_NAME="plp-backend"

# Check if we can connect to the server
echo "📡 Testing connection to server..."
ssh -o ConnectTimeout=5 $SERVER_USER@$SERVER_IP "echo 'Connection successful!'" || {
    echo "❌ Cannot connect to server. Please check your SSH access."
    exit 1
}

# Create deployment directory on server
echo "📁 Creating deployment directory..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"

# Copy backend files to server
echo "📤 Uploading backend files..."
rsync -avz --exclude 'node_modules' \
           --exclude '.env' \
           --exclude 'dist' \
           --exclude '*.log' \
           --exclude 'uploads/*' \
           --exclude 'backups/*' \
           ./backend/ $SERVER_USER@$SERVER_IP:$REMOTE_DIR/backend/

# Copy production environment file
echo "🔐 Uploading production environment..."
scp ./backend/.env.production $SERVER_USER@$SERVER_IP:$REMOTE_DIR/backend/.env

# Install dependencies and build on server
echo "📦 Installing dependencies and building..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /home/ubuntu/plp-mentor-sovath/backend

# Install Node.js 18 if not present
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install dependencies
echo "Installing npm dependencies..."
npm ci --production=false

# Build the application
echo "Building application..."
npm run build

# Create necessary directories
mkdir -p uploads backups

# Set permissions
chmod -R 755 uploads backups

ENDSSH

# Setup PM2 process
echo "🔄 Setting up PM2 process..."
ssh $SERVER_USER@$SERVER_IP << ENDSSH
cd /home/ubuntu/plp-mentor-sovath/backend

# Stop existing process if running
pm2 stop $PM2_APP_NAME 2>/dev/null || true
pm2 delete $PM2_APP_NAME 2>/dev/null || true

# Start the application with PM2
pm2 start dist/main.js --name $PM2_APP_NAME \
  --max-memory-restart 1G \
  --instances 2 \
  --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
sudo pm2 startup systemd -u $USER --hp /home/$USER
pm2 save

ENDSSH

# Setup Nginx
echo "🌐 Setting up Nginx..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/plp-api << 'EOF'
server {
    listen 80;
    server_name api.mentoring.openpip.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://mentoring.openpip.com' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/plp-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

ENDSSH

# Check deployment status
echo "✅ Checking deployment status..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
echo "PM2 Status:"
pm2 status
echo ""
echo "Application logs (last 20 lines):"
pm2 logs plp-backend --lines 20 --nostream
ENDSSH

echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure DNS for api.mentoring.openpip.com to point to $SERVER_IP"
echo "2. Install SSL certificate with: sudo certbot --nginx -d api.mentoring.openpip.com"
echo "3. Update Vercel environment variable VITE_API_URL to: https://api.mentoring.openpip.com/api/v1"
echo ""
echo "📊 Monitor logs with: ssh $SERVER_USER@$SERVER_IP 'pm2 logs plp-backend'"