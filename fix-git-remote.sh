#!/bin/bash

# Fix git remote configuration

cd /var/csv/mentor_api/plp-mentor-sovath

# Remove any broken remotes
git remote remove origin 2>/dev/null || true

# Add correct remote
# Replace YOUR_PAT with your actual Personal Access Token
git remote add origin "https://chhinhsovath:YOUR_PAT@github.com/chhinhsovath/plp-mentor-sovath.git"

echo "✅ Remote fixed!"
echo "Current remotes:"
git remote -v

echo ""
echo "Testing connection..."
git fetch origin
git pull origin main

echo "✅ Git configuration complete!"