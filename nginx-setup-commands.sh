#!/bin/bash

# Quick Nginx setup for your server
# Run these commands on your server (157.10.73.52)

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/plp-mentoring > /dev/null << 'EOF'
server {
    listen 80;
    server_name 157.10.73.52;

    # Frontend files
    root /var/www/html/plp-mentoring;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to port 3001
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
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/plp-mentoring /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Create frontend directory
sudo mkdir -p /var/www/html/plp-mentoring

# Set permissions
sudo chown -R www-data:www-data /var/www/html/plp-mentoring

# Test and reload Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Nginx configured!"
echo "📁 Upload frontend files to: /var/www/html/plp-mentoring/"
echo "🌐 Access site at: https://mentoring.openplp.com"