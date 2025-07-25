#!/bin/bash

# Deployment script that skips git push
# For use when GitHub authentication is not set up

SERVER_IP="157.10.73.52"
SERVER_USER="ubuntu"

echo "🚀 Deploying without Git push..."
echo "================================"

# Create deployment script
cat > /tmp/deploy-local.sh << 'DEPLOY'
#!/bin/bash

cd /var/csv/mentor_api/plp-mentor-sovath

# Try to pull latest (might fail if auth issues)
git pull origin main || echo "Could not pull latest changes"

# Deploy backend
echo "📦 Deploying backend..."
cd backend
npm install
npm run build
pm2 restart plp-backend || pm2 start dist/main.js --name plp-backend
pm2 save

# Deploy frontend
echo "📦 Deploying frontend..."
cd ../frontend
npm install
npm run build
sudo rm -rf /var/www/html/mentoring/*
sudo cp -r dist/* /var/www/html/mentoring/
sudo chown -R www-data:www-data /var/www/html/mentoring

echo "✅ Deployment complete!"
echo "🌐 Access at: https://mentoring.openplp.com"
DEPLOY

# Copy and run on server
scp /tmp/deploy-local.sh $SERVER_USER@$SERVER_IP:/tmp/
ssh $SERVER_USER@$SERVER_IP 'bash /tmp/deploy-local.sh'

rm /tmp/deploy-local.sh