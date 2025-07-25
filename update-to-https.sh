#!/bin/bash

echo "🔒 Updating all references to use HTTPS endpoints"
echo "================================================"

# List of files to update
files=(
    "deploy-without-push.sh"
    "deploy-now.sh"
    "simple-deploy.sh"
    "quick-deploy.sh"
    "nginx-setup-commands.sh"
    "deploy-to-ip-server.sh"
    "deployment-guide.md"
    "http-deployment-guide.md"
    "VERCEL_DEPLOYMENT_GUIDE.md"
)

# Update each file
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Updating $file..."
        
        # Replace HTTP URLs with HTTPS
        sed -i.bak 's|http://157\.10\.73\.52:3001/api/v1|https://mentoring.openplp.com/api/v1|g' "$file"
        sed -i.bak 's|http://157\.10\.73\.52:3000/api/v1|https://mentoring.openplp.com/api/v1|g' "$file"
        sed -i.bak 's|http://157\.10\.73\.52/mentoring|https://mentoring.openplp.com|g' "$file"
        sed -i.bak 's|http://157\.10\.73\.52:3001|https://mentoring.openplp.com/api|g' "$file"
        sed -i.bak 's|http://157\.10\.73\.52:3000|https://mentoring.openplp.com/api|g' "$file"
        sed -i.bak 's|http://157\.10\.73\.52|https://mentoring.openplp.com|g' "$file"
        
        # Clean up backup files
        rm -f "${file}.bak"
    fi
done

echo ""
echo "✅ All files updated to use HTTPS endpoints"
echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "1. The backend server MUST be configured with HTTPS"
echo "2. Update your backend server's nginx configuration"
echo "3. Install SSL certificates (use Let's Encrypt)"
echo "4. Update CORS settings to accept HTTPS origins only"
echo ""
echo "See HTTPS_SETUP_GUIDE.md for detailed instructions"