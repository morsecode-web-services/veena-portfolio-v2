import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.aishwaryamanikarnike.com';
    const lastModified = new Date();

    const sections = [
        '',
        '#about',
        '#music',
        '#gallery',
        '#press',
        '#faq',
        '#contact',
    ];

    return sections.map((section) => ({
        url: `${baseUrl}/${section}`,
        lastModified,
        changeFrequency: 'monthly',
        priority: section === '' ? 1 : 0.8,
    }));
}
