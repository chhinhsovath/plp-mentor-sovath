#!/bin/bash

# Fix git remote configuration on server
cd /var/csv/mentor_api/plp-mentor-sovath

echo "Current git remotes:"
git remote -v

echo ""
echo "Fixing git remote URL..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/chhinhsovath/plp-mentor-sovath.git

echo ""
echo "Updated git remotes:"
git remote -v

echo ""
echo "Testing git fetch..."
git fetch origin

echo "✅ Git remote fixed!"