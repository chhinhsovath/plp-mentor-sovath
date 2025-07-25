#!/bin/bash

echo "🔧 Fixing MIME Type Issues for PLP Mentoring Platform"
echo "====================================================="

# Check if we're on the server
if [[ "$HOSTNAME" == *"mentoring.openplp.com"* ]] || [[ "$1" == "--server" ]]; then
    echo "Running on server..."
    
    # 1. Update nginx mime.types if needed
    echo "1. Checking nginx MIME types configuration..."
    if ! grep -q "application/javascript.*js" /etc/nginx/mime.types; then
        echo "   Adding JavaScript MIME type mapping..."
        sudo sed -i '/types {/a\    application/javascript js mjs;' /etc/nginx/mime.types
    fi
    
    # 2. Update nginx site configuration
    echo "2. Updating nginx site configuration..."
    sudo cp nginx-fixed.conf /etc/nginx/sites-available/mentoring.openplp.com
    
    # 3. Test nginx configuration
    echo "3. Testing nginx configuration..."
    sudo nginx -t
    
    # 4. Reload nginx
    echo "4. Reloading nginx..."
    sudo systemctl reload nginx
    
    echo "✅ Server configuration updated!"
else
    echo "Running locally..."
    
    # 1. Rebuild frontend with proper configuration
    echo "1. Rebuilding frontend..."
    cd frontend
    npm run build
    cd ..
    
    # 2. Check build output
    echo "2. Checking build output..."
    if [ -f "frontend/dist/index.html" ]; then
        echo "   ✅ index.html exists"
        
        # Check if JavaScript files are referenced properly
        if grep -q 'type="module"' frontend/dist/index.html; then
            echo "   ✅ JavaScript modules are properly referenced"
        else
            echo "   ⚠️  Warning: JavaScript modules might not be properly referenced"
        fi
    else
        echo "   ❌ index.html not found in dist folder!"
    fi
    
    # 3. Create deployment instructions
    echo ""
    echo "3. Deployment Instructions:"
    echo "   a) Deploy using Vercel:"
    echo "      vercel --prod"
    echo ""
    echo "   b) Deploy to custom server:"
    echo "      1. Copy nginx-fixed.conf to /etc/nginx/sites-available/mentoring.openplp.com"
    echo "      2. Run: sudo nginx -t && sudo systemctl reload nginx"
    echo "      3. Deploy frontend files to /var/www/plp-mentoring/dist"
    echo ""
    echo "   c) Quick fix for current deployment:"
    echo "      ssh user@mentoring.openplp.com"
    echo "      cd /path/to/project"
    echo "      ./fix-deployment-mime-types.sh --server"
fi

echo ""
echo "🔍 Testing the deployment:"
echo "   curl -I https://mentoring.openplp.com/assets/index-*.js"
echo "   Should return: Content-Type: application/javascript"
echo ""
echo "Done!"