# GitHub Pages Deployment Guide

## Overview
This guide explains how to deploy the Veena musician website to GitHub Pages.

## Prerequisites
- GitHub account
- Repository pushed to GitHub
- GitHub Pages enabled in repository settings

## Deployment Methods

### Method 1: Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to the main branch.

#### Setup Steps:

1. **Enable GitHub Pages in Repository Settings**:
   - Go to your repository on GitHub
   - Click on "Settings" → "Pages"
   - Under "Source", select "GitHub Actions"
   - Save the settings

2. **Push Your Code**:
   ```bash
   git add .
   git commit -m "Configure for GitHub Pages deployment"
   git push origin main
   ```

3. **Monitor Deployment**:
   - Go to the "Actions" tab in your repository
   - Watch the deployment workflow run
   - Once complete, your site will be live at:
     - `https://username.github.io/` (if repo name is username.github.io)
     - `https://username.github.io/repo-name/` (for other repo names)

### Method 2: Manual Deployment

If you prefer to deploy manually:

1. **Build the Static Site**:
   ```bash
   npm run build
   ```

2. **The output will be in the `out` directory**

3. **Deploy the `out` directory to GitHub Pages**:
   - You can use the `gh-pages` branch method
   - Or upload the contents manually

## Configuration for Different Deployment Scenarios

### Deploying to username.github.io (Root Domain)

No additional configuration needed. The site will work at `https://username.github.io/`

### Deploying to username.github.io/repo-name (Subdirectory)

If your repository name is NOT `username.github.io`, you need to set the base path:

1. **Create a `.env.local` file** (for local development):
   ```
   NEXT_PUBLIC_BASE_PATH=/repo-name
   ```

2. **Update the GitHub Actions workflow** (`.github/workflows/deploy.yml`):
   The workflow already handles this automatically using the Pages configuration.

3. **Or set it manually in `next.config.js`**:
   ```javascript
   basePath: '/your-repo-name',
   assetPrefix: '/your-repo-name',
   ```

## Troubleshooting

### Issue: Images or Config Not Loading

**Problem**: The site loads but images, artist name, or biography are missing.

**Solutions**:

1. **Check the base path configuration**:
   - If deploying to a subdirectory, ensure `NEXT_PUBLIC_BASE_PATH` is set correctly
   - The base path should match your repository name

2. **Verify the config file is accessible**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Look for `site-config.json` request
   - Check if it returns 200 OK or 404 Not Found
   - If 404, the path is incorrect

3. **Check the browser console**:
   - Open DevTools Console
   - Look for any error messages
   - Common errors:
     - "Failed to load configuration" - config file path is wrong
     - CORS errors - shouldn't happen on GitHub Pages
     - 404 errors - base path is incorrect

4. **Verify file paths in config**:
   - Image paths in `site-config.json` should be absolute URLs or start with `/`
   - Example: `/images/photo.jpg` or `https://example.com/image.jpg`

### Issue: 404 Page Not Found

**Problem**: Navigating to the site shows a 404 error.

**Solutions**:

1. **Check GitHub Pages is enabled**:
   - Go to Settings → Pages
   - Ensure "Source" is set to "GitHub Actions"

2. **Wait for deployment to complete**:
   - Check the Actions tab
   - Ensure the workflow completed successfully
   - Deployment can take 1-2 minutes after workflow completes

3. **Check the correct URL**:
   - For `username.github.io` repo: `https://username.github.io/`
   - For other repos: `https://username.github.io/repo-name/`

### Issue: Styles Not Loading

**Problem**: The site loads but looks unstyled.

**Solutions**:

1. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

2. **Check base path in next.config.js**:
   - Ensure it matches your deployment URL

3. **Verify the build completed successfully**:
   - Check the Actions workflow logs
   - Look for any build errors

### Issue: Dynamic Routes Not Working

**Problem**: Navigation works but direct URLs to sections don't work.

**Solution**: This is expected with static export. The site uses hash-based navigation (`#section-name`) which works correctly with GitHub Pages.

## Local Testing of Production Build

To test the production build locally before deploying:

1. **Build the site**:
   ```bash
   npm run build
   ```

2. **Serve the `out` directory**:
   ```bash
   npx serve out
   ```

3. **Open in browser**:
   - Go to `http://localhost:3000`
   - Test all functionality

## Environment Variables

### For Local Development:
Create a `.env.local` file:
```
NEXT_PUBLIC_BASE_PATH=
```

### For GitHub Pages Deployment:
The GitHub Actions workflow automatically sets:
```
NEXT_PUBLIC_BASE_PATH=${{ steps.pages.outputs.base_path }}
```

## File Structure After Build

```
out/
├── _next/              # Next.js assets
├── config/
│   └── site-config.json
├── images/             # If you have local images
├── index.html          # Home page
├── 404.html           # 404 page
└── .nojekyll          # Tells GitHub Pages not to use Jekyll
```

## Updating Content

### To Update Site Content:

1. **Edit `public/config/site-config.json`**:
   - Update artist information
   - Add/remove videos
   - Modify press articles
   - Update FAQ items

2. **Commit and push**:
   ```bash
   git add public/config/site-config.json
   git commit -m "Update site content"
   git push origin main
   ```

3. **Wait for automatic deployment** (if using GitHub Actions)

### To Update Images:

1. **Option A: Use External URLs** (Recommended):
   - Upload images to a CDN or image hosting service
   - Use the full URL in `site-config.json`
   - Example: `https://images.unsplash.com/photo-123...`

2. **Option B: Use Local Images**:
   - Add images to `public/images/` directory
   - Reference them in config: `/images/photo.jpg`
   - Commit and push the images

## Performance Optimization

### Image Optimization:
- Use external CDN URLs (Unsplash, Cloudinary, etc.)
- Images are automatically optimized by the CDN
- Lazy loading is built into the site

### Caching:
- GitHub Pages automatically caches static assets
- Browser caching is enabled for better performance

## Security Considerations

### Content Security:
- All external links open in new tabs with `rel="noopener noreferrer"`
- Form submissions include rate limiting
- No sensitive data is stored in the config file

### HTTPS:
- GitHub Pages automatically provides HTTPS
- All external resources should use HTTPS URLs

## Custom Domain (Optional)

To use a custom domain:

1. **Add CNAME file**:
   Create `public/CNAME` with your domain:
   ```
   www.yourdomain.com
   ```

2. **Configure DNS**:
   - Add a CNAME record pointing to `username.github.io`
   - Or A records pointing to GitHub Pages IPs

3. **Enable in GitHub Settings**:
   - Go to Settings → Pages
   - Enter your custom domain
   - Enable "Enforce HTTPS"

## Monitoring and Analytics

### GitHub Actions:
- Monitor deployments in the Actions tab
- Check workflow logs for any errors
- Set up notifications for failed deployments

### Site Analytics:
- Add Google Analytics or similar
- Monitor site performance
- Track user engagement

## Support and Resources

### Official Documentation:
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Common Issues:
- Check the GitHub Actions logs for build errors
- Verify all file paths are correct
- Ensure the config file is valid JSON
- Test locally before deploying

## Quick Reference

### Build Commands:
```bash
npm run build          # Build for production
npm run dev           # Run development server
npm run lint          # Check for code issues
npm run type-check    # Check TypeScript types
```

### Deployment Commands:
```bash
git add .
git commit -m "Deploy updates"
git push origin main
```

### Testing Commands:
```bash
npm run build         # Build the site
npx serve out        # Serve locally
```

## Checklist Before First Deployment

- [ ] Repository pushed to GitHub
- [ ] GitHub Pages enabled in Settings
- [ ] Source set to "GitHub Actions"
- [ ] `.github/workflows/deploy.yml` file present
- [ ] `public/config/site-config.json` configured
- [ ] All image URLs are valid
- [ ] Base path configured (if needed)
- [ ] Local build tested successfully
- [ ] All links tested
- [ ] Mobile responsiveness verified

## Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] All images display
- [ ] Artist name and bio visible
- [ ] Videos play correctly
- [ ] Navigation works
- [ ] Contact form submits (if email service configured)
- [ ] Mobile view works
- [ ] All sections accessible
- [ ] Social media links work
- [ ] No console errors

---

**Need Help?**
- Check the GitHub Actions logs for detailed error messages
- Review the browser console for client-side errors
- Verify the Network tab in DevTools for failed requests
- Ensure all URLs in the config file are accessible
