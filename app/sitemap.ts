import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.aishwaryamanikarnike.com';
    const lastModified = new Date();

    // Only include actual pages, not hash fragments (single-page sections)
    const pages = [
        {
            url: baseUrl,
            lastModified,
            changeFrequency: 'weekly' as const,
            priority: 1.0,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        },
        // Future: Add individual blog post URLs dynamically when needed
        // For now, blog posts are discovered through /blog listing
    ];

    return pages;
}
