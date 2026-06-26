import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  // Generate simple metadata to avoid caching issues and help with basic unfurling
  return {
    title: 'Redirecting...',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DeepLinkRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Read link data from middleware headers (already queried + click-tracked there)
  const headersList = await headers();
  const headerTargetUrl = headersList.get('x-link-target-url');
  const headerPlatform = headersList.get('x-link-platform');

  // If middleware didn't inject data (e.g. Supabase was down), fall back to a direct query
  let link =
    headerTargetUrl && headerPlatform
      ? { target_url: headerTargetUrl, platform: headerPlatform }
      : null;

  if (!link) {
    const { data, error } = await supabase
      .from('smart_links')
      .select('id, target_url, platform')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return notFound();
    }
    link = data;
  }

  // Detect the device from the User-Agent (headersList already obtained above)
  const userAgent = headersList.get('user-agent')?.toLowerCase() || '';
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = isIOS || isAndroid;

  const targetUrl = link.target_url;
  let deepLink = ''; // Empty means "no deep link, go straight to web"

  // Generate deep links — different strategy per platform.
  //
  // PRIMARY USE CASE: User taps link in Instagram bio on their phone.
  //   - iOS: Instagram uses SFSafariViewController → custom schemes (vnd.youtube://) work.
  //   - Android: Instagram uses Chrome Custom Tabs → intent:// with S.browser_fallback_url works.
  //   - Desktop: No deep link needed → instant redirect to web URL.
  //
  if (isMobile && link.platform === 'youtube') {
    const videoIdMatch = targetUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (videoId) {
      if (isIOS) {
        // vnd.youtube:// is the official YouTube app URI scheme on iOS.
        // Works from Safari, SFSafariViewController (Instagram IAB), Chrome, etc.
        deepLink = `vnd.youtube://watch?v=${videoId}`;
      } else if (isAndroid) {
        // intent:// is the Android standard for launching apps.
        // Works from Chrome, Samsung Browser, and Chrome Custom Tabs (Instagram IAB).
        // S.browser_fallback_url tells Chrome where to go if the app isn't installed.
        // If the browser blocks intent:// entirely (Brave), our JS setTimeout fallback handles it.
        deepLink = `intent://www.youtube.com/watch?v=${videoId}#Intent;package=com.google.android.youtube;scheme=https;S.browser_fallback_url=${encodeURIComponent(targetUrl)};end;`;
      }
    }
  } else if (isMobile && link.platform === 'instagram') {
    if (isIOS) {
      deepLink = targetUrl.replace(/^https?:\/\/(www\.)?instagram\.com/, 'instagram://');
    } else if (isAndroid) {
      deepLink = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;package=com.instagram.android;scheme=https;S.browser_fallback_url=${encodeURIComponent(targetUrl)};end;`;
    }
  } else if (isMobile && (link.platform === 'twitter' || link.platform === 'x')) {
    if (isIOS) {
      deepLink = targetUrl.replace(/^https?:\/\/(www\.)?(twitter|x)\.com/, 'twitter://');
    } else if (isAndroid) {
      deepLink = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;package=com.twitter.android;scheme=https;S.browser_fallback_url=${encodeURIComponent(targetUrl)};end;`;
    }
  }
  // Desktop: deepLink stays empty → JS will redirect to targetUrl immediately.

  // Return the smart redirect page.
  return (
    <html lang="en">
      <head>
        <title>Redirecting...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
                        body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa; color: #333; }
                        .loader { border: 3px solid #f3f3f3; border-top: 3px solid #333; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin-right: 12px; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        .container { display: flex; align-items: center; }
                    `,
          }}
        />
      </head>
      <body>
        <div className="container">
          <div className="loader"></div>
          <p>{deepLink ? 'Opening app...' : 'Redirecting...'}</p>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
                            var deepLink = ${JSON.stringify(deepLink)};
                            var targetUrl = ${JSON.stringify(targetUrl)};

                            // Detect Brave browser — it exposes navigator.brave.
                            // Brave blocks intent:// with a hard ERR_UNKNOWN_URL_SCHEME page crash
                            // that destroys our JS context, so the setTimeout fallback never fires.
                            // We must detect it and skip the deep link entirely.
                            var isBrave = navigator.brave && typeof navigator.brave.isBrave === 'function';

                            if (!deepLink || isBrave) {
                                // Desktop, unknown device, or Brave: go to web URL immediately.
                                window.location.href = targetUrl;
                            } else {
                                // Mobile (non-Brave): attempt the deep link.
                                var appOpened = false;

                                // Track if the app actually opens (page goes to background).
                                document.addEventListener('visibilitychange', function() {
                                    if (document.hidden) appOpened = true;
                                });

                                // Navigate to the deep link.
                                // - iOS: vnd.youtube:// triggers the YouTube app.
                                // - Android Chrome/Samsung/Instagram CCT: intent:// opens the app.
                                //   If app not installed, S.browser_fallback_url redirects automatically.
                                window.location.href = deepLink;

                                // Safety net: if nothing happened after 2s, redirect to web URL.
                                setTimeout(function() {
                                    if (!appOpened) {
                                        window.location.href = targetUrl;
                                    }
                                }, 2000);
                            }
                        `,
          }}
        />
      </body>
    </html>
  );
}
