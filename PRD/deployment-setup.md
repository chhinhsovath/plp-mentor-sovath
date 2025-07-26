# Backend Deployment Setup Guide

## Overview
This guide explains how to set up automatic deployment for the PLP Mentor backend to your Ubuntu server at `157.10.73.52`.

## Prerequisites
- Ubuntu server with SSH access
- GitHub repository: https://github.com/chhinhsovath/plp-mentor-sovath.git
- Node.js application running on port 3001

## Setup Steps

### 1. Add GitHub Secret
1. Go to your GitHub repository settings
2. Navigate to Settings > Secrets and variables > Actions
3. Add a new repository secret:
   - Name: `SERVER_PASSWORD`
   - Value: Your server password

### 2. Initial Server Setup
SSH into your server and run the server setup script:

```bash
ssh ubuntu@157.10.73.52

# Create and run the setup script
nano /home/ubuntu/server-setup.sh
# Copy the content from scripts/server-setup.sh
chmod +x /home/ubuntu/server-setup.sh
./server-setup.sh
```

### 3. Deploy Script Setup
Copy the deployment script to your server:

```bash
# On your server
nano /home/ubuntu/deploy-backend.sh
# Copy the content from scripts/deploy-backend.sh
chmod +x /home/ubuntu/deploy-backend.sh
```

### 4. Manual Deployment
To manually deploy:

```bash
ssh ubuntu@157.10.73.52
./deploy-backend.sh
```

### 5. Automatic Deployment
The GitHub Actions workflow (`.github/workflows/deploy-backend.yml`) will automatically:
- Trigger on pushes to the `main` branch
- Only run when backend files are changed
- SSH into your server
- Pull the latest code
- Install dependencies
- Restart the application using PM2

## Server Configuration

### PM2 Process Manager
The backend runs under PM2 with the name `plp-backend`. Common PM2 commands:

```bash
pm2 list              # List all processes
pm2 logs plp-backend  # View logs
pm2 restart plp-backend
pm2 stop plp-backend
pm2 start plp-backend
```

### Nginx Configuration
Nginx is configured as a reverse proxy:
- Port 80 → localhost:3001
- API endpoint: http://157.10.73.52/api/

### Firewall Rules
Open ports:
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 3001 (Direct API access)

## Monitoring

### Health Check
```bash
curl http://157.10.73.52:3001/api/v1/health
# or via Nginx
curl http://157.10.73.52/api/v1/health
```

### View Logs
```bash
pm2 logs plp-backend
# or
pm2 logs plp-backend --lines 100
```

## Troubleshooting

### If deployment fails:
1. Check GitHub Actions logs
2. SSH into server and check PM2 logs
3. Verify Node.js version: `node --version`
4. Check if port 3001 is available: `sudo lsof -i :3001`

### Common Issues:
- **Port already in use**: Kill the process using the port
- **Permission denied**: Ensure scripts have execute permission
- **Module not found**: Run `npm install` in backend directory
- **PM2 not found**: Install globally with `sudo npm install -g pm2`

## Security Notes
- Keep your server password secure in GitHub Secrets
- Regularly update server packages
- Monitor server access logs
- Consider setting up SSL certificates for HTTPS