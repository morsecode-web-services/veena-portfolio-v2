'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoEmbedProps {
  src: string;
  title: string;
  className?: string;
  retryCount?: number;
}

const extractVideoId = (url: string): string | null => {
  // Extract YouTube video ID from various URL formats
  const patterns = [
    /(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/|youtube\.com\/shorts\/)([^&?/]+)/,
    /youtube\.com\/v\/([^&?/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};


/**
 * Video embed component with error handling and retry logic
 * Handles failed video loads gracefully with fallback UI
 */
export default function VideoEmbed({
  src,
  title,
  className = '',
  retryCount = 2,
}: VideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [videoSrc, setVideoSrc] = useState(src);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    // Try to extract YouTube video ID and convert to embed URL
    const extractedId = extractVideoId(src);
    setVideoId(extractedId);

    if (extractedId) {
      // Preserve query parameters if they exist (except v=...)
      const urlObj = new URL(src);
      const searchParams = new URLSearchParams(urlObj.search);
      searchParams.delete('v');

      const queryStr = searchParams.toString();
      // Add autoplay=1 to the embed URL for when it loads after click
      const embedUrl = `https://www.youtube.com/embed/${extractedId}?autoplay=1${queryStr ? `&${queryStr}` : ''}`;
      setVideoSrc(embedUrl);
      // Default to hqdefault (Standard Quality) avoids 404s on older videos
      // maxresdefault often fails, causing console noise even with fallback logic
      setThumbnailUrl(`https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`);
    } else {
      setVideoSrc(src);
      setThumbnailUrl(null);
    }

    setHasError(false);
    setAttempts(0);
    setIsPlaying(false);
  }, [src]);

  const handleThumbnailError = () => {
    // Fallback to hqdefault if maxresdefault fails (404)
    if (thumbnailUrl && thumbnailUrl.includes('maxresdefault') && videoId) {
      setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    }
  };

  const handleRetry = () => {
    if (attempts < retryCount) {
      setIsRetrying(true);
      setAttempts(prev => prev + 1);

      setTimeout(() => {
        setVideoSrc(`${src}${src.includes('?') ? '&' : '?'}retry=${attempts + 1}`);
        setHasError(false);
        setIsRetrying(false);
      }, 1000);
    }
  };

  const handleIframeError = () => {
    setHasError(true);
    setIsRetrying(false);
  };



  const getDirectVideoUrl = (): string => {
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return src;
  };

  if (hasError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`relative w-full bg-gray-100 rounded-lg overflow-hidden border border-premium ${className}`}
        style={{ paddingBottom: '56.25%' }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <svg
            className="w-12 h-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-700 font-medium mb-2">Video unavailable</p>
          <p className="text-xs text-gray-500 mb-4">
            Unable to load this video. Please try again or view it directly on YouTube.
          </p>
          <div className="flex gap-2">
            {attempts < retryCount && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="px-3 py-1.5 bg-navy-900 text-white rounded-md hover:bg-navy-800 active:bg-navy-950 transition-all duration-300 text-xs font-medium disabled:bg-gray-400 shadow-premium"
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            )}
            <a
              href={getDirectVideoUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-xs font-medium"
            >
              Watch on YouTube
            </a>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`relative w-full bg-gray-900 rounded-lg overflow-hidden ${className}`} style={{ paddingBottom: '56.25%' }}>
      {!isPlaying && thumbnailUrl ? (
        <button
          onClick={() => setIsPlaying(true)}
          className="absolute inset-0 w-full h-full flex items-center justify-center group cursor-pointer z-10"
          aria-label={`Play video: ${title}`}
        >
          <img
            src={thumbnailUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            onError={handleThumbnailError}
          />
          <div className="relative z-20 w-12 h-12 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      ) : (
        <>
          <AnimatePresence>
            {isRetrying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-gray-900/75 rounded-lg z-10"
              >
                <div className="text-white text-sm">Loading video...</div>
              </motion.div>
            )}
          </AnimatePresence>
          <iframe
            src={videoSrc}
            title={title}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            onError={handleIframeError}
          />
        </>
      )}
    </div>
  );
}
