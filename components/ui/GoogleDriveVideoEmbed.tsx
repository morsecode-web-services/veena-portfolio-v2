'use client';

import React from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { useVideo } from '@/context/VideoContext';
import { extractGoogleDriveId, getGoogleDriveThumbnailUrl, extractYoutubeId } from '@/lib/utils';

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
  thumbnailUrl: propThumbnailUrl,
  className = '',
  cohort,
}: GoogleDriveVideoEmbedProps) {
  const { openVideo } = useVideo();
  const driveId = extractGoogleDriveId(videoUrl);
  const youtubeId = extractYoutubeId(videoUrl);

  const isCloudinary = videoUrl.includes('cloudinary.com');
  const cloudinaryThumbnail = isCloudinary
    ? videoUrl.replace(/\.[^/.]+$/, '.jpg').replace('/video/upload/', '/video/upload/so_0/')
    : null;

  const thumbnail =
    propThumbnailUrl ||
    cloudinaryThumbnail ||
    (driveId ? getGoogleDriveThumbnailUrl(videoUrl) : null) ||
    (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null);

  const handlePlayClick = () => {
    openVideo(videoUrl, title);
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-navy-950 group/video ${className}`}
      style={{ paddingTop: '56.25%' }} /* 16:9 Aspect Ratio */
    >
      {/* Cohort Pill overlay (pointer-events-none so click passes through to video button) */}
      {cohort && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <span className="bg-navy-950/90 text-slate-100 text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider border border-navy-800 backdrop-blur-sm">
            Cohort: {cohort}
          </span>
        </div>
      )}

      <button
        onClick={handlePlayClick}
        className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer z-10 focus:outline-none border-0"
        aria-label={`Play performance of ${title}`}
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover group-hover/video:scale-105 transition-transform duration-700 opacity-90 group-hover/video:opacity-100"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 flex flex-col items-center justify-center">
            <p className="text-white/80 font-serif text-sm font-medium text-center px-4 mb-2">
              {title}
            </p>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-navy-950/10 to-transparent group-hover/video:from-navy-950/80 transition-all duration-300" />

        {/* Premium Play Button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-navy-950/70 border border-white/25 backdrop-blur-sm shadow-2xl flex items-center justify-center transition-all duration-300 group-hover/video:scale-110 group-hover/video:bg-white group-hover/video:border-white/60 active:scale-95">
            <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-white group-hover/video:text-navy-950 group-hover/video:fill-navy-950 ml-0.5 transition-colors" />
          </span>
        </div>
      </button>
    </div>
  );
}
