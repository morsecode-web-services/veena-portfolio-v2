import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { slug: string } }) {
    // Generate simple metadata to avoid caching issues and help with basic unfurling
    return {
        title: 'Redirecting...',
        robots: {
            index: false,
            follow: false
        }
    };
}

export default async function DeepLinkRedirect({ params }: { params: { slug: string } }) {
    const resolvedParams = await Promise.resolve(params);
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

    // 2. Increment the clicks asynchronously (don't await it so we don't slow down the redirect)
    supabase.rpc('increment_click_count_v2', { row_id: link.id }).then(({ error: rpcError }) => {
        if (rpcError) {
          // Fallback if the RPC isn't created, we just do a normal update 
          // (note: this is technically prone to race conditions, but good enough for simple metrics)
          supabase.from('smart_links').update({ clicks: link.clicks + 1 }).eq('id', link.id).then();
        }
    });

    // 3. Detect the device from the User-Agent
    const headersList = await headers();
    const userAgent = headersList.get('user-agent')?.toLowerCase() || "";
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    let targetUrl = link.target_url;
    let deepLink = targetUrl; // Default fallback

    // 4. Generate App Deep Links based on Platform
    if (link.platform === 'youtube') {
        const videoIdMatch = targetUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;

        if (videoId) {
            if (isIOS) deepLink = `vnd.youtube://watch?v=${videoId}`;
            else if (isAndroid) deepLink = `intent://www.youtube.com/watch?v=${videoId}#Intent;package=com.google.android.youtube;scheme=https;end;`;
        }
    } else if (link.platform === 'instagram') {
        if (isIOS) deepLink = targetUrl.replace('https://', 'instagram://').replace('http://', 'instagram://');
        else if (isAndroid) deepLink = `intent://${targetUrl.replace(/https?:\/\//, '')}#Intent;package=com.instagram.android;scheme=https;end;`;
    } else if (link.platform === 'twitter' || link.platform === 'x') {
        if (isIOS) deepLink = targetUrl.replace('https://', 'twitter://').replace('http://', 'twitter://');
        else if (isAndroid) deepLink = `intent://${targetUrl.replace(/https?:\/\//, '')}#Intent;package=com.twitter.android;scheme=https;end;`;
    }

    // 5. Return the smart HTML redirect page
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
                            var deepLink = "${deepLink}";
                            var targetUrl = "${targetUrl}";
                            
                            // Attempt to open the deep link
                            window.location.href = deepLink;

                            // If the deep link fails (app not installed), 
                            // fallback to the normal web URL after a slight delay.
                            setTimeout(function() {
                                window.location.href = targetUrl;
                            }, 1500);
                        `,
                    }}
                />
            </body>
        </html>
    );
}
