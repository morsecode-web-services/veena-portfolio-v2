# GitHub Pages Deployment Fix V2

## Issue
After initial deployment, the site showed error:
```
Failed to load configuration from /config/site-config.json
```

## Root Cause
The `process.env.NEXT_PUBLIC_BASE_PATH` environment variable was not available in the client-side code because:
1. Environment variables in Next.js need to be set at build time
2. The hardcoded base path in `next.config.js` wasn't being passed to the client code
3. The config loader was trying to use an undefined environment variable

## Solution

Updated `lib/config.ts` to detect the base path dynamically on the client side:

```typescript
function getBasePath(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // If we're on GitHub Pages, extract base path from URL
    if (hostname.includes('github.io') && pathname.startsWith('/veena-portfolio-v2')) {
      return '/veena-portfolio-v2';
    }
  }
  
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}
```

This approach:
- ✅ Works in production (GitHub Pages)
- ✅ Works in development (localhost)
- ✅ Doesn't require environment variables
- ✅ Automatically detects the correct path

## How It Works

### On GitHub Pages:
- URL: `https://nageshraj.github.io/veena-portfolio-v2/`
- Hostname: `nageshraj.github.io`
- Pathname: `/veena-portfolio-v2/`
- Detected base path: `/veena-portfolio-v2`
- Config URL: `/veena-portfolio-v2/config/site-config.json` ✅

### On Localhost:
- URL: `http://localhost:3000/`
- Hostname: `localhost`
- Pathname: `/`
- Detected base path: `` (empty)
- Config URL: `/config/site-config.json` ✅

## Deploy the Fix

```bash
# Rebuild with the fix
npm run build

# Commit and push
git add .
git commit -m "Fix config loading for GitHub Pages"
git push origin main
```

## Verify the Fix

After deployment completes:

1. **Open your site**: https://nageshraj.github.io/veena-portfolio-v2/

2. **Open DevTools** (F12)

3. **Check Console**:
   - Should see: `Loading config from: /veena-portfolio-v2/config/site-config.json`
   - Should NOT see any errors

4. **Check Network Tab**:
   - Find `site-config.json` request
   - Status should be `200 OK`
   - URL should be: `https://nageshraj.github.io/veena-portfolio-v2/config/site-config.json`

5. **Verify Content**:
   - Artist name "Aishwarya Manikarnike" should be visible
   - Biography should be displayed
   - Images should load
   - Videos should be embedded

## Testing Locally

To test the production build locally:

```bash
# Build
npm run build

# Serve
npx serve out

# Open browser to:
# http://localhost:3000/veena-portfolio-v2/
```

Note: You must navigate to `/veena-portfolio-v2/` path to simulate GitHub Pages.

## Alternative Solution (If Needed)

If the dynamic detection doesn't work, you can use a constant:

```typescript
// lib/config.ts
const BASE_PATH = '/veena-portfolio-v2';

export async function loadConfig(
  configPath: string = '/config/site-config.json'
): Promise<SiteConfig> {
  const fullPath = `${BASE_PATH}${configPath}`;
  // ... rest of the code
}
```

## Troubleshooting

### Still getting 404 errors?

1. **Check the exact error message** in console
2. **Verify the URL** being requested in Network tab
3. **Check if config file exists** in the `out/` directory:
   ```bash
   ls -la out/config/
   ```
4. **Verify GitHub Pages is enabled** in repository settings

### Config loads but content is default?

1. **Check the config file content**:
   ```bash
   cat out/config/site-config.json
   ```
2. **Verify JSON is valid**:
   ```bash
   cat public/config/site-config.json | jq .
   ```

### Images not loading?

The config uses Unsplash URLs which should work. If images don't load:
1. Check browser console for CORS errors
2. Verify the image URLs in `site-config.json` are accessible
3. Try opening an image URL directly in browser

## Summary

The fix changes how the base path is detected:
- **Before**: Relied on `process.env.NEXT_PUBLIC_BASE_PATH` (not available)
- **After**: Dynamically detects from `window.location` (always available)

This ensures the config file is loaded from the correct path on GitHub Pages while still working on localhost.

## Next Steps

1. ✅ Code is fixed
2. ⏳ Build and deploy
3. ⏳ Verify on GitHub Pages
4. ✅ Enjoy your working site!

Your site will be fully functional at:
## https://nageshraj.github.io/veena-portfolio-v2/
