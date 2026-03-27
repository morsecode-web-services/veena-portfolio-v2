import { NextResponse } from 'next/server';

export async function GET() {
    const metaToken = process.env.META_ACCESS_TOKEN;
    const instagramId = process.env.INSTAGRAM_BUSINESS_ID;
    const youtubeKey = process.env.YOUTUBE_API_KEY;
    const youtubeId = process.env.YOUTUBE_CHANNEL_ID;

    // Final Mock Data for fallback
    const MOCK_DATA = {
        isLive: false,
        trends: [
            { name: 'Mon', impressions: 4000, engagement: 2400, growth: 240 },
            { name: 'Tue', impressions: 3000, engagement: 1398, growth: 210 },
            { name: 'Wed', impressions: 2000, engagement: 9800, growth: 229 },
            { name: 'Thu', impressions: 2780, engagement: 3908, growth: 200 },
            { name: 'Fri', impressions: 1890, engagement: 4800, growth: 218 },
            { name: 'Sat', impressions: 2390, engagement: 3800, growth: 250 },
            { name: 'Sun', impressions: 3490, engagement: 4300, growth: 210 },
        ],
        stats: [
            { label: 'Total Reach', value: '45.2K', change: '+12.5%', isUp: true },
            { label: 'Avg. Engagement', value: '4.8%', change: '+0.4%', isUp: true },
            { label: 'New Followers', value: '1,280', change: '-2.1%', isUp: false },
            { label: 'Profile Views', value: '8.4K', change: '+15.2%', isUp: true },
        ],
        topPosts: [
            {
                id: '1',
                type: 'Reel',
                caption: 'Performing at the Royal Opera House was a dream come true! 🎻✨',
                likes: 1240,
                comments: 156,
                shares: 89,
                thumbnail: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop',
                date: '2026-03-20',
                platform: 'Instagram'
            },
            {
                id: '2',
                type: 'Video',
                caption: 'Behind the scenes: Preparing for the upcoming world tour.',
                likes: 850,
                comments: 42,
                shares: 12,
                thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
                date: '2026-03-18',
                platform: 'YouTube'
            }
        ]
    };

    const hasLiveKeys = metaToken && instagramId && youtubeKey && youtubeId;

    if (!hasLiveKeys) {
        return NextResponse.json(MOCK_DATA);
    }

    try {
        // 1. Fetch Instagram Data
        const igUrl = `https://graph.facebook.com/v19.0/${instagramId}?fields=followers_count,media.limit(5){caption,like_count,comments_count,media_type,timestamp,thumbnail_url,media_url}&access_token=${metaToken}`;
        const igResponse = await fetch(igUrl);
        const igData = await igResponse.json();

        // 2. Fetch YouTube Data
        const ytUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${youtubeId}&key=${youtubeKey}`;
        const ytResponse = await fetch(ytUrl);
        const ytData = await ytResponse.json();

        if (igData.error || ytData.error) {
            console.error("API Errors:", { ig: igData.error, yt: ytData.error });
            return NextResponse.json({ ...MOCK_DATA, isLive: false, error: "Access token might be expired or invalid." });
        }

        // Combine and Normalize
        const igFollowers = igData.followers_count || 0;
        const ytSubscribers = ytData.items?.[0]?.statistics?.subscriberCount || 0;

        const topPosts = [
            ...(igData.media?.data || []).map((m: any) => ({
                id: m.id,
                type: m.media_type,
                caption: m.caption,
                likes: m.like_count,
                comments: m.comments_count,
                thumbnail: m.thumbnail_url || m.media_url,
                date: new Date(m.timestamp).toLocaleDateString(),
                platform: 'Instagram'
            })),
            ...(ytData.items || []).map((i: any) => ({
                id: i.id,
                type: 'Channel',
                caption: i.snippet?.description,
                likes: 0,
                comments: 0,
                thumbnail: i.snippet?.thumbnails?.default?.url,
                date: 'Live',
                platform: 'YouTube'
            }))
        ].sort((a, b) => b.likes - a.likes).slice(0, 5);

        return NextResponse.json({
            isLive: true,
            stats: [
                { label: 'IG Followers', value: igFollowers.toLocaleString(), change: 'Live', isUp: true },
                { label: 'YT Subscribers', value: parseInt(ytSubscribers).toLocaleString(), change: 'Live', isUp: true },
                // Add more dynamic mapping here as needed
            ],
            topPosts,
            trends: MOCK_DATA.trends // Trends usually require historical storage or complex insight queries (period dependant)
        });

    } catch (error) {
        console.error("Error fetching live analytics:", error);
        return NextResponse.json(MOCK_DATA);
    }
}
