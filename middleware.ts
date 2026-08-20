import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// When NEXT_PUBLIC_SITE_LIVE is 'true', this middleware does nothing — the full site is visible.
// Set it to 'false' in .env.local (and Netlify env vars) to show the coming soon page.
const SITE_LIVE = process.env.NEXT_PUBLIC_SITE_LIVE === 'true';

// Paths that must always work regardless of site live status
const WHITELISTED_PREFIXES = [
  '/link/', // Deep links must always function
  '/links', // Link-in-bio page
  '/admin', // Admin dashboard access
  '/forms/', // Standalone registration forms
  '/api/', // API routes for forms to function
  '/cohorts', // Cohort landing page
  '/hall-of-fame', // Hall of Fame showcase page
  '/coming-soon', // The page itself (avoid infinite redirect loop)
  '/_next/', // Next.js internals
  '/favicon',
  '/icon.png',
  '/logo.png', // Allow site logo to load
  '/robots.txt',
  '/sitemap.xml',
  '/images/', // Allow static images to load
];

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // --- Smart Link fast-path: handle /link/{slug} redirects at the edge ---
  const linkMatch = pathname.match(/^\/link\/([^/]+)$/);
  if (linkMatch && supabaseUrl && supabaseAnonKey) {
    const slug = linkMatch[1];
    // Create Edge Supabase client with Next.js caching
    const edgeSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        fetch: (url, options) => {
          // Cache the URL lookup (GET) at the edge for 1 week maximum speed
          // We will manually invalidate this cache using tags from the admin dashboard
          if (options?.method === 'GET') {
            return fetch(url, {
              ...options,
              next: {
                revalidate: 604800, // 1 week
                tags: ['smart-links'],
              },
            });
          }
          // Leave the click tracking (POST) un-cached so it's always accurate
          return fetch(url, { ...options, cache: 'no-store' });
        },
      },
    });

    const { data: link, error } = await edgeSupabase
      .from('smart_links')
      .select('id, target_url, platform')
      .eq('slug', slug)
      .single();

    if (!link || error) {
      // Fall through to the page which will render notFound()
      return NextResponse.next();
    }

    // Track click asynchronously in the background using event.waitUntil
    // This avoids delaying the redirect by 50ms-150ms for the user
    event.waitUntil(
      (async () => {
        try {
          await edgeSupabase.rpc('increment_click_count', { row_id: link.id });
        } catch (e) {
          console.error('[Middleware] Failed to increment click count:', e);
        }
      })()
    );

    // Plain redirect: instant 307, no HTML needed
    if (link.platform === 'other') {
      return NextResponse.redirect(link.target_url, 307);
    }

    // Deep link: pass data via headers so the page skips the Supabase query
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    requestHeaders.set('x-link-target-url', link.target_url);
    requestHeaders.set('x-link-platform', link.platform);
    requestHeaders.set('x-link-id', link.id);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (SITE_LIVE) {
    return NextResponse.next();
  }

  const isWhitelisted = WHITELISTED_PREFIXES.some(
    (prefix) => pathname.startsWith(prefix) || pathname === prefix.replace('/', '')
  );

  if (isWhitelisted) {
    return NextResponse.next();
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
