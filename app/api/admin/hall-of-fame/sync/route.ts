import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { uploadGoogleDriveVideoToR2, ensureThumbnailForVideo } from '@/lib/r2';

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

    const results: Array<{
      id: string;
      name: string;
      videoStatus: string;
      thumbnailUrl: string;
    }> = [];

    for (const entry of entries || []) {
      let finalVideoUrl = entry.video_url || '';
      let videoStatus = 'unchanged';

      // 1. Sync Google Drive video to Cloudflare R2 if not yet synced
      if (
        finalVideoUrl.includes('drive.google.com') ||
        finalVideoUrl.includes('drive.usercontent.google.com')
      ) {
        console.log(`[Sync] Uploading video to Cloudflare R2 for ${entry.student_name}...`);
        const r2Res = await uploadGoogleDriveVideoToR2(finalVideoUrl);
        if (r2Res?.publicUrl) {
          finalVideoUrl = r2Res.publicUrl;
          videoStatus = 'synced_to_r2';
        }
      }

      // 2. Ensure high-res static thumbnail (preserves custom thumbnails with 100% priority)
      const finalThumbUrl = await ensureThumbnailForVideo(
        finalVideoUrl || entry.video_url,
        entry.thumbnail_url
      );

      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (finalVideoUrl !== entry.video_url) {
        updates.video_url = finalVideoUrl;
        updates.video_type = 'r2';
      }

      if (finalThumbUrl && finalThumbUrl !== entry.thumbnail_url) {
        updates.thumbnail_url = finalThumbUrl;
      }

      if (Object.keys(updates).length > 1) {
        await supabaseAdmin.from('hall_of_fame').update(updates).eq('id', entry.id);
      }

      results.push({
        id: entry.id,
        name: entry.student_name,
        videoStatus,
        thumbnailUrl: finalThumbUrl || entry.thumbnail_url || '',
      });
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
