# PLP Mentoring Platform - Deployment Guide

## Overview
This guide explains how to deploy the PLP Mentoring Platform to your server at `157.10.73.52` with:
- Frontend accessible at: `http://157.10.73.52/mentoring`
- Backend API at: `http://157.10.73.52:3001/api/v1`

## Prerequisites
- Server: Ubuntu with IP `157.10.73.52`
- PostgreSQL database already configured
- SSH access to the server

## Initial Setup (Run Once)

1. **Copy the setup script to your server:**
```bash
scp server-initial-setup.sh ubuntu@157.10.73.52:/tmp/
```

2. **Run the initial setup on the server:**
```bash
ssh ubuntu@157.10.73.52
sudo bash /tmp/server-initial-setup.sh
```

This will:
- Install Node.js, PM2, Nginx
- Create necessary directories
- Configure Nginx for `/mentoring` path
- Set up PM2 for process management
- Create initial configuration files

## Automated Deployment

After initial setup, you can deploy with a single command:

### Quick Deploy (Recommended)
```bash
./deploy-now.sh
```

This simple script runs the full automated deployment.

### Full Auto Deploy
```bash
./auto-deploy.sh
```

This script will:
1. ✅ Commit and push any local changes to GitHub
2. ✅ Pull latest code on the server
3. ✅ Build and deploy backend with PM2
4. ✅ Build and deploy frontend to `/mentoring`
5. ✅ Configure Nginx if needed
6. ✅ Test the deployment

## Manual Deployment Steps

If you prefer manual deployment:

### 1. Push Changes to GitHub
```bash
git add -A
git commit -m "Your commit message"
git push origin main
```

### 2. Deploy on Server
```bash
ssh ubuntu@157.10.73.52
cd /var/csv/mentor_api/plp-mentor-sovath

# Pull latest code
git pull origin main

# Deploy backend
cd backend
npm install
npm run build
pm2 restart plp-backend

# Deploy frontend
cd ../frontend
npm install
npm run build
sudo rm -rf /var/www/html/mentoring/*
sudo cp -r dist/* /var/www/html/mentoring/
sudo chown -R www-data:www-data /var/www/html/mentoring
```

## Configuration Files

### Frontend Configuration
- **Development**: `frontend/.env`
- **Production**: `frontend/.env.production`
- **Vite Config**: `frontend/vite.config.ts` (base: '/mentoring/')

### Backend Configuration
- **Server location**: `/var/csv/mentor_api/plp-mentor-sovath/backend/.env`
- **Important**: Update `JWT_SECRET` for security!

### Nginx Configuration
- **Location**: `/etc/nginx/sites-available/plp-mentoring`
- **Serves frontend at**: `/mentoring`
- **Proxies API to**: `localhost:3001`

## Access URLs

- **Frontend**: http://157.10.73.52/mentoring
- **Backend API**: http://157.10.73.52:3001/api/v1
- **Health Check**: http://157.10.73.52:3001/api/v1/health

## Default Login Credentials
- Username: `chhinhs`
- Password: `password`

## Monitoring & Logs

### View Backend Logs
```bash
ssh ubuntu@157.10.73.52 'pm2 logs plp-backend'
```

### View Nginx Logs
```bash
ssh ubuntu@157.10.73.52 'sudo tail -f /var/log/nginx/plp-mentoring-error.log'
```

### Check Backend Status
```bash
ssh ubuntu@157.10.73.52 'pm2 status'
```

## Troubleshooting

### Backend Not Running
```bash
ssh ubuntu@157.10.73.52
cd /var/csv/mentor_api/plp-mentor-sovath/backend
pm2 start dist/main.js --name plp-backend
pm2 save
```

### Frontend Not Loading
1. Check Nginx is running: `sudo systemctl status nginx`
2. Check files exist: `ls -la /var/www/html/mentoring/`
3. Check Nginx config: `sudo nginx -t`

### Database Connection Issues
Check `.env` file has correct database credentials:
```bash
cat /var/csv/mentor_api/plp-mentor-sovath/backend/.env
```

### API Not Accessible
Test directly on server:
```bash
curl http://localhost:3001/api/v1/health
```

## Security Notes

1. **Change JWT_SECRET**: Edit the backend `.env` file and use a strong secret
2. **Database Password**: Ensure PostgreSQL has a strong password
3. **Firewall**: Consider setting up UFW to limit access
4. **HTTPS**: For production, consider adding SSL with Let's Encrypt

## Backup Strategy

### Database Backup
```bash
pg_dump -h 157.10.73.52 -U admin -d plp_mentoring_sovath > backup.sql
```

### Application Backup
```bash
tar -czf plp-backup-$(date +%Y%m%d).tar.gz /var/csv/mentor_api/plp-mentor-sovath
```

## Updates and Maintenance

To update the application:
1. Make changes locally
2. Test thoroughly
3. Run `./deploy-now.sh`

The automated script handles everything else!

---

For issues or questions, check the logs first, then refer to the troubleshooting section.