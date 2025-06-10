# Token Logo Migration Guide

## Overview
This guide covers the migration from emoji-based token logos to actual image-based logos stored in Cloudflare R2.

## Changes Made

### 1. Token List Updates
- Updated token list to use Cloudflare R2 URLs for token logos
- Changed from emoji fallbacks to actual PNG images
- Updated both TypeScript and JSON token lists

### 2. New Components
- **TokenLogo Component** (`components/ui/token-logo.tsx`): Displays token images with fallback
- **useTokenLogos Hook** (`hooks/use-token-logos.ts`): Manages token logo state
- **Token List Service Extensions** (`lib/token-list.ts`): Added logo utility functions

### 3. Updated Trading Interfaces
Updated all trading interface components to use TokenLogo instead of emojis:
- `components/trading-interface.tsx` (main)
- `components/trading-interface-new.tsx`
- `components/trading-interface-beautiful.tsx`

### 4. Cloudflare R2 Configuration
- **Storage URL**: `https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/`
- **Public URL**: `https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json`
- **Deployment Script**: `deploy-tokens.sh` for easy token list updates

## Token Logo URLs

### Current Token Logos in R2:
```
bct.png         - BCT Chain Token
raj.png         - Rajavej coin  
lisa.png        - LISA COIN
weth.png        - Wrapped Ether
usdg.png        - USD Gold
bctchain-logo.png - Main BCTChain logo
```

## Usage

### TokenLogo Component
```tsx
import { TokenLogo } from "@/components/ui/token-logo";

// Basic usage
<TokenLogo token={tokenInfo} size="md" />

// With custom props
<TokenLogo 
  symbol="BCT" 
  logoURI="https://example.com/logo.png"
  size="lg" 
  className="custom-class"
/>
```

### Sizes Available:
- `sm`: 20x20px (w-5 h-5)
- `md`: 32x32px (w-8 h-8) 
- `lg`: 48x48px (w-12 h-12)

### Token Logo Service
```tsx
import { TokenListService } from "@/lib/token-list";

// Get logo URL by symbol or address
const logoUrl = await TokenListService.getTokenLogo("BCT");

// Get all logos as a map
const logoMap = await TokenListService.getTokenLogoMap();
```

## Deployment

### 1. Update Token List
Edit `public/bctchain-token-list.json` with new tokens or logo URLs.

### 2. Deploy to R2
```bash
./deploy-tokens.sh
```

### 3. Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_TOKEN_LIST_URL=https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json
```

## Fallback Behavior

### Image Loading:
1. **Primary**: Load from `logoURI` in token data
2. **Fallback**: Show circular badge with token symbol initials

### Error Handling:
- Image load errors trigger fallback display
- Network errors fall back to cached token data
- Missing logos show symbol-based placeholders

## Best Practices

### Token Logo Guidelines:
- **Format**: PNG with transparency
- **Size**: 128x128px minimum, square aspect ratio
- **Background**: Transparent or solid color
- **File Size**: Under 50KB for fast loading

### Adding New Tokens:
1. Upload logo to R2 storage
2. Update token list JSON with correct `logoURI`
3. Deploy updated token list
4. Test in development environment

## Migration Notes

### Breaking Changes:
- `getTokenLogo()` function now returns `null` instead of emoji
- All emoji references removed from trading interfaces
- TokenLogo component required for proper display

### Backwards Compatibility:
- Old emoji-based systems will show fallback badges
- Gradual migration path maintained
- No impact on existing functionality

## Troubleshooting

### Common Issues:

1. **Logo not displaying**:
   - Check R2 URL accessibility
   - Verify CORS settings
   - Check browser network tab for 404s

2. **Fallback always showing**:
   - Verify `logoURI` in token data
   - Check image URL validity
   - Test image accessibility

3. **Token list not updating**:
   - Clear browser cache
   - Check environment variables
   - Verify R2 deployment

### Debug Commands:
```bash
# Test token list fetch
curl https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json

# Test individual logo
curl https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/bct.png
```
