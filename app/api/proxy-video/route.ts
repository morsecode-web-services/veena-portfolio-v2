import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const range = req.headers.get('range');
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    if (range) {
      headers['Range'] = range;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!res.ok && res.status !== 206) {
      return new NextResponse('Failed to fetch video', { status: res.status });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', res.headers.get('content-type') || 'video/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type');

    if (res.headers.get('content-range')) {
      responseHeaders.set('Content-Range', res.headers.get('content-range')!);
    }
    if (res.headers.get('content-length')) {
      responseHeaders.set('Content-Length', res.headers.get('content-length')!);
    }
    responseHeaders.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');

    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('Proxy video error:', err);
    return new NextResponse('Internal error proxying video', { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    },
  });
}
