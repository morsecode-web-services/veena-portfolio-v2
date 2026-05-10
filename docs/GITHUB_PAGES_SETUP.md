# Quick GitHub Pages Setup

## Current Issue: Images and Content Not Loading

Your site is building correctly locally, but when deployed to GitHub Pages, the images, artist name, and biography are not showing. This is because of how GitHub Pages handles paths.

## Solution

### Step 1: Determine Your Deployment URL

**Option A: Root Domain Deployment**
- Repository name: `username.github.io`
- URL: `https://username.github.io/`
- **No base path needed** ✅

**Option B: Subdirectory Deployment**
- Repository name: anything else (e.g., `veena-website`)
- URL: `https://username.github.io/veena-website/`
- **Base path needed**: `/veena-website`

### Step 2: Configure for Your Deployment Type

#### If Deploying to Root Domain (username.github.io):

You're all set! The current configuration will work. Just follow Step 3.

#### If Deploying to Subdirectory (username.github.io/repo-name):

1. **Find your repository name** on GitHub

2. **Update `next.config.js`**:
   ```javascript
   basePath: '/your-repo-name',
   assetPrefix: '/your-repo-name',
   ```
   Replace `your-repo-name` with your actual repository name.

   OR create a `.env.production` file:
   ```
   NEXT_PUBLIC_BASE_PATH=/your-repo-name
   ```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Click **Save**

### Step 4: Deploy

```bash
# Commit all changes
git add .
git commit -m "Configure for GitHub Pages"
git push origin main
```

### Step 5: Monitor Deployment

1. Go to the **Actions** tab in your repository
2. Watch the "Deploy to GitHub Pages" workflow
3. Wait for it to complete (usually 1-2 minutes)
4. Your site will be live at:
   - `https://username.github.io/` (root domain)
   - `https://username.github.io/repo-name/` (subdirectory)

## Verification Checklist

After deployment, check:

- [ ] Site loads without errors
- [ ] Artist name "Aishwarya Manikarnike" is visible
- [ ] Biography text is displayed
- [ ] Images are showing
- [ ] Videos are embedded
- [ ] Navigation works
- [ ] All sections are accessible

## Troubleshooting

### Problem: Still seeing default/missing content

**Check 1: Verify the config file is loading**
1. Open your deployed site
2. Press F12 to open DevTools
3. Go to **Network** tab
4. Refresh the page
5. Look for `site-config.json` in the network requests
6. Click on it and check:
   - Status should be **200 OK** (not 404)
   - Preview should show your artist data

**Check 2: Check browser console**
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for errors like:
   - "Failed to load configuration"
   - "404 Not Found"
4. If you see 404 errors, the base path is incorrect

**Check 3: Verify base path**
1. If your URL is `https://username.github.io/repo-name/`
2. Your base path MUST be `/repo-name`
3. Update `next.config.js` accordingly

### Problem: Images not loading

**Solution 1: Use external image URLs**
The config file already uses Unsplash URLs, which should work. If you want to use your own images:

1. Upload to an image hosting service (Imgur, Cloudinary, etc.)
2. Use the full URL in `site-config.json`

**Solution 2: Use local images**
1. Add images to `public/images/` directory
2. In `site-config.json`, use paths like:
   ```json
   "veena": "/images/veena-performance.jpg"
   ```
3. If using subdirectory deployment, the base path will be automatically added

### Problem: GitHub Actions workflow failing

1. Check the workflow logs in the Actions tab
2. Common issues:
   - Node version mismatch (should be 20)
   - Missing dependencies (run `npm install` locally first)
   - Build errors (run `npm run build` locally to test)

## Testing Locally Before Deployment

```bash
# Build the production version
npm run build

# Serve the built site locally
npx serve out

# Open http://localhost:3000 in your browser
# Test everything works as expected
```

## Quick Reference

### Your Current Configuration:
- ✅ Static export enabled (`output: 'export'`)
- ✅ Image optimization disabled for static export
- ✅ Config file in `public/config/site-config.json`
- ✅ GitHub Actions workflow ready
- ✅ `.nojekyll` file included

### What You Need to Do:
1. Determine if you need a base path (subdirectory deployment)
2. Update `next.config.js` if needed
3. Enable GitHub Pages in repository settings
4. Push to GitHub
5. Wait for deployment
6. Verify everything works

## Example Configurations

### Example 1: Root Domain (username.github.io)
```javascript
// next.config.js
basePath: '',
assetPrefix: '',
```

### Example 2: Subdirectory (username.github.io/veena-site)
```javascript
// next.config.js
basePath: '/veena-site',
assetPrefix: '/veena-site',
```

## Need More Help?

1. Check the full `DEPLOYMENT_GUIDE.md` for detailed troubleshooting
2. Review the GitHub Actions logs for specific errors
3. Test the build locally with `npm run build && npx serve out`
4. Verify the config file is valid JSON
5. Check browser DevTools for network and console errors

---

**Remember**: The most common issue is incorrect base path configuration. Make sure it matches your repository name if deploying to a subdirectory!
