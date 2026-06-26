import { NextResponse } from 'next/server';
export const dynamic = 'force-static';
import { extractYoutubeId } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const videoId = extractYoutubeId(url);

    if (!videoId) {
      throw new Error('Could not extract Video ID from URL');
    }

    let title = `Performance - ${videoId}`;
    let thumbnail_url = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    try {
      // Fetch OEmbed data from YouTube with headers
      const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      console.log('Fetching YouTube oEmbed:', oEmbedUrl);

      const response = await fetch(oEmbedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (response.ok) {
        const data = await response.json();
        title = data.title;
      } else {
        console.warn('YouTube oEmbed failed, using fallback:', response.status);
      }
    } catch (e) {
      console.error('oEmbed fetch error:', e);
      // Fallback to extraction-only if fetch completely fails
    }

    const newVideoMetadata = {
      title,
      thumbnail_url,
      url,
    };

    return NextResponse.json(newVideoMetadata);
  } catch (error: any) {
    console.error('Video sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
