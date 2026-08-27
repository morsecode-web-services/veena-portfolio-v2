import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('id');
  if (!fileId || !/^[a-zA-Z0-9_-]{10,100}$/.test(fileId)) {
    return new NextResponse('Invalid or missing video ID', { status: 400 });
  }

  const range = req.headers.get('range') || 'bytes=0-';
  const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  try {
    const res = await fetch(driveUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Range: range,
      },
      redirect: 'follow',
    });

    if (!res.ok && res.status !== 206) {
      return new NextResponse('Failed to stream video from Google Drive', { status: res.status });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', res.headers.get('content-type') || 'video/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');
    if (res.headers.get('content-range')) {
      responseHeaders.set('Content-Range', res.headers.get('content-range')!);
    }
    if (res.headers.get('content-length')) {
      responseHeaders.set('Content-Length', res.headers.get('content-length')!);
    }
    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('Video stream error:', err);
    return new NextResponse('Internal error streaming video', { status: 500 });
  }
}
