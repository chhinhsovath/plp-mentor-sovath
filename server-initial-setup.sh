#!/bin/bash

# Initial server setup script - Run this ONCE on your server
# This sets up the environment for automated deployments

echo "🔧 PLP Mentoring Platform - Server Initial Setup"
echo "=============================================="

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   echo "✓ Running with appropriate permissions"
else
   echo "❌ This script must be run as root or with sudo"
   exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required software
echo "📦 Installing required software..."

# Install Node.js 18
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
fi

# Install PostgreSQL client (for testing)
apt-get install -y postgresql-client

# Install other utilities
apt-get install -y git curl jq

echo "✓ Software installation complete"

# Create application directory
echo "📁 Creating application directories..."
mkdir -p /var/csv/mentor_api/plp-mentor-sovath
mkdir -p /var/www/html/mentoring
mkdir -p /var/log/plp-mentoring

# Set permissions
chown -R ubuntu:ubuntu /var/csv/mentor_api
chown -R www-data:www-data /var/www/html/mentoring

# Clone repository
echo "📥 Cloning repository..."
cd /var/csv/mentor_api
if [ -d "plp-mentor-sovath" ]; then
    echo "Repository already exists, pulling latest..."
    cd plp-mentor-sovath
    git pull origin main
else
    git clone https://github.com/chhinhsovath/plp-mentor-sovath.git
    cd plp-mentor-sovath
fi

# Configure PM2 startup
echo "⚙️ Configuring PM2 startup..."
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

# Configure Nginx
echo "🔧 Configuring Nginx..."
cat > /etc/nginx/sites-available/plp-mentoring << 'NGINX_CONFIG'
server {
    listen 80;
    server_name 157.10.73.52;

    # Logs
    access_log /var/log/nginx/plp-mentoring-access.log;
    error_log /var/log/nginx/plp-mentoring-error.log;

    # Frontend at /mentoring
    location /mentoring {
        alias /var/www/html/mentoring;
        try_files $uri $uri/ /mentoring/index.html;
        
        # Security headers
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Root redirect to mentoring
    location = / {
        return 301 /mentoring;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
NGINX_CONFIG

# Enable site
ln -sf /etc/nginx/sites-available/plp-mentoring /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx

# Create deployment user SSH directory
echo "🔐 Setting up deployment access..."
mkdir -p /home/ubuntu/.ssh
chown -R ubuntu:ubuntu /home/ubuntu/.ssh
chmod 700 /home/ubuntu/.ssh

# Create initial backend environment file
echo "📝 Creating initial backend configuration..."
cat > /var/csv/mentor_api/plp-mentor-sovath/backend/.env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://admin:P@ssw0rd@157.10.73.52:5432/plp_mentoring_sovath
DB_HOST=157.10.73.52
DB_PORT=5432
DB_NAME=plp_mentoring_sovath
DB_USER=admin
DB_PASSWORD=P@ssw0rd
DB_SSL=false
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://mentoring.openplp.com
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
LOG_LEVEL=info
EOF

# Set permissions
chown ubuntu:ubuntu /var/csv/mentor_api/plp-mentor-sovath/backend/.env
chmod 600 /var/csv/mentor_api/plp-mentor-sovath/backend/.env

# Create systemd service for backend (backup for PM2)
echo "📝 Creating systemd service..."
cat > /etc/systemd/system/plp-backend.service << 'SERVICE'
[Unit]
Description=PLP Mentoring Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/csv/mentor_api/plp-mentor-sovath/backend
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/plp-mentoring/backend.log
StandardError=append:/var/log/plp-mentoring/backend-error.log

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload

# Create log rotation
echo "📝 Setting up log rotation..."
cat > /etc/logrotate.d/plp-mentoring << 'LOGROTATE'
/var/log/plp-mentoring/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
LOGROTATE

# Final setup
echo "🔧 Final setup..."
cd /var/csv/mentor_api/plp-mentor-sovath

# Install dependencies
cd backend
npm install
cd ../frontend
npm install
cd ..

# Summary
echo ""
echo "=============================================="
echo "✅ Server Initial Setup Complete!"
echo ""
echo "📍 Application directory: /var/csv/mentor_api/plp-mentor-sovath"
echo "📍 Frontend directory: /var/www/html/mentoring"
echo "📍 Nginx config: /etc/nginx/sites-available/plp-mentoring"
echo "📍 Backend .env: /var/csv/mentor_api/plp-mentor-sovath/backend/.env"
echo ""
echo "🔐 IMPORTANT: Update the JWT_SECRET in backend/.env!"
echo ""
echo "Next steps:"
echo "1. Run the first deployment: ./auto-deploy.sh"
echo "2. Access the site at: https://mentoring.openplp.com"
echo ""
echo "=============================================="