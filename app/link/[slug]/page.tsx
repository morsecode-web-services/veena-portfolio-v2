import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    // Generate simple metadata to avoid caching issues and help with basic unfurling
    return {
        title: 'Redirecting...',
        robots: {
            index: false,
            follow: false
        }
    };
}

export default async function DeepLinkRedirect({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    // 1. Fetch the actual URL and platform from Supabase
    const { data: link, error } = await supabase
        .from('smart_links')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !link) {
        return notFound();
    }

    // 2. Increment the clicks asynchronously (non-blocking)
    // Triggering the update in the background exactly as requested.
    (async () => {
        try {
            const { error: rpcError } = await supabase.rpc('increment_click_count', { row_id: link.id });
            if (rpcError) {
                // Fallback update
                await supabase.from('smart_links').update({ clicks: link.clicks + 1 }).eq('id', link.id);
            }
        } catch (e) {
            console.error('Background click track error', e);
        }
    })();

    // 3. Detect the device from the User-Agent
    const headersList = await headers();
    const userAgent = headersList.get('user-agent')?.toLowerCase() || "";
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMobile = isIOS || isAndroid;

    const targetUrl = link.target_url;
    let deepLink = ''; // Empty means "no deep link, go straight to web"

    // 4. Generate deep links — different strategy per platform.
    //
    // PRIMARY USE CASE: User taps link in Instagram bio on their phone.
    //   - iOS: Instagram uses SFSafariViewController → custom schemes (vnd.youtube://) work.
    //   - Android: Instagram uses Chrome Custom Tabs → intent:// with S.browser_fallback_url works.
    //   - Desktop: No deep link needed → instant redirect to web URL.
    //
    if (isMobile && link.platform === 'youtube') {
        const videoIdMatch = targetUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
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

    // 5. Return the smart redirect page.
    return (
        <html lang="en">
            <head>
                <title>Redirecting...</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <style dangerouslySetInnerHTML={{
                    __html: `
                        body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa; color: #333; }
                        .loader { border: 3px solid #f3f3f3; border-top: 3px solid #333; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin-right: 12px; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        .container { display: flex; align-items: center; }
                    `
                }} />
            </head>
            <body>
                <div className="container">
                    <div className="loader"></div>
                    <p>Opening app...</p>
                </div>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            var deepLink = ${JSON.stringify(deepLink)};
                            var targetUrl = ${JSON.stringify(targetUrl)};

                            if (!deepLink) {
                                // Desktop or unknown device: go to web URL immediately, no delay.
                                window.location.href = targetUrl;
                            } else {
                                // Mobile: attempt the deep link.
                                var appOpened = false;

                                // Track if the app actually opens (page goes to background).
                                document.addEventListener('visibilitychange', function() {
                                    if (document.hidden) appOpened = true;
                                });

                                // Navigate to the deep link.
                                // - iOS: vnd.youtube:// triggers the YouTube app via SFSafariViewController.
                                // - Android Chrome/Samsung/Instagram CCT: intent:// opens the app.
                                //   If app not installed, S.browser_fallback_url redirects automatically.
                                // - Android Brave: intent:// is blocked, page stays, setTimeout fires.
                                window.location.href = deepLink;

                                // Safety net: if nothing happened after 2s, redirect to web URL.
                                // This catches: Brave blocking intent://, app not installed on iOS,
                                // or any edge case where the deep link silently fails.
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
