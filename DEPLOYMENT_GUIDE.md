# Deployment Guide

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- Backend API deployed and accessible

### Steps

1. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository: `chhinhsovath/plp-mentor-sovath`

2. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Root Directory: `.` (leave as is)
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `cd frontend && npm install`

3. **Environment Variables**
   Add these environment variables in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend-api.com/api/v1
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy on every push to main branch

## Backend Deployment Options

### Option 1: Deploy to Railway (Recommended)
Railway supports NestJS applications with PostgreSQL.

1. Go to [Railway](https://railway.app)
2. Create new project
3. Deploy from GitHub repo
4. Add PostgreSQL database
5. Set environment variables from `backend/.env.example`

### Option 2: Deploy to Render
1. Go to [Render](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Build Command: `cd backend && npm install && npm run build`
5. Start Command: `cd backend && npm run start:prod`

### Option 3: Deploy to VPS (Your existing server)
Since you already have a server at 157.10.73.52:

```bash
# SSH to your server
ssh ubuntu@157.10.73.52

# Clone the repository
git clone https://github.com/chhinhsovath/plp-mentor-sovath.git
cd plp-mentor-sovath/backend

# Install dependencies
npm install

# Build the application
npm run build

# Install PM2 (if not installed)
npm install -g pm2

# Start with PM2
pm2 start dist/main.js --name plp-backend

# Setup Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/plp-api

# Add this configuration:
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/plp-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Post-Deployment Steps

1. **Update Frontend Environment**
   - Update `VITE_API_URL` in Vercel with your backend URL
   - Redeploy frontend

2. **Test the Application**
   - Visit your Vercel URL
   - Test login functionality
   - Verify API connections

3. **Setup SSL (for VPS)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

## Troubleshooting

### Vercel Build Errors
- Make sure `vercel.json` is in the root directory
- Check build logs in Vercel dashboard
- Verify all frontend dependencies are in `package.json`

### Backend Connection Issues
- Check CORS settings in backend
- Verify environment variables
- Check server logs: `pm2 logs plp-backend`

### Database Connection
- Ensure PostgreSQL is accessible
- Check connection string in environment variables
- Verify SSL settings for database connection