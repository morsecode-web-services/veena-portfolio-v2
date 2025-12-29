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
    /(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/,
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
  const [hasError, setHasError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [videoSrc, setVideoSrc] = useState(src);

  useEffect(() => {
    // Try to extract YouTube video ID and convert to embed URL
    const videoId = extractVideoId(src);
    if (videoId) {
      // Preserve query parameters if they exist (except v=...)
      const urlObj = new URL(src);
      const searchParams = new URLSearchParams(urlObj.search);
      searchParams.delete('v');

      const queryStr = searchParams.toString();
      const embedUrl = `https://www.youtube.com/embed/${videoId}${queryStr ? `?${queryStr}` : ''}`;
      setVideoSrc(embedUrl);
    } else {
      setVideoSrc(src);
    }

    setHasError(false);
    setAttempts(0);
  }, [src]);

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
    const videoId = extractVideoId(src);
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
            className="w-16 h-16 text-gray-400 mb-4"
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
          <p className="text-sm text-gray-500 mb-4">
            Unable to load this video. Please try again or view it directly on YouTube.
          </p>
          <div className="flex gap-3">
            {attempts < retryCount && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="px-4 py-2 bg-navy-900 text-white rounded-md hover:bg-navy-800 active:bg-navy-950 transition-all duration-300 text-sm font-medium disabled:bg-gray-400 shadow-premium"
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            )}
            <a
              href={getDirectVideoUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Watch on YouTube
            </a>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`relative w-full ${className}`} style={{ paddingBottom: '56.25%' }}>
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
    </div>
  );
}
