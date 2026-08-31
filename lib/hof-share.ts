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
    `Honored and excited to be featured in Aishwarya Manikarnike's Hall of Fame! 🌟`,
    '',
    `"${mentorCommentText}"`,
    '',
    `Watch my performance of ${cohort} here: ${shareUrl}`,
  ].join('\n');
}

export function getHofThumbnail(performer: HallOfFamer): string {
  if (performer.customThumbnailUrl) {
    return performer.customThumbnailUrl;
  }

  const isCloudinary = performer.videoUrl?.includes('cloudinary.com');
  if (isCloudinary) {
    return performer.videoUrl
      .replace(/\.[^/.]+$/, '.jpg')
      .replace('/video/upload/', '/video/upload/so_0/');
  }

  const youtubeId = extractYoutubeId(performer.videoUrl);
  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  const isGoogleDrive =
    performer.videoUrl?.includes('drive.google.com') ||
    performer.videoUrl?.includes('drive.usercontent.google.com');
  const driveId = extractGoogleDriveId(performer.videoUrl);
  if (isGoogleDrive && driveId) {
    return getGoogleDriveThumbnailUrl(performer.videoUrl) || '';
  }

  return '';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getProxiedUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const base =
    typeof window !== 'undefined' ? window.location.origin : 'https://www.aishwaryamanikarnike.com';
  return `${base}/api/proxy-image?url=${encodeURIComponent(url)}`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Captures a video frame from a video URL.
 * Checks in-page rendered video first, then uses a DOM-attached hidden video with proxied CORS.
 */
function captureVideoFrame(videoUrl: string): Promise<HTMLCanvasElement | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);

  // 1. Instant grab: Check if a <video> for this student is already rendered on the page in GoogleDriveVideoEmbed
  try {
    const renderedVideos = Array.from(document.querySelectorAll('video'));
    for (const v of renderedVideos) {
      if (
        (v.currentSrc?.includes(videoUrl) || v.src?.includes(videoUrl)) &&
        v.videoWidth > 0 &&
        v.videoHeight > 0
      ) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = v.videoWidth;
        offCanvas.height = v.videoHeight;
        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
          offCtx.drawImage(v, 0, 0, offCanvas.width, offCanvas.height);
          try {
            offCanvas.toDataURL(); // Verify not tainted
            return Promise.resolve(offCanvas);
          } catch {
            // Tainted due to direct origin without proxy, fall through to offscreen proxied video
          }
        }
      }
    }
  } catch {}

  // 2. Offscreen DOM-attached video with proxied CORS headers
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.autoplay = false;
    video.preload = 'auto';

    // Must be in DOM for iOS Safari and mobile Chrome to decode video frames
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.width = '2px';
    video.style.height = '2px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    document.body.appendChild(video);

    const proxyUrl = `/api/proxy-video?url=${encodeURIComponent(videoUrl)}`;
    video.src = proxyUrl;

    let hasResolved = false;
    const cleanUp = (result: HTMLCanvasElement | null) => {
      if (hasResolved) return;
      hasResolved = true;
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      } catch {}
      resolve(result);
    };

    // Timeout safety net (3.5s)
    const timer = setTimeout(() => {
      cleanUp(null);
    }, 3500);

    const grab = () => {
      try {
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;
        if (vw > 0 && vh > 0) {
          const offCanvas = document.createElement('canvas');
          offCanvas.width = vw;
          offCanvas.height = vh;
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.drawImage(video, 0, 0, vw, vh);
            clearTimeout(timer);
            cleanUp(offCanvas);
            return;
          }
        }
      } catch (err) {
        console.warn('[HOF Share] drawImage error:', err);
      }
      clearTimeout(timer);
      cleanUp(null);
    };

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
      } catch {
        grab();
      }
    };

    video.onseeked = () => {
      grab();
    };

    video.oncanplay = () => {
      if (video.currentTime >= 0.1) {
        grab();
      }
    };

    video.onerror = (e) => {
      console.warn('[HOF Share] Proxy video loading error:', e);
      clearTimeout(timer);
      cleanUp(null);
    };
  });
}

/**
 * Loads the thumbnail either from direct image (custom, cloudinary, youtube)
 * or captures a frame directly from Cloudflare R2 / video source.
 */
async function loadThumbnailOrFrame(
  performer: HallOfFamer
): Promise<HTMLImageElement | HTMLCanvasElement | null> {
  const isCloudinary = performer.videoUrl?.includes('cloudinary.com');
  const cloudinaryThumbnail = isCloudinary
    ? performer.videoUrl
        .replace(/\.[^/.]+$/, '.jpg')
        .replace('/video/upload/', '/video/upload/so_0/')
    : null;

  const youtubeId = extractYoutubeId(performer.videoUrl);
  const youtubeThumbnail = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : null;

  // 1. Direct thumbnail image (custom, cloudinary or youtube)
  const directImageSrc = performer.customThumbnailUrl || cloudinaryThumbnail || youtubeThumbnail;

  if (directImageSrc) {
    const proxiedUrl = getProxiedUrl(directImageSrc);
    const img = await loadImage(proxiedUrl);
    if (img) return img;
  }

  // 2. Capture video frame from Cloudflare R2 / mp4 / direct video
  if (performer.videoUrl) {
    const isVideo =
      performer.videoUrl.endsWith('.mp4') ||
      performer.videoUrl.includes('r2.dev') ||
      performer.videoUrl.includes('r2.cloudflarestorage.com') ||
      performer.videoType === 'r2';

    if (isVideo) {
      const frame = await captureVideoFrame(performer.videoUrl);
      if (frame) return frame;
    }
  }

  // 3. Fallback: load dynamic personalized card image
  if (performer.id) {
    const ogCard = await loadImage(`/api/og/hall-of-fame?entry=${performer.id}`);
    if (ogCard) return ogCard;
  }

  return null;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 6
): number {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(line.trim() + '...', x, curY);
        return curY + lineHeight;
      }
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

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
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
      const PAD = 56;
      const THUMB_H = 430; // Optimized thumbnail height to leave ample space for text

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

      // ── 1. Alabaster gradient background ──────────────────────────────
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(1, '#FAF9F6');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // ── Inset Gold Border Frame ──────────────────────────────────────────
      const borderInset = 20;
      ctx.strokeStyle = 'rgba(202, 138, 4, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(borderInset, borderInset, W - borderInset * 2, H - borderInset * 2, 16);
      } else {
        ctx.rect(borderInset, borderInset, W - borderInset * 2, H - borderInset * 2);
      }
      ctx.stroke();

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

      // Load thumbnail image or video frame
      const thumb = await loadThumbnailOrFrame(performer);
      if (thumb) {
        const width = (thumb as any).naturalWidth || thumb.width;
        const height = (thumb as any).naturalHeight || thumb.height;
        if (width > 0 && height > 0) {
          const ta = width / height;
          const ca = W / THUMB_H;
          let sx = 0,
            sy = 0,
            sw = width,
            sh = height;
          if (ta > ca) {
            sw = sh * ca;
            sx = (width - sw) / 2;
          } else {
            sh = sw / ca;
            sy = (height - sh) / 2;
          }
          ctx.drawImage(thumb, sx, sy, sw, sh, 0, 0, W, THUMB_H);
        }
      }

      // Subtle dark scrim on thumbnail
      const scrim = ctx.createLinearGradient(0, 0, 0, THUMB_H);
      scrim.addColorStop(0, 'rgba(0,0,0,0.05)');
      scrim.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, W, THUMB_H);

      // Cohort label — bottom-left of thumbnail
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      const cohortLabel = `COHORT: ${cohort.toUpperCase()}`;
      const labelW = ctx.measureText(cohortLabel).width + 32;
      const labelH = 38;
      const labelY = THUMB_H - 58;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(PAD, labelY, labelW, labelH, 19);
      } else {
        ctx.rect(PAD, labelY, labelW, labelH);
      }
      ctx.fill();

      // Thin gold cohort pill outline
      ctx.strokeStyle = 'rgba(202, 138, 4, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(cohortLabel, PAD + 16, labelY + labelH / 2);
      ctx.textBaseline = 'alphabetic'; // Reset baseline

      // ── 3. Body ──────────────────────────────────────────────────────────
      let y = THUMB_H + 52;

      // Student name (centered with stars on both sides)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 48px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(performer.studentName, W / 2, y);

      // Draw elegant small gold stars on left and right of the name
      const studentNameW = ctx.measureText(performer.studentName).width;
      ctx.fillStyle = '#ca8a04'; // Warm Gold
      drawStar(ctx, W / 2 - studentNameW / 2 - 24, y - 15, 5, 7, 3);
      drawStar(ctx, W / 2 + studentNameW / 2 + 24, y - 15, 5, 7, 3);

      // Location & Description (Issue #2 Fix: Wrapped cleanly without overflow)
      y += 28;
      if (performer.location) {
        ctx.fillStyle = '#b45309'; // Warm Amber
        ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(performer.location.toUpperCase(), W / 2, y);
        y += 24;
      }

      if (performer.studentDescription) {
        ctx.fillStyle = '#64748b';
        ctx.font = '500 19px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        // Wrap description cleanly within bounds, maximum 2 lines
        const descEndY = wrapText(
          ctx,
          performer.studentDescription.trim(),
          W / 2,
          y,
          W - PAD * 2 - 48,
          26,
          2
        );
        y = descEndY + 6;
      } else {
        y += 4;
      }

      // Gold gradient divider fading out at the edges
      y += 10;
      const dividerGrad = ctx.createLinearGradient(PAD + 30, 0, W - PAD - 30, 0);
      dividerGrad.addColorStop(0, 'rgba(202, 138, 4, 0)');
      dividerGrad.addColorStop(0.5, 'rgba(202, 138, 4, 0.7)');
      dividerGrad.addColorStop(1, 'rgba(202, 138, 4, 0)');

      ctx.strokeStyle = dividerGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PAD + 30, y);
      ctx.lineTo(W - PAD - 30, y);
      ctx.stroke();
      y += 32;

      // ── 4. Instructor Quote Box (Issue #3 & #4 Fix: Dynamic Sizing & Clean Border) ──
      const quoteStartY = y;

      // Dynamically calculate font size and line height based on quote length
      const quoteLen = mentorComment.trim().length;
      let quoteFontSize = 26;
      let quoteLineHeight = 38;
      if (quoteLen > 180) {
        quoteFontSize = 22;
        quoteLineHeight = 33;
      } else if (quoteLen > 120) {
        quoteFontSize = 24;
        quoteLineHeight = 35;
      }

      ctx.fillStyle = '#1e293b';
      ctx.font = `italic ${quoteFontSize}px "Playfair Display", Georgia, serif`;
      ctx.textAlign = 'left';

      // Draw quote with curly quotes
      const quoteEndY = wrapText(
        ctx,
        `\u201C${mentorComment.trim()}\u201D`,
        PAD + 22,
        quoteStartY,
        W - PAD * 2 - 28,
        quoteLineHeight,
        4
      );

      // Clean gold left accent border dynamically matching text height (Issue #4 fix)
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(PAD - 2, quoteStartY - quoteFontSize + 6);
      ctx.lineTo(PAD - 2, quoteEndY - 14);
      ctx.stroke();

      y = quoteEndY + 18;

      // Instructor attribution
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(`— ${mentorName}`, PAD, y);

      // Verified badge next to instructor name
      const nameW = ctx.measureText(`— ${mentorName}`).width;
      const badgeX = PAD + nameW + 14;
      const badgeY = y - 7;
      const badgeR = 9;
      ctx.fillStyle = '#ca8a04'; // Warm Gold verified badge
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓', badgeX, badgeY + 4);

      // Subtitle
      ctx.textAlign = 'left';
      y += 24;
      ctx.fillStyle = '#64748b';
      ctx.font = '17px system-ui, -apple-system, sans-serif';
      ctx.fillText('Instructor & Mentor', PAD, y);

      // ── 5. Fixed Bottom Zone (Issue #3 Fix: Zero overlap guaranteed) ──
      const starY = 1008;
      const BRAND_Y = 1042;

      // 3 Gold Stars
      ctx.fillStyle = '#ca8a04'; // Warm Gold
      drawStar(ctx, W / 2, starY, 5, 9, 4); // Center Star
      drawStar(ctx, W / 2 - 28, starY, 5, 6, 2.8); // Left Star
      drawStar(ctx, W / 2 + 28, starY, 5, 6, 2.8); // Right Star

      // Bottom branding URL
      ctx.fillStyle = '#64748b';
      ctx.font = '500 18px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('aishwaryamanikarnike.com/hall-of-fame', W / 2, BRAND_Y);

      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const name = `${performer.studentName.replace(/\s+/g, '_')}_HallOfFame.png`;
        resolve(new File([blob], name, { type: 'image/png' }));
      }, 'image/png');
    } catch (err) {
      console.error('[HOF Share] Error rendering story card:', err);
      resolve(null);
    }
  });
}
