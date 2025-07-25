#!/bin/bash

echo "Rebuilding frontend with production configuration..."

# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

echo "Build complete! The dist folder contains the production build."
echo ""
echo "Next steps:"
echo "1. Deploy the contents of frontend/dist to your web server"
echo "2. Ensure your backend is running at the URL specified in .env.production"
echo "3. Configure CORS on your backend to allow requests from https://mentoring.openplp.com"
echo ""
echo "To test locally before deploying:"
echo "npm run preview"