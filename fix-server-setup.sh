#!/bin/bash

# Fix server setup - Frontend on port 80, Backend on port 3001

SERVER_IP="157.10.73.52"
SERVER_USER="ubuntu"

echo "🔧 Fixing server setup..."
echo "📍 Server: $SERVER_USER@$SERVER_IP"
echo "=" * 50

# First, build frontend locally
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Create server setup script
cat > server-fix.sh << 'SCRIPT'
#!/bin/bash

echo "🔧 Setting up server..."

# 1. Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# 2. Stop any service using port 80
echo "Checking what's using port 80..."
sudo lsof -i :80
sudo systemctl stop apache2 2>/dev/null || true
sudo systemctl disable apache2 2>/dev/null || true

# 3. Create frontend directory
sudo mkdir -p /var/www/html/plp-mentoring
sudo chown -R $USER:$USER /var/www/html/plp-mentoring

# 4. Configure Nginx
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/plp-mentoring > /dev/null << 'NGINX'
server {
    listen 80;
    server_name 157.10.73.52;

    # Frontend static files
    root /var/www/html/plp-mentoring;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend on port 3001
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
        
        # Handle CORS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Health check
    location /health {
        return 200 "Frontend OK\n";
        add_header Content-Type text/plain;
    }
}
NGINX

# 5. Enable site and disable default
sudo ln -sf /etc/nginx/sites-available/plp-mentoring /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 6. Test Nginx config
sudo nginx -t

# 7. Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# 8. Check status
echo ""
echo "✅ Nginx configured and running"
echo "Nginx status:"
sudo systemctl status nginx --no-pager | head -10

# 9. Check what's running on ports
echo ""
echo "Port 80 (should be Nginx):"
sudo lsof -i :80 | head -5
echo ""
echo "Port 3001 (should be Node.js backend):"
sudo lsof -i :3001 | head -5

# 10. Set permissions
sudo chown -R www-data:www-data /var/www/html/plp-mentoring

echo ""
echo "✅ Server setup complete!"
SCRIPT

# Deploy to server
echo "📤 Deploying to server..."

# Copy and run setup script
scp server-fix.sh $SERVER_USER@$SERVER_IP:/tmp/
ssh $SERVER_USER@$SERVER_IP 'bash /tmp/server-fix.sh'

# Copy frontend files
echo "📤 Copying frontend files..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p /tmp/frontend-dist"
scp -r frontend/dist/* $SERVER_USER@$SERVER_IP:/tmp/frontend-dist/
ssh $SERVER_USER@$SERVER_IP << 'EOF'
sudo cp -r /tmp/frontend-dist/* /var/www/html/plp-mentoring/
sudo chown -R www-data:www-data /var/www/html/plp-mentoring
rm -rf /tmp/frontend-dist
ls -la /var/www/html/plp-mentoring/
EOF

# Test the setup
echo ""
echo "🧪 Testing setup..."
echo ""

# Test frontend
echo "Testing frontend (port 80):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://$SERVER_IP/

# Test API through Nginx
echo ""
echo "Testing API through Nginx:"
curl -s http://$SERVER_IP/api/v1/health | python3 -m json.tool 2>/dev/null || curl -s http://$SERVER_IP/api/v1/health

# Test backend directly
echo ""
echo "Testing backend directly (port 3001):"
curl -s http://$SERVER_IP:3001/api/v1/health | python3 -m json.tool 2>/dev/null || curl -s http://$SERVER_IP:3001/api/v1/health

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app is now accessible at: http://$SERVER_IP"
echo "📱 Frontend: http://$SERVER_IP"
echo "🔌 API: http://$SERVER_IP/api/v1"
echo ""
echo "📝 Default login:"
echo "   Username: chhinhs"
echo "   Password: password"
echo ""
echo "🔍 Troubleshooting:"
echo "   - Check Nginx logs: ssh $SERVER_USER@$SERVER_IP 'sudo tail -f /var/log/nginx/error.log'"
echo "   - Check Nginx access: ssh $SERVER_USER@$SERVER_IP 'sudo tail -f /var/log/nginx/access.log'"
echo "   - Restart Nginx: ssh $SERVER_USER@$SERVER_IP 'sudo systemctl restart nginx'"
echo "   - Check backend: ssh $SERVER_USER@$SERVER_IP 'pm2 status'"

# Cleanup
rm -f server-fix.sh