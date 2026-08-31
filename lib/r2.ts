import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { extractGoogleDriveId } from './utils';
import { supabaseAdmin } from './supabase-admin';

// Helper to instantiate the S3 client for Cloudflare R2
export function getR2Client(): S3Client | null {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn('[Cloudflare R2] Missing R2 credentials in environment variables.');
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Ensures a high-resolution static thumbnail exists for a performance video.
 * Gives 100% top preference to custom uploaded thumbnails.
 * If no custom thumbnail exists, extracts and permanently saves a 1200px snapshot.
 */
export async function ensureThumbnailForVideo(
  videoUrl: string,
  currentThumbnailUrl?: string | null
): Promise<string> {
  // 1. Top Preference: If custom thumbnail already provided, keep it untouched
  if (currentThumbnailUrl && currentThumbnailUrl.trim() !== '') {
    return currentThumbnailUrl;
  }

  if (!videoUrl) return '';

  // Extract Drive ID from Drive URL or from R2 filename (e.g. 1jr8ysnHaa3J0j2WQq3BuamQ8Z44t_AuW.mp4)
  let driveId = extractGoogleDriveId(videoUrl);
  if (!driveId) {
    const match = videoUrl.match(/([a-zA-Z0-9_-]{25,})\.mp4/);
    if (match) {
      driveId = match[1];
    }
  }

  if (!driveId) {
    return '';
  }

  try {
    const thumbUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;
    console.log(`[Thumbnail] Fetching high-res snapshot for Drive ID: ${driveId}...`);
    const thumbRes = await fetch(thumbUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!thumbRes.ok) {
      console.warn(
        `[Thumbnail] Could not fetch thumbnail from source for ${driveId}: status ${thumbRes.status}`
      );
      return '';
    }

    const arrayBuffer = await thumbRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${driveId}_thumb.jpg`;

    // Ensure bucket exists in Supabase storage
    try {
      await supabaseAdmin.storage.createBucket('hall-of-fame', { public: true });
    } catch {}

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('hall-of-fame')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadErr) {
      console.warn('[Thumbnail] Supabase upload failed:', uploadErr);
      return '';
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('hall-of-fame').getPublicUrl(fileName);

    console.log(`[Thumbnail] Auto-generated and stored permanent thumbnail: ${publicUrl}`);
    return publicUrl;
  } catch (err: any) {
    console.warn('[Thumbnail] Error ensuring thumbnail:', err.message || err);
    return '';
  }
}

/**
 * Downloads a video from Google Drive and uploads it directly to Cloudflare R2.
 * Cloudflare R2 offers $0 egress bandwidth and supports high-capacity streaming for videos of any size.
 */
export async function uploadGoogleDriveVideoToR2(
  videoUrl: string,
  bucketName = process.env.CLOUDFLARE_R2_HOF_BUCKET_NAME || 'hall-of-fame'
): Promise<{ success: boolean; publicUrl: string; key: string } | null> {
  const s3 = getR2Client();
  if (!s3) {
    console.error('[Cloudflare R2] S3 Client could not be initialized.');
    return null;
  }

  const driveId = extractGoogleDriveId(videoUrl);
  if (!driveId) {
    console.warn('[Cloudflare R2] Invalid Google Drive URL:', videoUrl);
    return null;
  }

  const publicBaseUrl = (
    process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-d9021a0d3d744e8689694598df1d999f.r2.dev'
  ).replace(/\/$/, '');

  const key = `${driveId}.mp4`;
  const downloadUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`;

  try {
    console.log(`[Cloudflare R2] Fetching video from Google Drive (ID: ${driveId})...`);
    const driveRes = await fetch(downloadUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!driveRes.ok) {
      console.error(`[Cloudflare R2] Google Drive download failed with status ${driveRes.status}`);
      return null;
    }

    const contentType = driveRes.headers.get('content-type') || 'video/mp4';
    const arrayBuffer = await driveRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(
      `[Cloudflare R2] Uploading video to R2 (Bucket: ${bucketName}, Key: ${key}, Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`
    );

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const publicUrl = `${publicBaseUrl}/${key}`;
    console.log(`[Cloudflare R2] Video uploaded successfully: ${publicUrl}`);

    return {
      success: true,
      publicUrl,
      key,
    };
  } catch (err: any) {
    console.error('[Cloudflare R2] Upload error:', err.message || err);
    return null;
  }
}
