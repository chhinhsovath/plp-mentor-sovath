#!/bin/bash

# Simple deployment script for HTTP IP-based server
# Usage: ./deploy-to-ip-server.sh

SERVER_IP="157.10.73.52"
SERVER_USER="root"  # Change this to your server username

echo "🚀 Building and deploying PLP Mentoring to $SERVER_IP"

# Build frontend
echo "📦 Building frontend..."
cd frontend
echo "VITE_API_URL=http://$SERVER_IP:3001/api/v1" > .env.production
npm install
npm run build
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
rm -rf deploy-package
mkdir -p deploy-package/frontend
mkdir -p deploy-package/backend

# Copy frontend build
cp -r frontend/dist/* deploy-package/frontend/

# Copy backend files
cp -r backend/dist deploy-package/backend/
cp -r backend/node_modules deploy-package/backend/
cp backend/package.json deploy-package/backend/
cp backend/.env.example deploy-package/backend/

# Create setup script
cat > deploy-package/setup.sh << 'EOF'
#!/bin/bash

echo "Setting up PLP Mentoring on server..."

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally
sudo npm install -g pm2

# Setup directories
sudo mkdir -p /var/www/html/plp-mentoring
sudo mkdir -p /opt/plp-backend

# Copy frontend files
sudo cp -r frontend/* /var/www/html/plp-mentoring/
sudo chown -R www-data:www-data /var/www/html/plp-mentoring

# Setup backend
sudo cp -r backend/* /opt/plp-backend/
cd /opt/plp-backend

# Create .env file if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Please edit /opt/plp-backend/.env with your database credentials"
fi

# Start backend with PM2
pm2 stop plp-backend 2>/dev/null
pm2 start dist/main.js --name plp-backend
pm2 save
pm2 startup

echo "✅ Setup complete!"
echo "📝 Next steps:"
echo "1. Edit /opt/plp-backend/.env with your database credentials"
echo "2. Configure Nginx to serve frontend and proxy API requests"
echo "3. Access your app at https://mentoring.openplp.com"
EOF

chmod +x deploy-package/setup.sh

# Create nginx config
cat > deploy-package/nginx-config.conf << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    # Frontend
    root /var/www/html/plp-mentoring;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Deploy to server
echo "📤 Deploying to server..."
scp -r deploy-package/* $SERVER_USER@$SERVER_IP:/tmp/plp-deploy/

# Run setup on server
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /tmp/plp-deploy
chmod +x setup.sh
sudo ./setup.sh

# Setup Nginx if available
if command -v nginx &> /dev/null; then
    sudo cp nginx-config.conf /etc/nginx/sites-available/plp-mentoring
    sudo ln -sf /etc/nginx/sites-available/plp-mentoring /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
fi
ENDSSH

echo "✅ Deployment complete!"
echo "🌐 Your app should be accessible at: http://$SERVER_IP"
echo ""
echo "⚠️  Important: Since you're using HTTP, access the site via:"
echo "   http://$SERVER_IP (NOT https://mentoring.openplp.com)"