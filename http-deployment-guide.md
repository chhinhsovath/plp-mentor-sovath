# HTTP Deployment Guide (For IP-based Server without SSL)

## Important Note
Since `https://mentoring.openplp.com` uses HTTPS, it CANNOT make requests to your HTTP backend at `https://mentoring.openplp.com/api`. You have two options:

## Option 1: Access Your App via HTTP IP Address (Recommended for your setup)

### Step 1: Deploy Frontend to Your Server

```bash
# Build frontend with HTTP backend URL
cd frontend
npm install
npm run build

# Copy the dist folder to your server at 157.10.73.52
scp -r dist/* user@157.10.73.52:/var/www/html/plp-mentoring/
```

### Step 2: Configure Nginx on Your Server

Create `/etc/nginx/sites-available/plp-mentoring`:

```nginx
server {
    listen 80;
    server_name 157.10.73.52;

    # Frontend files
    root /var/www/html/plp-mentoring;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/plp-mentoring /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Deploy Backend

```bash
# On your server at 157.10.73.52
cd /path/to/plp-mentor-sovath/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
nano .env

# Add these values:
NODE_ENV=production
PORT=3001
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_secret_key
FRONTEND_URL=https://mentoring.openplp.com

# Build and start backend
npm run build
pm2 start dist/main.js --name plp-backend
pm2 save
```

### Step 4: Update CORS for HTTP Access

Edit `backend/src/config/security.config.ts`:

```typescript
const allowedOrigins = nodeEnv === 'production' 
  ? [
      'https://mentoring.openplp.com',
      'https://mentoring.openplp.com:80',
      frontendUrl
    ] 
  : [
      frontendUrl, 
      'http://localhost:3000', 
      'http://localhost:5173'
    ];
```

### Step 5: Access Your Application

✅ **Access via**: `https://mentoring.openplp.com`
❌ **NOT**: `https://mentoring.openplp.com` (This won't work with HTTP backend)

## Option 2: Use a Different Frontend URL

If you need to keep using the domain, you could:

1. Set up a subdomain that uses HTTP: `http://dev.mentoring.openplp.com`
2. Or use a different port: `http://mentoring.openplp.com:8080`

## Option 3: Quick Test with Local Frontend

For immediate testing, run the frontend locally:

```bash
# On your local machine
cd frontend

# Create .env.local for testing
echo "VITE_API_URL=https://mentoring.openplp.com/api/v1" > .env.local

# Run development server
npm run dev

# Access at http://localhost:5173
```

## Deployment Script

Create this script on your server as `deploy.sh`:

```bash
#!/bin/bash

# Configuration
BACKEND_DIR="/opt/plp-mentor-sovath/backend"
FRONTEND_DIR="/var/www/html/plp-mentoring"
REPO_URL="https://github.com/chhinhsovath/plp-mentor-sovath.git"

echo "🚀 Deploying PLP Mentoring Platform..."

# Update code
cd /opt
if [ ! -d "plp-mentor-sovath" ]; then
    git clone $REPO_URL
fi
cd plp-mentor-sovath
git pull

# Deploy backend
echo "📦 Building backend..."
cd backend
npm install
npm run build

# Restart backend
pm2 stop plp-backend 2>/dev/null
pm2 start dist/main.js --name plp-backend
pm2 save

# Deploy frontend
echo "📦 Building frontend..."
cd ../frontend
echo "VITE_API_URL=https://mentoring.openplp.com/api/v1" > .env.production
npm install
npm run build

# Copy frontend files
sudo rm -rf $FRONTEND_DIR/*
sudo cp -r dist/* $FRONTEND_DIR/

# Set permissions
sudo chown -R www-data:www-data $FRONTEND_DIR

# Restart services
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 Access your app at: https://mentoring.openplp.com"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Testing

1. **Check Backend**:
```bash
curl https://mentoring.openplp.com/api/v1/health
```

2. **Check Frontend**:
```bash
curl https://mentoring.openplp.com
```

3. **Test Login**:
```bash
curl -X POST https://mentoring.openplp.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"chhinhs","password":"password"}'
```

## Important Security Note

⚠️ **Running without SSL is insecure!** User passwords and data are transmitted in plain text. This setup should only be used for:
- Internal networks
- Development/testing
- Temporary deployments

For production, consider:
- Getting a domain name and SSL certificate (free with Let's Encrypt)
- Using a reverse proxy service like Cloudflare
- Setting up a VPN for secure access