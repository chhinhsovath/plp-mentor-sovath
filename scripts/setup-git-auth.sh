#!/bin/bash

# Setup GitHub authentication with Personal Access Token

echo "Setting up GitHub authentication..."
echo ""
echo "First, create a Personal Access Token on GitHub:"
echo "1. Go to: https://github.com/settings/tokens"
echo "2. Generate new token (classic)"
echo "3. Select 'repo' scope"
echo "4. Copy the generated token"
echo ""
read -p "Enter your GitHub username: " GITHUB_USER
read -s -p "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
echo ""

# Update git remote to include credentials
git remote set-url origin https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/chhinhsovath/plp-mentor-sovath.git

echo "✅ Git authentication configured!"
echo ""
echo "Testing connection..."
git fetch origin

if [ $? -eq 0 ]; then
    echo "✅ Successfully connected to GitHub!"
    
    # Optionally save credentials
    read -p "Do you want to save credentials globally? (y/n): " SAVE_CREDS
    if [[ "$SAVE_CREDS" == "y" || "$SAVE_CREDS" == "Y" ]]; then
        git config --global credential.helper store
        echo "✅ Credentials will be saved after first use"
    fi
else
    echo "❌ Connection failed. Please check your token and try again."
fi