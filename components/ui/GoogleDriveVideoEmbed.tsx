'use client';

import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { extractGoogleDriveId, getGoogleDriveEmbedUrl, extractYoutubeId } from '@/lib/utils';

interface GoogleDriveVideoEmbedProps {
  videoUrl: string;
  title: string;
  thumbnailUrl?: string;
  autoplay?: boolean;
  className?: string;
  cohort?: string;
}

export default function GoogleDriveVideoEmbed({
  videoUrl,
  title,
  className = '',
  cohort,
}: GoogleDriveVideoEmbedProps) {
  const driveId = extractGoogleDriveId(videoUrl);
  const youtubeId = extractYoutubeId(videoUrl);

  const embedUrl = driveId
    ? getGoogleDriveEmbedUrl(videoUrl)
    : youtubeId
      ? `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`
      : videoUrl;

  return (
    <div
      className={`relative w-full overflow-hidden bg-navy-950 ${className}`}
      style={{ paddingTop: '56.25%' }} /* 16:9 Aspect Ratio */
    >
      {/* Styles to scale down Google Drive iframe and controls on mobile */}
      <style>{`
        @media (max-width: 767px) {
          .drive-iframe-mobile-scaled {
            width: 142.857% !important;
            height: calc(142.857% + 68.57px) !important;
            transform: scale(0.7) !important;
            transform-origin: top left !important;
            top: -68.57px !important;
          }
        }
      `}</style>

      {/* Cohort Pill overlay (pointer-events-none so click passes through to video) */}
      {cohort && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className="bg-navy-950/90 text-slate-100 text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider border border-navy-800 backdrop-blur-sm">
            Cohort: {cohort}
          </span>
        </div>
      )}

      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={title}
          className={`absolute left-0 border-0 ${
            driveId ? 'drive-iframe-mobile-scaled w-full' : 'w-full h-full top-0'
          }`}
          style={driveId ? { top: '-48px', height: 'calc(100% + 48px)' } : undefined}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-10 h-10 text-gold-400 mb-2" />
          <p className="text-slate-200 text-sm mb-4">Unable to embed video directly.</p>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-600 text-white text-xs font-semibold hover:bg-gold-700 transition-colors"
          >
            Open in Google Drive <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
