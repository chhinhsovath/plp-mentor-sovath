#!/bin/bash

# Script to fix GitHub authentication on server

echo "🔧 Fixing GitHub Authentication"
echo "=============================="

# Option 1: Configure git to use token
setup_token_auth() {
    echo "Setting up token authentication..."
    
    # Store credentials (you'll need to enter them once)
    git config --global credential.helper store
    
    echo "Now try pulling/pushing again. When prompted:"
    echo "Username: chhinhsovath"
    echo "Password: [Your Personal Access Token]"
    echo ""
    echo "To create a token, visit: https://github.com/settings/tokens"
}

# Option 2: Switch to SSH
setup_ssh_auth() {
    echo "Switching to SSH authentication..."
    
    # Change remote URL from HTTPS to SSH
    cd /var/csv/mentor_api/plp-mentor-sovath
    git remote set-url origin git@github.com:chhinhsovath/plp-mentor-sovath.git
    
    echo "✅ Switched to SSH URL"
    echo ""
    echo "Now you need to:"
    echo "1. Generate SSH key: ssh-keygen -t ed25519 -C 'your-email@example.com'"
    echo "2. Add to GitHub: cat ~/.ssh/id_ed25519.pub"
    echo "3. Copy and add to: https://github.com/settings/keys"
}

# Option 3: Use HTTPS with stored token
setup_stored_token() {
    echo "Setting up stored token..."
    
    # Create a .netrc file for automatic authentication
    cat > ~/.netrc << EOF
machine github.com
login chhinhsovath
password YOUR_PERSONAL_ACCESS_TOKEN_HERE
EOF
    
    chmod 600 ~/.netrc
    
    echo "✅ Created .netrc file"
    echo "⚠️  Edit ~/.netrc and replace YOUR_PERSONAL_ACCESS_TOKEN_HERE with your actual token"
}

# Menu
echo "Choose authentication method:"
echo "1. Configure for Personal Access Token (manual entry)"
echo "2. Switch to SSH authentication"
echo "3. Store token in .netrc file"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1) setup_token_auth ;;
    2) setup_ssh_auth ;;
    3) setup_stored_token ;;
    *) echo "Invalid choice" ;;
esac

echo ""
echo "Done! Try running the deployment again."