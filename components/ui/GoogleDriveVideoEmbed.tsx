'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import {
  extractGoogleDriveId,
  getGoogleDriveEmbedUrl,
  getGoogleDriveThumbnailUrl,
  extractYoutubeId,
} from '@/lib/utils';

interface GoogleDriveVideoEmbedProps {
  videoUrl: string;
  title: string;
  thumbnailUrl?: string;
  autoplay?: boolean;
  className?: string;
}

export default function GoogleDriveVideoEmbed({
  videoUrl,
  title,
  thumbnailUrl: propThumbnailUrl,
  autoplay = false,
  className = '',
}: GoogleDriveVideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isLoading, setIsLoading] = useState(false);

  const driveId = extractGoogleDriveId(videoUrl);
  const youtubeId = extractYoutubeId(videoUrl);

  const embedUrl = driveId
    ? getGoogleDriveEmbedUrl(videoUrl)
    : youtubeId
      ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1`
      : videoUrl;

  const thumbnail =
    propThumbnailUrl ||
    (driveId ? getGoogleDriveThumbnailUrl(videoUrl) : null) ||
    (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null);

  useEffect(() => {
    setIsPlaying(autoplay);
  }, [autoplay, videoUrl]);

  const handlePlayClick = () => {
    setIsLoading(true);
    setIsPlaying(true);
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-navy-950 border border-slate-200 shadow-premium-lg transition-all duration-300 ${className}`}
      style={{ aspectRatio: '16/9' }}
    >
      {!isPlaying ? (
        <div
          className="group relative h-full w-full cursor-pointer overflow-hidden"
          onClick={handlePlayClick}
        >
          {/* Background Thumbnail */}
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105 group-hover:brightness-95"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-charcoal-900 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-400/30 flex items-center justify-center mb-3">
                <Play className="w-8 h-8 text-gold-400 fill-gold-400/20 ml-1" />
              </div>
              <p className="text-white font-serif text-lg font-medium max-w-xs">{title}</p>
            </div>
          )}

          {/* Ambient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/20 to-transparent group-hover:opacity-80 transition-opacity" />

          {/* Aesthetic Minimal Center Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Subtle Soft Glow Shadow */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-navy-950/80 hover:bg-white text-white hover:text-navy-950 backdrop-blur-md border border-white/30 shadow-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1 transition-transform group-hover:scale-105" />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-navy-950 z-10 text-gold-400">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs text-gold-200 font-sans tracking-wide">
                  Loading performance...
                </span>
              </div>
            </div>
          )}

          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-navy-950">
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

          {/* Top-Right Direct External Link Button */}
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Google Drive"
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-navy-950/80 hover:bg-navy-900 text-gold-300 hover:text-white border border-gold-400/30 backdrop-blur-md transition-all text-xs flex items-center gap-1.5 px-3"
          >
            <span>Drive</span> <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
