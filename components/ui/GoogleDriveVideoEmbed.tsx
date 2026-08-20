'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Play, ExternalLink, AlertCircle, Loader2, X } from 'lucide-react';
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
  const [iframeReady, setIframeReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const driveId = extractGoogleDriveId(videoUrl);
  const youtubeId = extractYoutubeId(videoUrl);

  const embedUrl = driveId
    ? getGoogleDriveEmbedUrl(videoUrl)
    : youtubeId
      ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`
      : videoUrl;

  const thumbnail =
    propThumbnailUrl ||
    (driveId ? getGoogleDriveThumbnailUrl(videoUrl) : null) ||
    (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null);

  useEffect(() => {
    setIsPlaying(autoplay);
    setIframeReady(false);
  }, [autoplay, videoUrl]);

  const handlePlayClick = () => {
    setIsLoading(true);
    setIframeReady(false);
    setIsPlaying(true);
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(false);
    setIframeReady(false);
    setIsLoading(false);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setIframeReady(true);
  };

  return (
    /*
     * Single stable container — always 16/9.
     * Both thumbnail and iframe live inside this same box;
     * we fade between them without any DOM size change.
     */
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-navy-950 ${className}`}
      style={{ paddingTop: '56.25%' /* 16:9 = 9/16 * 100 */ }}
    >
      {/* ── Thumbnail / Play State ───────────────────────────── */}
      <div
        className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${
          isPlaying && iframeReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* Background thumbnail or gradient placeholder */}
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-charcoal-900 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-400/30 flex items-center justify-center mb-3">
              <Play className="w-8 h-8 text-gold-400 fill-gold-400/20 ml-1" />
            </div>
            <p className="text-white font-serif text-sm font-medium text-center px-4">{title}</p>
          </div>
        )}

        {/* Ambient gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/10 to-transparent" />

        {/* Center Play Button */}
        {!isPlaying && (
          <button
            onClick={handlePlayClick}
            aria-label={`Play ${title}`}
            className="absolute inset-0 flex items-center justify-center group"
          >
            <span className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-navy-950/70 border border-white/25 backdrop-blur-sm shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-white group-hover:border-white/60">
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-white group-hover:text-navy-950 group-hover:fill-navy-950 ml-0.5 transition-colors" />
            </span>
          </button>
        )}

        {/* Loading spinner overlay — shown between click and iframe ready */}
        {isPlaying && !iframeReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-950/90 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-gold-400 mb-2" />
            <span className="text-xs text-gold-200 font-sans tracking-wide">
              Loading performance...
            </span>
          </div>
        )}
      </div>

      {/* ── Iframe / Playing State ───────────────────────────── */}
      {isPlaying && (
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            iframeReady ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title}
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              onLoad={handleIframeLoad}
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

          {/* Controls bar: Close + Open External */}
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 z-20">
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open in Drive
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
