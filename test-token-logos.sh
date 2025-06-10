#!/bin/bash

# Token Logo Test Script
# This script tests that all token logos are accessible from R2

set -e

echo "🧪 Testing BCTChain Token Logos"
echo "================================"

# Base URL for token images
BASE_URL="https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist"

# Token list URL
TOKEN_LIST_URL="https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json"

# Test token list accessibility
echo "📋 Testing token list accessibility..."
if curl -s --head "$TOKEN_LIST_URL" | head -n 1 | grep -q "200 OK"; then
    echo "✅ Token list accessible"
else
    echo "❌ Token list not accessible"
    exit 1
fi

# Get token count
TOKEN_COUNT=$(curl -s "$TOKEN_LIST_URL" | jq '.tokens | length')
echo "📊 Found $TOKEN_COUNT tokens in list"

# Test individual token logos
echo "🖼️  Testing token logo accessibility..."

LOGOS=("bct.png" "raj.png" "lisa.png" "weth.png" "usdg.png" "bctchain-logo.png")

for logo in "${LOGOS[@]}"; do
    url="$BASE_URL/$logo"
    echo -n "Testing $logo... "
    
    if curl -s --head "$url" | head -n 1 | grep -q "200 OK"; then
        # Get file size
        size=$(curl -s --head "$url" | grep -i content-length | cut -d' ' -f2 | tr -d '\r')
        echo "✅ ($size bytes)"
    else
        echo "❌ Not accessible"
    fi
done

echo ""
echo "🔍 Validating token list JSON structure..."

# Download and validate JSON
temp_file=$(mktemp)
curl -s "$TOKEN_LIST_URL" > "$temp_file"

if jq empty "$temp_file" 2>/dev/null; then
    echo "✅ Valid JSON structure"
    
    # Check required fields
    tokens_with_logos=$(jq '[.tokens[] | select(.logoURI != null)] | length' "$temp_file")
    total_tokens=$(jq '.tokens | length' "$temp_file")
    
    echo "📈 Tokens with logos: $tokens_with_logos/$total_tokens"
    
    # List all unique logo URLs
    echo "🔗 Logo URLs found:"
    jq -r '.tokens[].logoURI' "$temp_file" | sort | uniq | while read -r url; do
        echo "   - $url"
    done
    
else
    echo "❌ Invalid JSON structure"
    exit 1
fi

rm "$temp_file"

echo ""
echo "✨ Token logo test completed!"
echo ""
echo "📝 Next steps:"
echo "1. Start your development server: npm run dev"
echo "2. Navigate to /trade to test the UI"
echo "3. Verify logos display correctly in token selection"
