'use client';

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
    if (src.startsWith('https://images.unsplash.com')) {
        try {
            const url = new URL(src);
            url.searchParams.set('w', width.toString());
            url.searchParams.set('q', (quality || 75).toString());
            url.searchParams.set('auto', 'format');
            return url.toString();
        } catch {
            // If URL parsing fails, fallback to simple string manipulation
            const separator = src.includes('?') ? '&' : '?';
            return `${src}${separator}w=${width}&q=${quality || 75}&auto=format`;
        }
    }
    // Return original path for local images or other sources
    return src;
}
