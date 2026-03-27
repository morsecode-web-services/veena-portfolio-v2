import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// When NEXT_PUBLIC_SITE_LIVE is 'true', this middleware does nothing — the full site is visible.
// Set it to 'false' in .env.local (and Netlify env vars) to show the coming soon page.
const SITE_LIVE = process.env.NEXT_PUBLIC_SITE_LIVE === 'true';

// Paths that must always work regardless of site live status
const WHITELISTED_PREFIXES = [
    '/link/',       // Deep links must always function
    '/admin',       // Admin dashboard access 
    '/api/',        // API routes
    '/coming-soon', // The page itself (avoid infinite redirect loop)
    '/_next/',      // Next.js internals
    '/favicon',
    '/icon.png',
    '/robots.txt',
    '/sitemap.xml',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always inject pathname header so root layout can detect the current page
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);

    if (SITE_LIVE) {
        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const isWhitelisted = WHITELISTED_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix) || pathname === prefix.replace('/', '')
    );

    if (isWhitelisted) {
        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Redirect everything else to coming soon
    return NextResponse.redirect(new URL('/coming-soon', request.url));
}

export const config = {
    matcher: [
        // Match all paths except Next.js static files
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
