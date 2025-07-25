#!/bin/bash

# Configure GitHub with Personal Access Token

echo "🔐 Configuring GitHub Authentication with PAT"
echo "==========================================="

# GitHub credentials
GITHUB_USER="chhinhsovath"
GITHUB_TOKEN="YOUR_GITHUB_PAT_HERE"  # Replace with your actual token

# Option 1: Configure git credential helper
echo "Setting up git credentials..."
git config --global credential.helper store
git config --global user.name "chhinhsovath"
git config --global user.email "your-email@example.com"  # Update with your email

# Create credentials file
echo "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials

# Option 2: Update the repository URL to include token
cd /var/csv/mentor_api/plp-mentor-sovath
git remote set-url origin https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/chhinhsovath/plp-mentor-sovath.git

echo "✅ GitHub authentication configured!"
echo ""
echo "Testing connection..."
git fetch
git pull origin main

echo ""
echo "✅ Configuration complete! You can now use git commands without password prompts."