# 🚀 Manual R2 Upload Guide

Since the automated deployment requires Wrangler CLI authentication, here's how to manually upload the token list and logos to Cloudflare R2:

## 📋 Step 1: Upload Token List JSON

### Via Cloudflare Dashboard:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 Object Storage
3. Select bucket: `bct-landing-tokenlist`
4. Click "Upload"
5. Upload file: `public/bctchain-token-list.json`
6. Set object name: `bctchain-token-list.json`
7. Set metadata:
   - Content-Type: `application/json`
   - Cache-Control: `public, max-age=300`

### Via wrangler CLI (if authenticated):

```bash
# Login first
wrangler login

# Upload token list
wrangler r2 object put bct-landing-tokenlist/bctchain-token-list.json \
  --file public/bctchain-token-list.json \
  --content-type "application/json" \
  --cache-control "public, max-age=300"
```

## 🖼️ Step 2: Upload Token Logo Images

You need to upload these PNG files to the R2 bucket:

### Required Logo Files:

- `bct.png` - BCT Chain Token logo
- `raj.png` - Rajavej coin logo
- `lisa.png` - LISA COIN logo
- `weth.png` - Wrapped Ether logo
- `usdg.png` - USD Gold logo
- `bctchain-logo.png` - Main BCTChain logo

### Upload Location:

Upload each logo to the bucket so they're accessible at:

```
https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/[filename].png
```

### Via Cloudflare Dashboard:

1. Go to your R2 bucket: `bct-landing-tokenlist`
2. Upload each PNG file
3. Set Content-Type: `image/png` for each
4. Set Cache-Control: `public, max-age=86400` (24 hours)

### Via wrangler CLI:

```bash
# Upload individual logos (replace with actual file paths)
wrangler r2 object put bct-landing-tokenlist/bct.png --file /path/to/bct.png --content-type "image/png"
wrangler r2 object put bct-landing-tokenlist/raj.png --file /path/to/raj.png --content-type "image/png"
wrangler r2 object put bct-landing-tokenlist/lisa.png --file /path/to/lisa.png --content-type "image/png"
wrangler r2 object put bct-landing-tokenlist/weth.png --file /path/to/weth.png --content-type "image/png"
wrangler r2 object put bct-landing-tokenlist/usdg.png --file /path/to/usdg.png --content-type "image/png"
wrangler r2 object put bct-landing-tokenlist/bctchain-logo.png --file /path/to/bctchain-logo.png --content-type "image/png"
```

## 🔍 Step 3: Verify Upload

### Test Token List:

```bash
curl https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json
```

### Test Logo Images:

```bash
curl -I https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/bct.png
```

## 🛠️ Step 4: Configure Environment

Create `.env.local` file:

```env
NEXT_PUBLIC_TOKEN_LIST_URL=https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json
```

## ✅ Step 5: Test the Application

```bash
npm run dev
```

Navigate to `/trade` and verify:

- Token logos load from R2
- Fallback displays work for missing images
- Token selection shows proper branding

## 🚨 Troubleshooting

### If logos don't load:

1. Check browser Network tab for 404 errors
2. Verify R2 bucket public access settings
3. Check CORS configuration if needed
4. Ensure Content-Type headers are correct

### If token list doesn't load:

1. Verify JSON is valid with `jq`
2. Check public access URL is correct
3. Test direct curl to the endpoint
4. Clear browser cache

## 📞 Need Help?

If you encounter issues:

1. Run `./verify-setup.sh` to check local configuration
2. Use browser developer tools to inspect network requests
3. Check the console for any JavaScript errors
4. Verify all R2 URLs are accessible
