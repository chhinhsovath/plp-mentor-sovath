# Step-by-Step Deployment Guide

Follow these steps to deploy your application to http://157.10.73.52/mentoring

## Step 1: Initial Server Setup (Run Once)

Open your terminal and run these commands:

```bash
# 1. Copy the setup script to your server
scp server-initial-setup.sh ubuntu@157.10.73.52:/tmp/
# Enter password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!

# 2. SSH into your server
ssh ubuntu@157.10.73.52
# Enter password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!

# 3. Run the setup script with sudo
sudo bash /tmp/server-initial-setup.sh

# 4. Exit from server
exit
```

## Step 2: Deploy the Application

After the initial setup is complete, from your local machine run:

```bash
# Make sure you're in the project directory
cd /Users/user/Desktop/apps/plp-mentor-sovath

# Run the deployment
./deploy-now.sh
```

When prompted for password, enter: `en_&xdX#!N(^OqCQzc3RE0B)m6ogU!`

## Step 3: Verify Deployment

Check if everything is working:

```bash
# Test backend health
curl http://157.10.73.52:3001/api/v1/health

# Test frontend
open http://157.10.73.52/mentoring
```

## If You Need to Run Commands Manually

### Option A: Copy and paste these commands

```bash
# 1. SSH into server
ssh ubuntu@157.10.73.52

# 2. Navigate to project
cd /var/csv/mentor_api/plp-mentor-sovath

# 3. Pull latest code
git pull origin main

# 4. Deploy backend
cd backend
npm install
npm run build
pm2 restart plp-backend || pm2 start dist/main.js --name plp-backend
pm2 save

# 5. Deploy frontend
cd ../frontend
npm install
npm run build
sudo rm -rf /var/www/html/mentoring/*
sudo cp -r dist/* /var/www/html/mentoring/
sudo chown -R www-data:www-data /var/www/html/mentoring

# 6. Exit
exit
```

### Option B: Use the automated script

From your local machine:
```bash
./auto-deploy.sh
```

## Troubleshooting

If you encounter issues:

1. **Permission Denied**: Make sure scripts are executable
   ```bash
   chmod +x deploy-now.sh auto-deploy.sh
   ```

2. **SSH Connection Failed**: Check your internet connection and server status

3. **Build Errors**: Check the error messages and ensure all dependencies are installed

4. **Site Not Loading**: Check Nginx status on server
   ```bash
   ssh ubuntu@157.10.73.52 'sudo systemctl status nginx'
   ```

## Quick Commands Reference

- Deploy: `./deploy-now.sh`
- Check logs: `ssh ubuntu@157.10.73.52 'pm2 logs plp-backend'`
- Restart backend: `ssh ubuntu@157.10.73.52 'pm2 restart plp-backend'`
- Check status: `ssh ubuntu@157.10.73.52 'pm2 status'`