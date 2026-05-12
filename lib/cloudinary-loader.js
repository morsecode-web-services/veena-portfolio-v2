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

    // 1. If Cloudinary isn't configured, fall back to direct serving
    if (!cloudName) {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        return `${basePath}${src}`;
    }

    // 2. Build Cloudinary transforms
    const transforms = [
        'f_auto',
        quality ? `q_${quality}` : 'q_auto',
        `w_${width}`,
        'c_limit',
    ].join(',');

    // 3. Handle External vs Internal URLs
    const isExternal = src.startsWith('http://') || src.startsWith('https://');
    const isSelfCloudinary = src.includes(`res.cloudinary.com/${cloudName}`);

    // Optimization: If it's already on our Cloudinary, use direct transformations
    if (isSelfCloudinary) {
        // Strip existing transformations if any (optional, but safer to just use as source)
        // For simplicity, we'll treat it as a source for a new 'upload' or 'fetch' but cleaner
        // Actually, the most robust way is to extract the public_id, but 'fetch' mode 
        // works perfectly fine even for self-hosted URLs and handles all edge cases.
        // We will just skip encoding if it's already a full URL to avoid double encoding.
        return `https://res.cloudinary.com/${cloudName}/image/fetch/${transforms}/${src}`;
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
