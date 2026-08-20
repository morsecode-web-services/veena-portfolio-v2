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
  return `Aishwarya Manikarnike Veena Academy
Cohort: ${performer.cohort || 'Vande Mataram'} — Hall of Fame

Celebrating ${performer.studentName}'s exceptional performance and musical dedication!

Instructor Feedback (Aishwarya Manikarnike):
"${mentorCommentText}"

Watch performance here:
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

/**
 * Generates a 1080×1920 PNG story card image as a File object.
 * Shared between StoryShareModal and HallOfFameCard mobile quick-share.
 */
export async function generateHofStoryFile(performer: HallOfFamer): Promise<File | null> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      const mentorCommentText =
        performer.mentorComment?.commentText ||
        performer.mentorPraise ||
        `${performer.studentName} has shown wonderful proficiency!`;
      const mentorAuthorName = performer.mentorComment?.authorName || 'Aishwarya Manikarnike';

      // Warm Ivory Background Gradient
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
      gradient.addColorStop(0, '#fdfbf7');
      gradient.addColorStop(0.5, '#f8f5ee');
      gradient.addColorStop(1, '#f1ede4');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Decorative Background Glow Circles
      ctx.fillStyle = 'rgba(217, 119, 6, 0.05)';
      ctx.beginPath();
      ctx.arc(900, 200, 450, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(225, 29, 72, 0.03)';
      ctx.beginPath();
      ctx.arc(100, 1600, 500, 0, Math.PI * 2);
      ctx.fill();

      // Outer Luxury Frame Border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 14;
      ctx.strokeRect(40, 40, 1000, 1840);
      // Gold Accent Inner Ring
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 2;
      ctx.strokeRect(56, 56, 968, 1808);

      // Header
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AISHWARIYA MANIKARNIKE VEENA ACADEMY', 540, 150);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`COHORT: ${(performer.cohort || 'VANDE MATARAM').toUpperCase()}`, 540, 200);

      // Student Name
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 64px Georgia, serif';
      ctx.fillText(performer.studentName, 540, 310);
      if (performer.location) {
        ctx.fillStyle = '#64748b';
        ctx.font = '32px sans-serif';
        ctx.fillText(performer.location, 540, 365);
      }

      // White Card Container
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;
      if (ctx.roundRect) {
        ctx.roundRect(100, 430, 880, 1280, 40);
      } else {
        ctx.fillRect(100, 430, 880, 1280);
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Student Description Box
      if (performer.studentDescription) {
        ctx.fillStyle = '#f8fafc';
        if (ctx.roundRect) {
          ctx.roundRect(140, 480, 800, 200, 24);
        } else {
          ctx.fillRect(140, 480, 800, 200);
        }
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.font = '34px sans-serif';
        ctx.textAlign = 'center';
        const words = performer.studentDescription.split(' ');
        let line = '';
        let y = 545;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          if (ctx.measureText(testLine).width > 720 && n > 0) {
            ctx.fillText(line, 540, y);
            line = words[n] + ' ';
            y += 48;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 540, y);
      }

      // Instructor Comment
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${mentorAuthorName}  ✓ Instructor`, 150, 780);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'italic 36px Georgia, serif';
      const commentWords = `"${mentorCommentText}"`.split(' ');
      let commentLine = '';
      let commentY = 850;
      for (let n = 0; n < commentWords.length; n++) {
        const testLine = commentLine + commentWords[n] + ' ';
        if (ctx.measureText(testLine).width > 760 && n > 0) {
          ctx.fillText(commentLine, 150, commentY);
          commentLine = commentWords[n] + ' ';
          commentY += 52;
        } else {
          commentLine = testLine;
        }
      }
      ctx.fillText(commentLine, 150, commentY);

      // Footer
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('aishwaryamanikarnike.com/hall-of-fame', 540, 1800);

      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const fileName = `${performer.studentName.replace(/\s+/g, '_')}_StoryCard.png`;
        resolve(new File([blob], fileName, { type: 'image/png' }));
      }, 'image/png');
    } catch (err) {
      console.error('Error rendering story card canvas:', err);
      resolve(null);
    }
  });
}
