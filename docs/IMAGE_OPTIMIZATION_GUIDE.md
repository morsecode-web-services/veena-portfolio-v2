# Image Optimization Guide

This guide provides instructions for optimizing images in the portfolio website to improve SEO performance and page load times.

## Current Image Issues

Several images in the project are larger than recommended for web usage:
- `public/images/home/hero-bg.jpg` - 756KB (should be ~100KB)
- Various spotlight and gallery images - 292KB+ (should be ~50-100KB)

## Prerequisites

Install the required image optimization tools:

```bash
npm install -D sharp-cli
```

Or use online tools:
- [Squoosh.app](https://squoosh.app/) - Browser-based image optimizer
- [TinyPNG](https://tinypng.com/) - Online PNG/JPG compressor
- [ImageOptim](https://imageoptim.com/) - macOS desktop app

## Optimization Methods

### Method 1: Using sharp-cli (Recommended)

**Convert to WebP format** (best compression):

```bash
# Single file
npx sharp-cli -i public/images/home/hero-bg.jpg -o public/images/home/hero-bg.webp --webp '{"quality":80}'

# Batch process spotlight images
npx sharp-cli -i public/images/spotlight/*.jpg -o public/images/spotlight/ --webp '{"quality":75}'

# Batch process gallery images
npx sharp-cli -i public/images/gallery/*.jpg -o public/images/gallery/ --webp '{"quality":75}'
```

**Resize and optimize** (maintain JPG format):

```bash
# Resize hero background to max 1920px width
npx sharp-cli -i public/images/home/hero-bg.jpg -o public/images/home/hero-bg.jpg --resize 1920 --jpeg '{"quality":80}'

# Resize spotlight images to max 1200px width
npx sharp-cli -i public/images/spotlight/*.jpg -o public/images/spotlight/ --resize 1200 --jpeg '{"quality":75}'
```

### Method 2: Using Squoosh (Browser-based)

1. Visit [squoosh.app](https://squoosh.app/)
2. Drag and drop your image
3. Select compression format:
   - **WebP** for best compression (recommended)
   - **MozJPEG** for JPG format
4. Adjust quality slider to 75-85
5. Download optimized image
6. Replace original file

### Method 3: Using ImageOptim (macOS)

1. Install [ImageOptim](https://imageoptim.com/)
2. Drag images into the app
3. Wait for optimization to complete
4. Images are optimized in-place

## Target Specifications

| Image Type | Max Width | Max Size | Format | Quality |
|------------|-----------|----------|--------|---------|
| Hero Background | 1920px | 100KB | WebP/JPG | 80 |
| Spotlight Images | 1200px | 50-75KB | WebP/JPG | 75 |
| Gallery Images | 1200px | 50-100KB | WebP/JPG | 75 |
| Thumbnails | 600px | 20-30KB | WebP/JPG | 70 |

## Update Configuration

After converting images to WebP, update the image paths in `public/config/site-config.json`:

```json
{
  "home": {
    "heroBackground": "/images/home/hero-bg.webp",
    "images": {
      "veena": "/images/home/veena.webp"
    }
  },
  "spotlights": [
    {
      "image": "/images/spotlight/performance-1.webp"
    }
  ]
}
```

## Creating Responsive Image Variants

For optimal performance, create multiple sizes of each image:

```bash
# Create 3 sizes of hero image
npx sharp-cli -i public/images/home/hero-bg.jpg -o public/images/home/hero-bg-mobile.webp --resize 768 --webp '{"quality":80}'
npx sharp-cli -i public/images/home/hero-bg.jpg -o public/images/home/hero-bg-tablet.webp --resize 1280 --webp '{"quality":80}'
npx sharp-cli -i public/images/home/hero-bg.jpg -o public/images/home/hero-bg-desktop.webp --resize 1920 --webp '{"quality":80}'
```

Then update Next.js Image component to use responsive images:

```tsx
<Image
  src={getAssetPath('/images/home/hero-bg.webp')}
  alt="Hero background"
  fill
  sizes="100vw"
  srcSet={`
    ${getAssetPath('/images/home/hero-bg-mobile.webp')} 768w,
    ${getAssetPath('/images/home/hero-bg-tablet.webp')} 1280w,
    ${getAssetPath('/images/home/hero-bg-desktop.webp')} 1920w
  `}
/>
```

## Verification

After optimization, verify the improvements:

1. **Check file sizes**:
   ```bash
   ls -lh public/images/**/*.{jpg,webp}
   ```

2. **Test in browser**:
   - Open DevTools → Network tab
   - Reload page
   - Verify image sizes are reduced

3. **Run PageSpeed Insights**:
   - Visit [pagespeed.web.dev](https://pagespeed.web.dev/)
   - Enter your site URL
   - Check "Properly size images" and "Serve images in modern formats" metrics

## Expected Impact

- **Page Load Time**: 30-50% faster
- **Lighthouse Performance Score**: +10-15 points
- **Bandwidth Savings**: 60-80% reduction in image data
- **SEO Benefits**: Better Core Web Vitals scores

## Notes

- The Next.js Image component is already configured correctly in `next.config.js`
- WebP format provides better compression than JPG/PNG with similar quality
- Always keep original high-resolution images as backups
- Test images on multiple devices to ensure quality is acceptable
- Consider using CDN for additional performance gains

## Automation Script

Create a script to automate optimization for all images:

```bash
#!/bin/bash
# optimize-images.sh

echo "Optimizing hero images..."
npx sharp-cli -i public/images/home/*.jpg -o public/images/home/ --webp '{"quality":80}' --resize 1920

echo "Optimizing spotlight images..."
npx sharp-cli -i public/images/spotlight/*.jpg -o public/images/spotlight/ --webp '{"quality":75}' --resize 1200

echo "Optimizing gallery images..."
npx sharp-cli -i public/images/gallery/*.jpg -o public/images/gallery/ --webp '{"quality":75}' --resize 1200

echo "Image optimization complete!"
```

Make it executable:
```bash
chmod +x optimize-images.sh
./optimize-images.sh
```
