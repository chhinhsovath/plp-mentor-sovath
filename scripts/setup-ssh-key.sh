#!/bin/bash

# Setup SSH key for passwordless authentication

echo "Setting up SSH key authentication for server deployment"
echo "======================================================"

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "Generating new SSH key..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
fi

echo ""
echo "Your public key:"
echo "================"
cat ~/.ssh/id_rsa.pub
echo ""
echo "================"
echo ""
echo "To enable passwordless SSH:"
echo "1. SSH into your server: ssh ubuntu@157.10.73.52"
echo "2. Add the above public key to ~/.ssh/authorized_keys"
echo ""
echo "Or run this command (you'll need to enter your password):"
echo "ssh-copy-id ubuntu@157.10.73.52"