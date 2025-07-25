# PLP Mentoring Platform - Deployment Guide

## Current Issues
The login is failing because:
1. The backend API is not accessible from the frontend
2. CORS configuration needs to be properly set up
3. The frontend needs to be rebuilt with the correct API URL

## Step-by-Step Deployment Instructions

### 1. Backend Deployment

#### Option A: Deploy Backend on Same Server (Recommended)
If you want to host both frontend and backend on the same server:

```bash
# SSH into your server
ssh your-server

# Clone or update the repository
git clone https://github.com/chhinhsovath/plp-mentor-sovath.git
cd plp-mentor-sovath

# Navigate to backend
cd backend

# Install dependencies
npm install

# Create production .env file
cp .env.example .env
nano .env

# Update .env with these values:
NODE_ENV=production
PORT=3001
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_secure_jwt_secret
FRONTEND_URL=https://mentoring.openplp.com

# Build the backend
npm run build

# Install PM2 for process management
npm install -g pm2

# Start the backend with PM2
pm2 start dist/main.js --name plp-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Option B: Deploy Backend on Separate Server
If backend is on a different server (e.g., 157.10.73.52):

```bash
# On the backend server
cd /path/to/plp-mentor-sovath/backend
npm install
npm run build
pm2 restart plp-backend
```

### 2. Configure Nginx Reverse Proxy

Add this to your Nginx configuration to proxy API requests:

```nginx
server {
    listen 443 ssl;
    server_name mentoring.openplp.com;

    # Your SSL configuration here
    
    # Frontend files
    location / {
        root /var/www/plp-mentoring/dist;
        try_files $uri $uri/ /index.html;
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
}
```

### 3. Frontend Deployment

```bash
# On your local machine or build server
cd frontend

# Ensure .env.production has correct API URL
# If backend is on same domain:
echo "VITE_API_URL=/api/v1" > .env.production

# If backend is on different server:
# echo "VITE_API_URL=http://157.10.73.52:3001/api/v1" > .env.production

# Build the frontend
npm install
npm run build

# Upload dist folder to your server
scp -r dist/* your-server:/var/www/plp-mentoring/

# Or use rsync
rsync -avz --delete dist/ your-server:/var/www/plp-mentoring/
```

### 4. Verify Deployment

1. **Check Backend Health**:
```bash
curl https://mentoring.openplp.com/api/v1/health
```

2. **Check Frontend**:
- Visit https://mentoring.openplp.com
- Open browser console (F12)
- Try to login
- Check Network tab for API calls

### 5. Troubleshooting

#### If login still fails:

1. **Check Backend Logs**:
```bash
pm2 logs plp-backend
```

2. **Check CORS Headers**:
```bash
curl -I -X OPTIONS https://mentoring.openplp.com/api/v1/auth/login \
  -H "Origin: https://mentoring.openplp.com" \
  -H "Access-Control-Request-Method: POST"
```

3. **Test API Directly**:
```bash
curl -X POST https://mentoring.openplp.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"chhinhs","password":"password"}'
```

4. **Check Database Connection**:
```bash
# On backend server
cd backend
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

### 6. Quick Fix Script

Create this script on your server as `fix-deployment.sh`:

```bash
#!/bin/bash

echo "Fixing PLP Mentoring Deployment..."

# Update code
cd /path/to/plp-mentor-sovath
git pull

# Restart backend
cd backend
npm install
npm run build
pm2 restart plp-backend

# Rebuild frontend
cd ../frontend
echo "VITE_API_URL=/api/v1" > .env.production
npm install
npm run build
cp -r dist/* /var/www/plp-mentoring/

# Restart Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "Deployment fixed! Check https://mentoring.openplp.com"
```

## Login Credentials

Default test accounts:
- Admin: `chhinhs` / `password`
- Teacher: `teacher` / `teacher123`

## Important Notes

1. Ensure your database is running and accessible
2. The backend must be running on port 3001 (or update Nginx config)
3. CORS is configured to allow https://mentoring.openplp.com
4. SSL certificates must be properly configured

## Contact

If you continue to have issues, check:
1. Backend logs: `pm2 logs plp-backend`
2. Nginx logs: `/var/log/nginx/error.log`
3. Browser console for JavaScript errors
4. Network tab for failed API requests