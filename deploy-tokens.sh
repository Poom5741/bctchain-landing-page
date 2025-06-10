#!/bin/bash

# BCTChain Token List Deployment Script for Cloudflare R2
# This script uploads the token list to Cloudflare R2 for production use

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TOKEN_LIST_FILE="public/bctchain-token-list.json"
R2_BUCKET_NAME="bct-landing-tokenlist"
R2_OBJECT_NAME="bctchain-token-list.json"
R2_PUBLIC_URL="https://pub-65a77754903f4bddb48f3852b3967938.r2.dev"

echo -e "${BLUE}BCTChain Token List Deployment to Cloudflare R2${NC}"
echo "================================================="

# Check if token list file exists
if [ ! -f "$TOKEN_LIST_FILE" ]; then
    echo -e "${RED}Error: Token list file not found at $TOKEN_LIST_FILE${NC}"
    exit 1
fi

# Validate JSON format
echo -e "${YELLOW}Validating token list JSON format...${NC}"
if ! jq empty "$TOKEN_LIST_FILE" >/dev/null 2>&1; then
    echo -e "${RED}Error: Invalid JSON format in $TOKEN_LIST_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Token list JSON is valid${NC}"

# Display token list info
TOKENS_COUNT=$(jq '.tokens | length' "$TOKEN_LIST_FILE")
VERSION=$(jq -r '.version | "\(.major).\(.minor).\(.patch)"' "$TOKEN_LIST_FILE")
echo -e "${BLUE}Token List Info:${NC}"
echo "  Version: $VERSION"
echo "  Tokens: $TOKENS_COUNT"
echo "  File size: $(wc -c < "$TOKEN_LIST_FILE") bytes"

# Check if wrangler is available
if command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}Using Wrangler CLI for upload...${NC}"
    
    # Check if user is authenticated
    if ! wrangler whoami >/dev/null 2>&1; then
        echo -e "${RED}Error: Not authenticated with Cloudflare${NC}"
        echo "Please run: wrangler login"
        exit 1
    fi

    echo -e "${GREEN}✓ Authenticated with Cloudflare${NC}"

    # Confirm deployment
    echo
    read -p "Deploy this token list to R2 bucket '$R2_BUCKET_NAME'? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled${NC}"
        exit 0
    fi

    # Upload to R2 using wrangler
    echo -e "${YELLOW}Uploading token list to Cloudflare R2...${NC}"
    if wrangler r2 object put "$R2_BUCKET_NAME/$R2_OBJECT_NAME" \
        --file "$TOKEN_LIST_FILE" \
        --content-type "application/json" \
        --cache-control "public, max-age=300"; then
        
        echo -e "${GREEN}✓ Token list successfully deployed to R2!${NC}"
        
    else
        echo -e "${RED}Error: Failed to upload token list to R2${NC}"
        exit 1
    fi

else
    echo -e "${YELLOW}Wrangler CLI not found. Please install it first:${NC}"
    echo "npm install -g wrangler"
    echo ""
    echo -e "${YELLOW}Alternative: Manual upload instructions${NC}"
    echo "1. Go to https://dash.cloudflare.com/[account-id]/r2/overview/buckets/$R2_BUCKET_NAME"
    echo "2. Upload the file: $TOKEN_LIST_FILE"
    echo "3. Set object name as: $R2_OBJECT_NAME"
    echo "4. Set content-type: application/json"
    exit 1
fi

echo
echo -e "${BLUE}Public URL:${NC}"
echo "$R2_PUBLIC_URL/$R2_OBJECT_NAME"
echo
echo -e "${YELLOW}Don't forget to:${NC}"
echo "1. Update your .env file with the correct R2 URL"
echo "2. Set up a custom domain if desired"
echo "3. Configure CORS if needed for cross-origin requests"
