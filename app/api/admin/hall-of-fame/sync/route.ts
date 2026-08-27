import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { uploadGoogleDriveVideoToCloudinary } from '@/lib/cloudinary';

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

export async function POST(request: Request) {
  try {
    const isAuth = await checkAdminAuth(request);
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin login required.' },
        { status: 401 }
      );
    }

    const { data: entries, error } = await supabaseAdmin.from('hall_of_fame').select('*');

    if (error) throw error;

    const results: Array<{ id: string; name: string; status: string; url: string }> = [];

    for (const entry of entries || []) {
      const url = entry.video_url || '';
      if (url.includes('drive.google.com') || url.includes('drive.usercontent.google.com')) {
        console.log(`[Sync] Uploading video for ${entry.student_name}...`);
        const cloudinaryRes = await uploadGoogleDriveVideoToCloudinary(url);
        if (cloudinaryRes?.secure_url) {
          await supabaseAdmin
            .from('hall_of_fame')
            .update({
              video_url: cloudinaryRes.secure_url,
              video_type: 'cloudinary',
              thumbnail_url: cloudinaryRes.secure_url
                .replace(/\.[^/.]+$/, '.jpg')
                .replace('/video/upload/', '/video/upload/so_0/'),
              updated_at: new Date().toISOString(),
            })
            .eq('id', entry.id);

          results.push({
            id: entry.id,
            name: entry.student_name,
            status: 'synced',
            url: cloudinaryRes.secure_url,
          });
        } else {
          results.push({
            id: entry.id,
            name: entry.student_name,
            status: 'failed',
            url,
          });
        }
      } else {
        results.push({
          id: entry.id,
          name: entry.student_name,
          status: 'already_synced_or_external',
          url,
        });
      }
    }

    return NextResponse.json({ success: true, count: results.length, results });
  } catch (err: any) {
    console.error('[Sync] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
