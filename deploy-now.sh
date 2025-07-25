#!/bin/bash

# Quick deployment script - One command to deploy everything!
# Usage: ./deploy-now.sh

echo "🚀 PLP Mentoring Platform - Quick Deploy"
echo "========================================"
echo "This will deploy to: https://mentoring.openplp.com"
echo ""

# Check if auto-deploy.sh exists
if [ ! -f "auto-deploy.sh" ]; then
    echo "❌ Error: auto-deploy.sh not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Make sure it's executable
chmod +x auto-deploy.sh

# Run the auto deployment
./auto-deploy.sh

echo ""
echo "🎉 Deployment initiated!"
echo "Check the output above for any errors."