import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_BUCKETS = new Set(['hall-of-fame', 'events', 'blog-assets']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

async function checkAdminAuth(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (!authError && user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile && (profile.role === 'admin' || profile.role === 'editor')) {
        return true;
      }
    }
  }

  try {
    const serverSupabase = await createClient();
    const {
      data: { session },
    } = await serverSupabase.auth.getSession();
    if (session) return true;
  } catch (err) {
    console.warn('Server session check failed:', err);
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const isAuth = await checkAdminAuth(req);
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin login required.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const requestedBucket = (formData.get('bucket') as string) || 'hall-of-fame';
    const bucket = ALLOWED_BUCKETS.has(requestedBucket) ? requestedBucket : 'hall-of-fame';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Size limit check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum allowed 5MB limit.' },
        { status: 413 }
      );
    }

    // MIME type validation
    const mimeType = file.type || 'image/jpeg';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.',
        },
        { status: 400 }
      );
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    // Reject dangerous extensions
    if (fileExt === 'svg' || fileExt === 'html' || fileExt === 'htm' || fileExt === 'exe') {
      return NextResponse.json(
        { success: false, error: 'Prohibited file extension.' },
        { status: 400 }
      );
    }

    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Ensure bucket exists in storage
    try {
      await supabaseAdmin.storage.createBucket(bucket, { public: true });
    } catch {}

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[Admin Upload API] Storage upload error:', uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json({ success: true, publicUrl });
  } catch (err: any) {
    console.error('[Admin Upload API] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
