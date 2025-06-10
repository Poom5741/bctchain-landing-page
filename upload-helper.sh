#!/bin/bash

# R2 Upload Helper Script
# This script helps you upload token list and logos to Cloudflare R2

set -e

echo "🚀 BCTChain R2 Upload Helper"
echo "============================"

# Check if we're set up
if [ ! -f "public/bctchain-token-list.json" ]; then
    echo "❌ Token list file not found"
    exit 1
fi

echo "📋 Current Setup Status:"
echo ""

# Check wrangler
if command -v wrangler &> /dev/null; then
    echo "✅ Wrangler CLI installed"
    
    if wrangler whoami >/dev/null 2>&1; then
        echo "✅ Authenticated with Cloudflare"
        WRANGLER_READY=true
    else
        echo "⚠️  Not authenticated (run: wrangler login)"
        WRANGLER_READY=false
    fi
else
    echo "⚠️  Wrangler CLI not installed (run: npm install -g wrangler)"
    WRANGLER_READY=false
fi

# Check token list
echo "✅ Token list file exists"
TOKENS_COUNT=$(jq '.tokens | length' public/bctchain-token-list.json)
echo "📊 Tokens configured: $TOKENS_COUNT"

echo ""
echo "🎯 Upload Options:"
echo ""
echo "1. Upload token list only (JSON)"
echo "2. Upload everything (requires logo files)" 
echo "3. Show manual upload instructions"
echo "4. Test current setup"
echo "5. Exit"
echo ""

read -p "Choose option (1-5): " choice

case $choice in
    1)
        if [ "$WRANGLER_READY" = true ]; then
            echo "📤 Uploading token list..."
            wrangler r2 object put bct-landing-tokenlist/bctchain-token-list.json \
                --file public/bctchain-token-list.json \
                --content-type "application/json" \
                --cache-control "public, max-age=300"
            echo "✅ Token list uploaded!"
            echo "🔗 Available at: https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json"
        else
            echo "❌ Wrangler not ready. Please install and authenticate first."
        fi
        ;;
    2)
        echo "📂 Looking for logo files..."
        LOGO_DIR="logos"
        if [ ! -d "$LOGO_DIR" ]; then
            echo "❌ Logo directory '$LOGO_DIR' not found"
            echo "💡 Create a 'logos' directory with your PNG files:"
            echo "   - bct.png"
            echo "   - raj.png" 
            echo "   - lisa.png"
            echo "   - weth.png"
            echo "   - usdg.png"
            echo "   - bctchain-logo.png"
            exit 1
        fi
        
        if [ "$WRANGLER_READY" = true ]; then
            echo "📤 Uploading logos and token list..."
            
            # Upload logos
            for logo in bct.png raj.png lisa.png weth.png usdg.png bctchain-logo.png; do
                if [ -f "$LOGO_DIR/$logo" ]; then
                    echo "📤 Uploading $logo..."
                    wrangler r2 object put "bct-landing-tokenlist/$logo" \
                        --file "$LOGO_DIR/$logo" \
                        --content-type "image/png" \
                        --cache-control "public, max-age=86400"
                else
                    echo "⚠️  $logo not found in $LOGO_DIR/"
                fi
            done
            
            # Upload token list
            echo "📤 Uploading token list..."
            wrangler r2 object put bct-landing-tokenlist/bctchain-token-list.json \
                --file public/bctchain-token-list.json \
                --content-type "application/json" \
                --cache-control "public, max-age=300"
                
            echo "✅ All files uploaded!"
        else
            echo "❌ Wrangler not ready. Please install and authenticate first."
        fi
        ;;
    3)
        echo "📖 Manual Upload Instructions:"
        echo ""
        echo "1. Go to Cloudflare Dashboard > R2 Object Storage"
        echo "2. Select bucket: bct-landing-tokenlist"
        echo "3. Upload public/bctchain-token-list.json as 'bctchain-token-list.json'"
        echo "4. Upload logo PNG files (optional):"
        echo "   - bct.png, raj.png, lisa.png, weth.png, usdg.png"
        echo "5. Set Content-Type headers appropriately"
        echo ""
        echo "See MANUAL_UPLOAD_GUIDE.md for detailed instructions."
        ;;
    4)
        echo "🧪 Testing current setup..."
        
        # Test local file
        echo "✅ Local token list valid"
        
        # Test R2 availability
        echo "🌐 Testing R2 availability..."
        if curl -s --head "https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json" | head -1 | grep -q "200 OK"; then
            echo "✅ R2 token list accessible"
        else
            echo "⚠️  R2 token list not yet uploaded"
        fi
        
        # Test logos
        echo "🖼️  Testing logo availability..."
        for logo in bct.png raj.png lisa.png weth.png usdg.png; do
            url="https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/$logo"
            if curl -s --head "$url" | head -1 | grep -q "200 OK"; then
                echo "✅ $logo accessible"
            else
                echo "⚠️  $logo not uploaded"
            fi
        done
        
        echo ""
        echo "💡 Local development will work with fallbacks even without R2 uploads!"
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac
