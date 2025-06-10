#!/bin/bash

# S3-Compatible R2 Upload Script
# Alternative to Wrangler CLI using AWS S3 CLI or curl

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 S3-Compatible R2 Upload Tool${NC}"
echo "=================================="

# Configuration
TOKEN_LIST_FILE="public/bctchain-token-list.json"
R2_BUCKET="bct-landing-tokenlist"
R2_ENDPOINT="https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://pub-65a77754903f4bddb48f3852b3967938.r2.dev"

# Check if token list file exists
if [ ! -f "$TOKEN_LIST_FILE" ]; then
    echo -e "${RED}❌ Token list file not found: $TOKEN_LIST_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token list file found${NC}"
echo "📊 File size: $(wc -c < "$TOKEN_LIST_FILE") bytes"
echo "📝 Tokens: $(jq '.tokens | length' "$TOKEN_LIST_FILE")"

echo ""
echo -e "${BLUE}📋 Upload Method Options:${NC}"
echo ""
echo "1. AWS CLI (S3-compatible)"
echo "2. curl with S3 API"
echo "3. Python boto3 script"
echo "4. Manual upload instructions"
echo "5. Exit"
echo ""

read -p "Choose upload method (1-5): " choice

case $choice in
    1)
        echo -e "${YELLOW}Using AWS CLI (S3-compatible mode)${NC}"
        
        # Check if AWS CLI is installed
        if ! command -v aws &> /dev/null; then
            echo -e "${RED}❌ AWS CLI not installed${NC}"
            echo "Install with: brew install awscli"
            echo "Or: pip install awscli"
            exit 1
        fi
        
        echo "🔐 AWS CLI S3-compatible configuration needed:"
        echo ""
        echo "Run these commands with your Cloudflare R2 credentials:"
        echo ""
        echo -e "${YELLOW}aws configure set aws_access_key_id YOUR_R2_ACCESS_KEY${NC}"
        echo -e "${YELLOW}aws configure set aws_secret_access_key YOUR_R2_SECRET_KEY${NC}"
        echo -e "${YELLOW}aws configure set region auto${NC}"
        echo ""
        echo "Then upload with:"
        echo -e "${GREEN}aws s3 cp $TOKEN_LIST_FILE s3://$R2_BUCKET/bctchain-token-list.json \\${NC}"
        echo -e "${GREEN}  --endpoint-url $R2_ENDPOINT \\${NC}"
        echo -e "${GREEN}  --content-type application/json \\${NC}"
        echo -e "${GREEN}  --cache-control \"public, max-age=300\"${NC}"
        ;;
        
    2)
        echo -e "${YELLOW}Using curl with S3 API${NC}"
        echo ""
        echo "🔐 You'll need your Cloudflare R2 credentials:"
        echo "- Access Key ID"
        echo "- Secret Access Key"
        echo ""
        
        # Generate upload script
        cat > "upload-with-curl.sh" << 'EOF'
#!/bin/bash

# Cloudflare R2 Upload with curl (S3 API)
# Set your credentials here:
ACCESS_KEY="YOUR_ACCESS_KEY_HERE"
SECRET_KEY="YOUR_SECRET_KEY_HERE"
BUCKET="bct-landing-tokenlist"
OBJECT="bctchain-token-list.json"
FILE="public/bctchain-token-list.json"
ENDPOINT="https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com"

# Generate timestamp and signature
DATE=$(date -u +"%Y%m%dT%H%M%SZ")
DATE_STAMP=$(date -u +"%Y%m%d")
REGION="auto"
SERVICE="s3"

# Create canonical request
CANONICAL_URI="/${OBJECT}"
CANONICAL_QUERY=""
CANONICAL_HEADERS="host:$(echo $ENDPOINT | sed 's|https://||')\nx-amz-date:${DATE}\n"
SIGNED_HEADERS="host;x-amz-date"

# Calculate content hash
CONTENT_HASH=$(openssl dgst -sha256 -binary "$FILE" | xxd -p -c 256)

CANONICAL_REQUEST="PUT\n${CANONICAL_URI}\n${CANONICAL_QUERY}\n${CANONICAL_HEADERS}\n${SIGNED_HEADERS}\n${CONTENT_HASH}"

# Create string to sign
ALGORITHM="AWS4-HMAC-SHA256"
CREDENTIAL_SCOPE="${DATE_STAMP}/${REGION}/${SERVICE}/aws4_request"
STRING_TO_SIGN="${ALGORITHM}\n${DATE}\n${CREDENTIAL_SCOPE}\n$(echo -n "$CANONICAL_REQUEST" | openssl dgst -sha256 -binary | xxd -p -c 256)"

# Calculate signature
DATE_KEY=$(echo -n "$DATE_STAMP" | openssl dgst -sha256 -hmac "AWS4${SECRET_KEY}" -binary)
DATE_REGION_KEY=$(echo -n "$REGION" | openssl dgst -sha256 -hmac "$DATE_KEY" -binary)
DATE_REGION_SERVICE_KEY=$(echo -n "$SERVICE" | openssl dgst -sha256 -hmac "$DATE_REGION_KEY" -binary)
SIGNING_KEY=$(echo -n "aws4_request" | openssl dgst -sha256 -hmac "$DATE_REGION_SERVICE_KEY" -binary)
SIGNATURE=$(echo -n "$STRING_TO_SIGN" | openssl dgst -sha256 -hmac "$SIGNING_KEY" -binary | xxd -p -c 256)

# Create authorization header
AUTHORIZATION="${ALGORITHM} Credential=${ACCESS_KEY}/${CREDENTIAL_SCOPE}, SignedHeaders=${SIGNED_HEADERS}, Signature=${SIGNATURE}"

# Upload file
curl -X PUT "${ENDPOINT}/${OBJECT}" \
  -H "Authorization: ${AUTHORIZATION}" \
  -H "X-Amz-Date: ${DATE}" \
  -H "Content-Type: application/json" \
  -H "Cache-Control: public, max-age=300" \
  --data-binary "@${FILE}"

echo "Upload completed!"
EOF

        chmod +x upload-with-curl.sh
        echo -e "${GREEN}✅ Created upload-with-curl.sh${NC}"
        echo "📝 Edit the script to add your R2 credentials"
        echo "🚀 Then run: ./upload-with-curl.sh"
        ;;
        
    3)
        echo -e "${YELLOW}Creating Python boto3 upload script${NC}"
        
        # Generate Python script
        cat > "upload-r2.py" << 'EOF'
#!/usr/bin/env python3

import boto3
import json
from botocore.config import Config

# Cloudflare R2 Configuration
# Get these from Cloudflare Dashboard > R2 > Manage R2 API tokens
R2_ACCESS_KEY = "YOUR_ACCESS_KEY_HERE"
R2_SECRET_KEY = "YOUR_SECRET_KEY_HERE"
R2_ENDPOINT = "https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com"
R2_BUCKET = "bct-landing-tokenlist"

def upload_token_list():
    print("🚀 Uploading token list to Cloudflare R2...")
    
    # Configure S3 client for R2
    config = Config(
        region_name='auto',
        retries={'max_attempts': 3, 'mode': 'adaptive'}
    )
    
    s3_client = boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=config
    )
    
    try:
        # Upload token list JSON
        with open('public/bctchain-token-list.json', 'rb') as f:
            s3_client.upload_fileobj(
                f,
                R2_BUCKET,
                'bctchain-token-list.json',
                ExtraArgs={
                    'ContentType': 'application/json',
                    'CacheControl': 'public, max-age=300'
                }
            )
        
        print("✅ Token list uploaded successfully!")
        print(f"🔗 Available at: https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json")
        
        # Verify upload
        try:
            response = s3_client.head_object(Bucket=R2_BUCKET, Key='bctchain-token-list.json')
            print(f"📊 File size: {response['ContentLength']} bytes")
            print(f"📅 Last modified: {response['LastModified']}")
        except Exception as e:
            print(f"⚠️  Could not verify upload: {e}")
            
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return False
    
    return True

def upload_logos():
    """Upload logo files if they exist"""
    import os
    
    logo_dir = "logos"
    if not os.path.exists(logo_dir):
        print(f"📂 Logo directory '{logo_dir}' not found, skipping logo upload")
        return
    
    print("🖼️  Uploading logo files...")
    
    config = Config(region_name='auto', retries={'max_attempts': 3, 'mode': 'adaptive'})
    s3_client = boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=config
    )
    
    logo_files = ['bct.png', 'raj.png', 'lisa.png', 'weth.png', 'usdg.png', 'bctchain-logo.png']
    
    for logo_file in logo_files:
        logo_path = os.path.join(logo_dir, logo_file)
        if os.path.exists(logo_path):
            try:
                with open(logo_path, 'rb') as f:
                    s3_client.upload_fileobj(
                        f,
                        R2_BUCKET,
                        logo_file,
                        ExtraArgs={
                            'ContentType': 'image/png',
                            'CacheControl': 'public, max-age=86400'
                        }
                    )
                print(f"✅ Uploaded {logo_file}")
            except Exception as e:
                print(f"❌ Failed to upload {logo_file}: {e}")
        else:
            print(f"⚠️  {logo_file} not found in {logo_dir}")

if __name__ == "__main__":
    print("🔐 Make sure to set your R2 credentials in this script!")
    print("📝 Edit R2_ACCESS_KEY and R2_SECRET_KEY variables")
    print("")
    
    if R2_ACCESS_KEY == "YOUR_ACCESS_KEY_HERE":
        print("❌ Please set your R2 credentials first!")
        exit(1)
    
    # Upload token list
    if upload_token_list():
        # Upload logos if available
        upload_logos()
        print("🎉 Upload process completed!")
    else:
        print("❌ Upload failed!")
        exit(1)
EOF

        chmod +x upload-r2.py
        echo -e "${GREEN}✅ Created upload-r2.py${NC}"
        echo "📦 Install dependencies: pip install boto3"
        echo "📝 Edit the script to add your R2 credentials"
        echo "🚀 Then run: python3 upload-r2.py"
        ;;
        
    4)
        echo -e "${YELLOW}Manual Upload Instructions${NC}"
        echo ""
        echo "🌐 Option A: Cloudflare Dashboard"
        echo "1. Go to https://dash.cloudflare.com/"
        echo "2. Navigate to R2 Object Storage"
        echo "3. Select bucket: bct-landing-tokenlist"
        echo "4. Click 'Upload'"
        echo "5. Upload: public/bctchain-token-list.json"
        echo "6. Set object name: bctchain-token-list.json"
        echo "7. Set Content-Type: application/json"
        echo ""
        echo "🔧 Option B: Get R2 API Credentials"
        echo "1. Go to Cloudflare Dashboard > R2"
        echo "2. Click 'Manage R2 API tokens'"
        echo "3. Create token with R2:Edit permissions"
        echo "4. Use credentials with any S3-compatible tool"
        echo ""
        echo "🔗 Public URL after upload:"
        echo "$R2_PUBLIC_URL/bctchain-token-list.json"
        ;;
        
    5)
        echo -e "${GREEN}👋 Goodbye!${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}💡 After successful upload, test with:${NC}"
echo "curl -I \"$R2_PUBLIC_URL/bctchain-token-list.json\""
