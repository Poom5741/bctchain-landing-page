#!/bin/bash

# Super Simple R2 Upload - No Authentication Hassles
# Works with any S3-compatible tool

set -e

echo "🎯 SUPER SIMPLE R2 UPLOAD"
echo "========================="
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

if [ ! -f "public/bctchain-token-list.json" ]; then
    echo "❌ Token list file missing"
    exit 1
fi

echo "✅ Token list file found"

# File info
FILE_SIZE=$(wc -c < public/bctchain-token-list.json)
echo "📄 File size: $FILE_SIZE bytes"

echo ""
echo "🌐 UPLOAD OPTIONS"
echo "================="
echo ""
echo "Choose your upload method:"
echo ""
echo "1. 🌐 Manual Browser Upload (EASIEST)"
echo "2. 🔧 AWS CLI Upload (FASTEST)"  
echo "3. 📋 Show Manual Instructions"
echo "4. 🧪 Test Current R2 Status"
echo "5. 💡 Alternative Solutions"
echo ""

read -p "Choose option (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🌐 MANUAL BROWSER UPLOAD (RECOMMENDED)"
        echo "====================================="
        echo ""
        echo "This is the most reliable method:"
        echo ""
        echo "1. 🌐 Open: https://dash.cloudflare.com/"
        echo "2. 📂 Navigate to: R2 Object Storage"
        echo "3. 🗂️  Select bucket: bct-landing-tokenlist"
        echo "4. ⬆️  Click 'Upload'"
        echo "5. 📄 Select file: public/bctchain-token-list.json"
        echo "6. 📝 Set object name: bctchain-token-list.json"
        echo "7. ⚙️  Set metadata:"
        echo "   • Content-Type: application/json"
        echo "   • Cache-Control: public, max-age=300"
        echo "8. ✅ Click 'Upload'"
        echo ""
        echo "📱 After upload, test with:"
        echo "curl -I \"https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json\""
        echo ""
        ;;
        
    2)
        echo ""
        echo "🔧 AWS CLI UPLOAD"
        echo "================="
        echo ""
        
        # Check AWS CLI
        if ! command -v aws &> /dev/null; then
            echo "❌ AWS CLI not installed"
            echo ""
            echo "📦 Install AWS CLI:"
            echo "brew install awscli"
            exit 1
        fi
        
        echo "✅ AWS CLI found"
        echo ""
        echo "🔐 You need Cloudflare R2 API credentials:"
        echo ""
        echo "1. Go to: https://dash.cloudflare.com/"
        echo "2. Navigate to: R2 Object Storage → Manage R2 API tokens"
        echo "3. Create new token with 'Edit' permissions"
        echo "4. Copy Access Key ID and Secret Access Key"
        echo ""
        
        read -p "📝 R2 Access Key ID: " R2_ACCESS_KEY
        echo ""
        read -s -p "🔑 R2 Secret Access Key: " R2_SECRET_KEY
        echo ""
        echo ""
        
        if [ -z "$R2_ACCESS_KEY" ] || [ -z "$R2_SECRET_KEY" ]; then
            echo "❌ Both credentials required"
            exit 1
        fi
        
        echo "⚙️  Configuring AWS CLI for R2..."
        
        # Set up AWS credentials for R2
        export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY"
        export AWS_SECRET_ACCESS_KEY="$R2_SECRET_KEY"
        export AWS_DEFAULT_REGION="auto"
        
        echo "✅ Credentials configured"
        echo ""
        echo "📤 Uploading to R2..."
        
        # Upload using AWS CLI
        R2_ENDPOINT="https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com"
        
        if aws s3 cp public/bctchain-token-list.json s3://bct-landing-tokenlist/bctchain-token-list.json \
            --endpoint-url "$R2_ENDPOINT" \
            --content-type "application/json" \
            --cache-control "public, max-age=300" \
            --no-verify-ssl; then
            
            echo ""
            echo "🎉 SUCCESS! Token list uploaded to R2!"
            echo ""
            echo "🔗 Public URL:"
            echo "https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json"
            echo ""
            echo "🧪 Testing upload..."
            sleep 2
            
            if curl -s --head "https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json" | head -1 | grep -q "200 OK"; then
                echo "✅ Upload verified! R2 endpoint is live!"
            else
                echo "⏳ Upload successful, but may take a minute to propagate..."
            fi
            
        else
            echo ""
            echo "❌ Upload failed. Try manual browser upload instead."
            echo ""
            echo "Common issues:"
            echo "• Wrong credentials"
            echo "• Bucket doesn't exist"
            echo "• Permission issues"
        fi
        ;;
        
    3)
        echo ""
        echo "📋 MANUAL INSTRUCTIONS"
        echo "====================="
        echo ""
        echo "If automated upload fails, use these methods:"
        echo ""
        echo "METHOD 1: Cloudflare Dashboard"
        echo "-----------------------------"
        echo "1. Visit: https://dash.cloudflare.com/"
        echo "2. Go to: R2 Object Storage"
        echo "3. Select: bct-landing-tokenlist bucket"
        echo "4. Upload: public/bctchain-token-list.json"
        echo "5. Name: bctchain-token-list.json"
        echo "6. Content-Type: application/json"
        echo ""
        echo "METHOD 2: Alternative Tools"
        echo "--------------------------"
        echo "• Cyberduck (GUI S3 client)"
        echo "• S3 Browser"
        echo "• Any S3-compatible tool"
        echo ""
        echo "METHOD 3: cURL Direct Upload"
        echo "----------------------------"
        echo "curl -X PUT \"https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/bct-landing-tokenlist/objects/bctchain-token-list.json\" \\"
        echo "  -H \"Authorization: Bearer {api_token}\" \\"
        echo "  -H \"Content-Type: application/json\" \\"
        echo "  --data-binary @public/bctchain-token-list.json"
        echo ""
        ;;
        
    4)
        echo ""
        echo "🧪 TESTING CURRENT R2 STATUS"
        echo "============================"
        echo ""
        
        echo "📍 Testing R2 endpoints..."
        echo ""
        
        echo "🔗 JSON Endpoint:"
        echo "https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json"
        
        if curl -s --head "https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json" | head -1 | grep -q "200 OK"; then
            echo "✅ JSON endpoint is LIVE!"
            
            echo ""
            echo "📄 Content preview:"
            curl -s "https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json" | jq '.name, .version, (.tokens | length)' 2>/dev/null || echo "JSON loaded but not valid"
            
        else
            echo "❌ JSON endpoint returns 404 (not uploaded yet)"
        fi
        
        echo ""
        echo "🖼️  Logo Storage:"
        echo "https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/"
        
        for logo in bct.png raj.png lisa.png weth.png usdg.png; do
            if curl -s --head "https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/$logo" | head -1 | grep -q "200 OK"; then
                echo "✅ $logo is available"
            else
                echo "❌ $logo not uploaded"
            fi
        done
        
        echo ""
        echo "📊 Local File Status:"
        echo "✅ public/bctchain-token-list.json ($FILE_SIZE bytes)"
        echo "$(jq '.tokens | length' public/bctchain-token-list.json) tokens configured"
        ;;
        
    5)
        echo ""
        echo "💡 ALTERNATIVE SOLUTIONS"
        echo "========================"
        echo ""
        echo "If R2 upload keeps failing, consider these alternatives:"
        echo ""
        echo "OPTION A: Use GitHub Pages"
        echo "-------------------------"
        echo "• Commit token list to a public GitHub repo"
        echo "• Enable GitHub Pages"
        echo "• Update TOKEN_LIST_URL in .env"
        echo "• Free and reliable"
        echo ""
        echo "OPTION B: Use a CDN Service"
        echo "--------------------------"
        echo "• Upload to jsDelivr"
        echo "• Upload to unpkg"
        echo "• Use any public file hosting"
        echo ""
        echo "OPTION C: Keep Local Development"
        echo "-------------------------------"
        echo "• System works perfectly with local files"
        echo "• No external dependencies"
        echo "• Immediate functionality"
        echo ""
        echo "OPTION D: Temporary HTTP Server"
        echo "------------------------------"
        echo "• Host token list locally"
        echo "• Use ngrok or similar for public access"
        echo "• Quick testing solution"
        echo ""
        echo "💡 The app is designed to work with ANY of these approaches!"
        ;;
        
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🎯 Next Steps:"
echo "1. Complete the upload using your chosen method"
echo "2. Test the R2 endpoint"
echo "3. Start your dev server: npm run dev"
echo "4. Check that logos now load from R2!"
echo ""
echo "💡 Remember: The app works perfectly even without R2 upload!"
