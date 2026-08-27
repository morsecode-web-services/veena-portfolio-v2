'use client';

import { HallOfFamer } from '@/types/hall-of-fame';
import { extractGoogleDriveId, getGoogleDriveThumbnailUrl, extractYoutubeId } from '@/lib/utils';

export function getHofShareUrl(performer: HallOfFamer): string {
  const base =
    typeof window !== 'undefined' ? window.location.origin : 'https://www.aishwaryamanikarnike.com';
  return `${base}/hall-of-fame?entry=${performer.id}`;
}

export function getHofShareText(performer: HallOfFamer): string {
  const mentorCommentText =
    performer.mentorComment?.commentText ||
    performer.mentorPraise ||
    `${performer.studentName} has shown wonderful proficiency!`;
  const shareUrl = getHofShareUrl(performer);
  const cohort = performer.cohort || 'Vande Mataram';
  return [
    `*${performer.studentName}* — Cohort: ${cohort}`,
    '',
    `"${mentorCommentText}"`,
    '',
    `Watch the full performance: ${shareUrl}`,
  ].join('\n');
}

export function getHofThumbnail(performer: HallOfFamer): string {
  const driveId = extractGoogleDriveId(performer.videoUrl);
  const youtubeId = extractYoutubeId(performer.videoUrl);
  return (
    performer.customThumbnailUrl ||
    (driveId ? getGoogleDriveThumbnailUrl(performer.videoUrl) : null) ||
    (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null) ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[i] + ' ';
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, curY);
    curY += lineHeight;
  }
  return curY;
}

/**
 * Generates a minimal, professional 1080x1080 (1:1) share image.
 * White background — video thumbnail, student name, instructor quote, branding.
 */
export async function generateHofStoryFile(performer: HallOfFamer): Promise<File | null> {
  // Preload a premium serif font
  try {
    if (typeof window !== 'undefined' && 'fonts' in document) {
      const font = new FontFace(
        'Playfair Display',
        'url(https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZcOC_1wvyG79a259K8dGrYB87NfkLNgn5v2.woff2)'
      );
      await font.load();
      document.fonts.add(font);
    }
  } catch (e) {
    console.warn('Font load failed:', e);
  }

  return new Promise(async (resolve) => {
    try {
      // 1:1 Square - highly compatible and readable
      const W = 1080;
      const H = 1080;
      const PAD = 64;
      const THUMB_H = 480;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      const mentorComment =
        performer.mentorComment?.commentText ||
        performer.mentorPraise ||
        `${performer.studentName} has shown wonderful proficiency!`;
      const mentorName = performer.mentorComment?.authorName || 'Aishwarya Manikarnike';
      const cohort = performer.cohort || 'Vande Mataram';
      const thumbnailSrc = getHofThumbnail(performer);

      // Helper to proxy images to avoid canvas CORS pollution
      const getProxiedUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('/') || url.startsWith('data:')) return url;
        const base =
          typeof window !== 'undefined'
            ? window.location.origin
            : 'https://www.aishwaryamanikarnike.com';
        return `${base}/api/proxy-image?url=${encodeURIComponent(url)}`;
      };

      // ── 1. White background ──────────────────────────────────────────────
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // ── 2. Video thumbnail area with fallback pattern ──────────────────
      const thumbGrad = ctx.createLinearGradient(0, 0, W, THUMB_H);
      thumbGrad.addColorStop(0, '#0b0f19');
      thumbGrad.addColorStop(0.5, '#1e293b');
      thumbGrad.addColorStop(1, '#0b0f19');
      ctx.fillStyle = thumbGrad;
      ctx.fillRect(0, 0, W, THUMB_H);

      // Draw subtle abstract soundwaves/grid on fallback background
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 2;
      for (let i = 0; i < W; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, THUMB_H);
        ctx.stroke();
      }

      // Load proxied thumbnail
      const proxiedThumbnail = getProxiedUrl(thumbnailSrc);
      const thumb = await loadImage(proxiedThumbnail);
      if (thumb) {
        const ta = thumb.naturalWidth / thumb.naturalHeight;
        const ca = W / THUMB_H;
        let sx = 0,
          sy = 0,
          sw = thumb.naturalWidth,
          sh = thumb.naturalHeight;
        if (ta > ca) {
          sw = sh * ca;
          sx = (thumb.naturalWidth - sw) / 2;
        } else {
          sh = sw / ca;
          sy = (thumb.naturalHeight - sh) / 2;
        }
        ctx.drawImage(thumb, sx, sy, sw, sh, 0, 0, W, THUMB_H);
      }

      // Subtle dark scrim on thumbnail
      const scrim = ctx.createLinearGradient(0, 0, 0, THUMB_H);
      scrim.addColorStop(0, 'rgba(0,0,0,0.05)');
      scrim.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, W, THUMB_H);

      // Cohort label — bottom-left of thumbnail
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      const cohortLabel = `COHORT: ${cohort.toUpperCase()}`;
      const labelW = ctx.measureText(cohortLabel).width + 36;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(PAD, THUMB_H - 64, labelW, 40, 20);
      } else {
        ctx.rect(PAD, THUMB_H - 64, labelW, 40);
      }
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(cohortLabel, PAD + 18, THUMB_H - 37);

      // ── 3. Body — white ──────────────────────────────────────────────────
      let y = THUMB_H + 54;

      // Student name (using Playfair Display / Georgia)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 64px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText(performer.studentName, PAD, y);

      // Location + cohort meta row
      y += 36;
      ctx.fillStyle = '#64748b';
      ctx.font = '500 26px system-ui, -apple-system, sans-serif';
      const meta = [performer.location, performer.studentDescription].filter(Boolean).join('  ·  ');
      if (meta) {
        ctx.fillText(meta, PAD, y);
        y += 24;
      }

      // Thin divider
      y += 16;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(W - PAD, y);
      ctx.stroke();
      y += 52;

      // Instructor quote (with curly quotes)
      ctx.fillStyle = '#1e293b';
      ctx.font = 'italic 30px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'left';
      y = wrapText(ctx, `\u201C${mentorComment.trim()}\u201D`, PAD, y, W - PAD * 2, 46);
      y += 24;

      // Instructor attribution
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.fillText(`— ${mentorName}`, PAD, y);
      y += 34;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px system-ui, -apple-system, sans-serif';
      ctx.fillText('Instructor, Aishwarya Manikarnike Veena Academy', PAD, y);

      // ── 4. Bottom branding ────────────────────────────────────────────────
      const BRAND_Y = H - 44;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('aishwaryamanikarnike.com/hall-of-fame', W / 2, BRAND_Y);

      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const name = `${performer.studentName.replace(/\s+/g, '_')}_HallOfFame.png`;
        resolve(new File([blob], name, { type: 'image/png' }));
      }, 'image/png');
    } catch (err) {
      console.error('Error rendering story card:', err);
      resolve(null);
    }
  });
}
