#!/bin/bash

# Initial server setup script for Ubuntu
# Run this once on a fresh server

echo "🔧 PLP Mentor Backend Server Setup"
echo "=================================="

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 LTS)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install essential tools
echo "📦 Installing essential tools..."
sudo apt install -y git curl build-essential nginx

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # Backend API
sudo ufw --force enable

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /home/ubuntu/plp-mentor-sovath

# Setup Nginx (optional - for reverse proxy)
echo "🌐 Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/plp-backend > /dev/null <<EOF
server {
    listen 80;
    server_name 157.10.73.52;

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the Nginx site
sudo ln -sf /etc/nginx/sites-available/plp-backend /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Make deployment script executable
if [ -f "/home/ubuntu/deploy-backend.sh" ]; then
    chmod +x /home/ubuntu/deploy-backend.sh
fi

echo "✅ Server setup completed!"
echo ""
echo "Next steps:"
echo "1. Copy deploy-backend.sh to /home/ubuntu/"
echo "2. Run: ./deploy-backend.sh"
echo "3. Configure GitHub Actions with the server password as a secret"