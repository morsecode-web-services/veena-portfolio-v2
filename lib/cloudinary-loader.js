/**
 * Custom Next.js image loader using Cloudinary fetch mode.
 *
 * How it works:
 * - Cloudinary fetches the original image from your site URL
 * - Automatically converts to WebP/AVIF (f_auto)
 * - Automatically picks optimal quality (q_auto)
 * - Resizes to the requested width
 * - Caches on Cloudinary's global CDN
 *
 * Environments:
 * - Production (Netlify): routes through Cloudinary
 * - GitHub Pages: routes through Cloudinary (with BASE_PATH)
 * - Local dev: routes through Cloudinary (using SITE_URL)
 */
export default function cloudinaryLoader({ src, width, quality }) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || '';

  // 1. If Cloudinary isn't configured or if the image is a direct CDN asset / Google thumbnail, serve directly
  if (
    !cloudName ||
    src.includes('drive.google.com') ||
    src.includes('googleusercontent.com') ||
    src.includes('r2.dev') ||
    src.includes('r2.cloudflarestorage.com')
  ) {
    return src;
  }

  // 2. Build Cloudinary transforms
  const transforms = ['f_auto', quality ? `q_${quality}` : 'q_auto', `w_${width}`, 'c_limit'].join(
    ','
  );

  // 3. Handle External vs Internal URLs
  const isExternal = src.startsWith('http://') || src.startsWith('https://');
  const isSelfCloudinary = src.includes(`res.cloudinary.com/${cloudName}`);

  // Optimization: If it's already on our Cloudinary, use direct transformations
  if (isSelfCloudinary) {
    const marker = '/image/upload/';
    const markerIndex = src.indexOf(marker);
    if (markerIndex !== -1) {
      const prefix = src.substring(0, markerIndex + marker.length);
      const suffix = src.substring(markerIndex + marker.length);

      // Extract the path from the version tag (e.g. v1778482890/...) onwards
      // to strip any pre-existing transformations.
      const versionMatch = suffix.match(/(v\d+)\//);
      if (versionMatch) {
        const versionString = versionMatch[0];
        const versionIndex = suffix.indexOf(versionString);
        const cleanPath = suffix.substring(versionIndex);
        return `${prefix}${transforms}/${cleanPath}`;
      } else {
        return `${prefix}${transforms}/${suffix}`;
      }
    }
  }

  let sourceUrl = src;
  if (!isExternal) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const cleanSrc = src.startsWith('/') ? src : `/${src}`;

    // In Local Dev, we still use the live site URL for Cloudinary to fetch from,
    // or fall back to the provided source if siteUrl is missing.
    if (siteUrl) {
      sourceUrl = `${siteUrl}${basePath}${cleanSrc}`;
    } else {
      // If no siteUrl, we can't use Cloudinary fetch mode for local files
      return `${basePath}${cleanSrc}`;
    }
  }

  // 4. Construct Final Cloudinary URL
  return `https://res.cloudinary.com/${cloudName}/image/fetch/${transforms}/${encodeURIComponent(sourceUrl)}`;
}
