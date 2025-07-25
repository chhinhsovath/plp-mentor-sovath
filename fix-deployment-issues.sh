#!/bin/bash

# Fix deployment issues on server

echo "🔧 Fixing deployment issues..."
echo "=============================="

# 1. Fix git user configuration
echo "📝 Setting git user configuration..."
git config --global user.email "chhinhsovath@gmail.com"  # Update with your email
git config --global user.name "chhinhsovath"

# 2. Fix permissions
echo "🔐 Fixing script permissions..."
chmod +x *.sh 2>/dev/null || sudo chmod +x *.sh

# 3. Fix git remote (remove and re-add cleanly)
echo "🔧 Fixing git remote..."
git remote remove origin 2>/dev/null || true

# Add remote correctly (ensure no newlines)
# Note: Use GitHub CLI or SSH for authentication instead of tokens in scripts
git remote add origin https://github.com/chhinhsovath/plp-mentor-sovath.git

echo "✅ Current git configuration:"
git config --list | grep user
echo ""
echo "✅ Current remotes:"
git remote -v

echo ""
echo "🧪 Testing git connection..."
git fetch origin

echo ""
echo "✅ All issues fixed! You can now run: ./deploy-now.sh"