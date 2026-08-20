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

  return `🏆 *${performer.studentName}* has been featured in the *Veena Academy Hall of Fame* — Cohort: ${cohort}!

_"${mentorCommentText}"_

So proud of ${performer.studentName.split(' ')[0]} 🙏 Watch the full performance 👇
${shareUrl}`;
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

// ─── Canvas helpers ─────────────────────────────────────────────────────────

function resetShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign = 'left'
): number {
  ctx.textAlign = align;
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' ';
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, curY);
  return curY + lineHeight;
}

/**
 * Generates a premium 1080×1920 PNG Hall of Fame story card.
 * Dark navy background with gold accents — award ceremony aesthetic.
 */
export async function generateHofStoryFile(performer: HallOfFamer): Promise<File | null> {
  return new Promise((resolve) => {
    try {
      const W = 1080;
      const H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      const mentorCommentText =
        performer.mentorComment?.commentText ||
        performer.mentorPraise ||
        `${performer.studentName} has shown wonderful proficiency!`;
      const mentorAuthorName = performer.mentorComment?.authorName || 'Aishwarya Manikarnike';
      const cohort = performer.cohort || 'Vande Mataram';

      // ── 1. Rich dark background gradient ──────────────────────────────
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#0b1120');
      bg.addColorStop(0.45, '#0f1a2e');
      bg.addColorStop(1, '#080d1a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── 2. Subtle radial gold glow top-right ─────────────────────────
      const glowTR = ctx.createRadialGradient(W, 0, 80, W * 0.7, 0, 600);
      glowTR.addColorStop(0, 'rgba(184,134,11,0.22)');
      glowTR.addColorStop(1, 'rgba(184,134,11,0)');
      ctx.fillStyle = glowTR;
      ctx.fillRect(0, 0, W, H);

      // Radial glow bottom-left
      const glowBL = ctx.createRadialGradient(0, H, 60, 200, H - 300, 500);
      glowBL.addColorStop(0, 'rgba(139,92,246,0.12)');
      glowBL.addColorStop(1, 'rgba(139,92,246,0)');
      ctx.fillStyle = glowBL;
      ctx.fillRect(0, 0, W, H);

      // ── 3. Outer gold double border ───────────────────────────────────
      // Outer thin border
      ctx.strokeStyle = 'rgba(184,134,11,0.35)';
      ctx.lineWidth = 2;
      roundRect(ctx, 28, 28, W - 56, H - 56, 24);
      ctx.stroke();
      // Inner gold border
      ctx.strokeStyle = 'rgba(184,134,11,0.6)';
      ctx.lineWidth = 1;
      roundRect(ctx, 44, 44, W - 88, H - 88, 18);
      ctx.stroke();

      // ── 4. Top badge: "HALL OF FAME" ──────────────────────────────────
      resetShadow(ctx);
      const badgeY = 140;
      const badgeW = 480;
      const badgeH = 68;
      const badgeX = (W - badgeW) / 2;

      // Badge background
      const badgeBg = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
      badgeBg.addColorStop(0, '#b8860b');
      badgeBg.addColorStop(0.5, '#d4a017');
      badgeBg.addColorStop(1, '#b8860b');
      ctx.fillStyle = badgeBg;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 34);
      ctx.fill();

      ctx.fillStyle = '#0b1120';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '3px';
      ctx.fillText('✦  HALL OF FAME  ✦', W / 2, badgeY + 43);
      ctx.letterSpacing = '0px';

      // ── 5. Academy name ────────────────────────────────────────────────
      resetShadow(ctx);
      ctx.fillStyle = 'rgba(212,160,23,0.8)';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AISHWARYA MANIKARNIKE VEENA ACADEMY', W / 2, 264);

      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Cohort: ${cohort.toUpperCase()}`, W / 2, 300);

      // ── 6. Gold divider line ───────────────────────────────────────────
      const divGrad = ctx.createLinearGradient(200, 0, 880, 0);
      divGrad.addColorStop(0, 'transparent');
      divGrad.addColorStop(0.3, 'rgba(184,134,11,0.7)');
      divGrad.addColorStop(0.7, 'rgba(184,134,11,0.7)');
      divGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = divGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(200, 328);
      ctx.lineTo(880, 328);
      ctx.stroke();

      // ── 7. Student name (large, hero) ─────────────────────────────────
      resetShadow(ctx);
      ctx.shadowColor = 'rgba(212,160,23,0.4)';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 88px Georgia, serif';
      ctx.textAlign = 'center';

      // If name is long, split into two lines
      const nameParts = performer.studentName.split(' ');
      if (nameParts.length >= 2 && ctx.measureText(performer.studentName).width > 860) {
        const mid = Math.ceil(nameParts.length / 2);
        ctx.fillText(nameParts.slice(0, mid).join(' '), W / 2, 430);
        ctx.fillText(nameParts.slice(mid).join(' '), W / 2, 530);
      } else {
        ctx.fillText(performer.studentName, W / 2, 470);
      }
      resetShadow(ctx);

      // Location tag
      if (performer.location) {
        ctx.fillStyle = 'rgba(148,163,184,0.9)';
        ctx.font = '30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`📍 ${performer.location}`, W / 2, 550);
      }

      // ── 8. Gold star row ───────────────────────────────────────────────
      const stars = '★  ★  ★  ★  ★';
      ctx.fillStyle = '#d4a017';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stars, W / 2, 622);

      // ── 9. Instructor quote card ──────────────────────────────────────
      const cardX = 72;
      const cardY = 680;
      const cardW = W - 144;
      const cardH = 680;

      // Card shadow
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 20;
      ctx.fillStyle = '#111827';
      roundRect(ctx, cardX, cardY, cardW, cardH, 32);
      ctx.fill();
      resetShadow(ctx);

      // Card border with gold top accent
      ctx.strokeStyle = 'rgba(184,134,11,0.4)';
      ctx.lineWidth = 1;
      roundRect(ctx, cardX, cardY, cardW, cardH, 32);
      ctx.stroke();

      // Gold left accent bar
      const accentGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
      accentGrad.addColorStop(0, '#d4a017');
      accentGrad.addColorStop(0.5, '#b8860b');
      accentGrad.addColorStop(1, 'rgba(184,134,11,0)');
      ctx.fillStyle = accentGrad;
      roundRect(ctx, cardX, cardY, 6, cardH, 3);
      ctx.fill();

      // Big decorative quote mark
      ctx.fillStyle = 'rgba(212,160,23,0.12)';
      ctx.font = 'bold 280px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText('\u201C', cardX + 28, cardY + 220);
      resetShadow(ctx);

      // Instructor label
      ctx.fillStyle = '#d4a017';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('INSTRUCTOR RECOGNITION', cardX + 48, cardY + 68);

      // Divider under label
      ctx.strokeStyle = 'rgba(184,134,11,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + 48, cardY + 84);
      ctx.lineTo(cardX + cardW - 48, cardY + 84);
      ctx.stroke();

      // Instructor name + verified badge
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(`${mentorAuthorName}`, cardX + 48, cardY + 136);
      ctx.fillStyle = '#d4a017';
      ctx.font = '26px sans-serif';
      ctx.fillText('✓  Verified Instructor', cardX + 48, cardY + 178);

      // Comment text (wrap nicely)
      ctx.fillStyle = 'rgba(226,232,240,0.95)';
      ctx.font = 'italic 34px Georgia, serif';
      const commentY = wrapText(
        ctx,
        `"${mentorCommentText}"`,
        cardX + 48,
        cardY + 250,
        cardW - 96,
        52,
        'left'
      );
      void commentY;

      // ── 10. Description / achievement strip ───────────────────────────
      if (performer.studentDescription) {
        const stripY = cardY + cardH + 40;
        ctx.fillStyle = 'rgba(212,160,23,0.08)';
        roundRect(ctx, cardX, stripY, cardW, 160, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(184,134,11,0.2)';
        ctx.lineWidth = 1;
        roundRect(ctx, cardX, stripY, cardW, 160, 20);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148,163,184,0.8)';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ABOUT THIS PERFORMANCE', W / 2, stripY + 44);

        ctx.fillStyle = 'rgba(226,232,240,0.9)';
        ctx.font = '28px sans-serif';
        wrapText(ctx, performer.studentDescription, W / 2, stripY + 90, cardW - 80, 42, 'center');
      }

      // ── 11. Bottom CTA strip ──────────────────────────────────────────
      const ctaY = H - 200;
      const ctaGrad = ctx.createLinearGradient(0, ctaY, 0, H);
      ctaGrad.addColorStop(0, 'rgba(11,17,32,0)');
      ctaGrad.addColorStop(0.3, 'rgba(11,17,32,0.95)');
      ctaGrad.addColorStop(1, '#080d1a');
      ctx.fillStyle = ctaGrad;
      ctx.fillRect(0, ctaY, W, H - ctaY);

      resetShadow(ctx);
      ctx.fillStyle = 'rgba(212,160,23,0.9)';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WATCH THE FULL PERFORMANCE AT', W / 2, H - 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('aishwaryamanikarnike.com/hall-of-fame', W / 2, H - 64);

      // ── 12. Corner diamond ornaments ──────────────────────────────────
      const diamond = (x: number, y: number) => {
        ctx.fillStyle = 'rgba(184,134,11,0.5)';
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('◆', x, y);
      };
      diamond(80, 80);
      diamond(W - 80, 80);
      diamond(80, H - 50);
      diamond(W - 80, H - 50);

      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const fileName = `${performer.studentName.replace(/\s+/g, '_')}_HallOfFame.png`;
        resolve(new File([blob], fileName, { type: 'image/png' }));
      }, 'image/png');
    } catch (err) {
      console.error('Error rendering story card canvas:', err);
      resolve(null);
    }
  });
}
