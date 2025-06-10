#!/bin/bash

# Quick AWS CLI Upload for Cloudflare R2
# Bypass Wrangler authentication issues

set -e

echo "🚀 Quick R2 Upload via AWS CLI"
echo "=============================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed"
    echo ""
    echo "📦 Install options:"
    echo "macOS: brew install awscli"
    echo "pip:   pip install awscli"
    echo "Other: https://aws.amazon.com/cli/"
    exit 1
fi

echo "✅ AWS CLI found"

# Check if token list exists
if [ ! -f "public/bctchain-token-list.json" ]; then
    echo "❌ Token list file not found: public/bctchain-token-list.json"
    exit 1
fi

echo "✅ Token list file found"

# Configuration
R2_BUCKET="bct-landing-tokenlist"
R2_ENDPOINT="https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com"
TOKEN_FILE="public/bctchain-token-list.json"

echo ""
echo "🔐 R2 Credentials Setup"
echo "======================"
echo ""
echo "You need Cloudflare R2 API credentials:"
echo "1. Go to: https://dash.cloudflare.com/"
echo "2. Navigate to: R2 Object Storage → Manage R2 API tokens"
echo "3. Create token with 'Edit' permissions for R2"
echo "4. Copy the Access Key ID and Secret Access Key"
echo ""

# Prompt for credentials
read -p "📝 Enter R2 Access Key ID: " ACCESS_KEY
read -s -p "🔑 Enter R2 Secret Access Key: " SECRET_KEY
echo ""

if [ -z "$ACCESS_KEY" ] || [ -z "$SECRET_KEY" ]; then
    echo "❌ Credentials required"
    exit 1
fi

echo ""
echo "⚙️  Configuring AWS CLI for R2..."

# Configure AWS CLI for R2
aws configure set aws_access_key_id "$ACCESS_KEY"
aws configure set aws_secret_access_key "$SECRET_KEY"
aws configure set region auto

echo "✅ AWS CLI configured"

echo ""
echo "📤 Uploading token list to R2..."

# Upload token list
if aws s3 cp "$TOKEN_FILE" "s3://$R2_BUCKET/bctchain-token-list.json" \
    --endpoint-url "$R2_ENDPOINT" \
    --content-type "application/json" \
    --cache-control "public, max-age=300"; then
    
    echo "✅ Token list uploaded successfully!"
    echo ""
    echo "🔗 Public URL:"
    echo "https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json"
    echo ""
    echo "🧪 Test the upload:"
    echo "curl -I \"https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json\""
    
else
    echo "❌ Upload failed"
    exit 1
fi

# Optional: Upload logos if directory exists
if [ -d "logos" ]; then
    echo ""
    echo "📂 Logo directory found. Upload logos too? (y/N)"
    read -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🖼️  Uploading logo files..."
        
        for logo in logos/*.png; do
            if [ -f "$logo" ]; then
                filename=$(basename "$logo")
                echo "📤 Uploading $filename..."
                
                aws s3 cp "$logo" "s3://$R2_BUCKET/$filename" \
                    --endpoint-url "$R2_ENDPOINT" \
                    --content-type "image/png" \
                    --cache-control "public, max-age=86400"
            fi
        done
        
        echo "✅ Logo upload completed!"
    fi
fi

echo ""
echo "🎉 R2 Upload Process Complete!"
echo ""
echo "💡 Your app will now use R2 images instead of fallback badges!"
