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
 * - Local dev: serves images directly (no Cloudinary)
 */
export default function cloudinaryLoader({ src, width, quality }) {
    // Local dev: serve images directly
    if (process.env.NODE_ENV === 'development') {
        return src;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    // If Cloudinary isn't configured, fall back to direct serving
    if (!cloudName || !siteUrl) {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        return `${basePath}${src}`;
    }

    // Build Cloudinary fetch URL
    // f_auto = automatic format (WebP/AVIF based on browser support)
    // q_auto = automatic quality optimization
    // w_{width} = resize to requested width
    const transforms = [
        'f_auto',
        quality ? `q_${quality}` : 'q_auto',
        `w_${width}`,
        'c_limit', // don't upscale, only downscale
    ].join(',');

    // Construct the full source URL that Cloudinary will fetch from
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const sourceUrl = `${siteUrl}${basePath}${src}`;

    return `https://res.cloudinary.com/${cloudName}/image/fetch/${transforms}/${sourceUrl}`;
}
