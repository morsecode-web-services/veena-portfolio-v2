'use client';

import { m, AnimatePresence } from 'framer-motion';
import { useVideo } from '@/context/VideoContext';
import { useEffect, useRef, useState, useCallback } from 'react';
import { extractGoogleDriveId, extractYoutubeId } from '@/lib/utils';
import { X, Maximize, Minimize } from 'lucide-react';

export default function VideoModal() {
  const { expandedVideo, closeVideo } = useVideo();
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Prevent body scroll and manage focus when modal is open
  useEffect(() => {
    if (expandedVideo) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = 'unset';
      setIsFullscreen(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [expandedVideo]);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedVideo) {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        } else {
          closeVideo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeVideo, expandedVideo]);

  const toggleFullscreen = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!document.fullscreenElement) {
        const el = containerRef.current || modalRef.current;
        if (el) {
          if (el.requestFullscreen) {
            await el.requestFullscreen();
          } else if ((el as any).webkitRequestFullscreen) {
            await (el as any).webkitRequestFullscreen();
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  const driveId = expandedVideo ? extractGoogleDriveId(expandedVideo.url) : null;
  const youtubeId = expandedVideo ? extractYoutubeId(expandedVideo.url) : null;

  return (
    <AnimatePresence>
      {expandedVideo && (
        <m.div
          ref={modalRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-6 md:p-8 outline-none"
          onClick={closeVideo}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Video player modal"
        >
          {/* Header Action Buttons (Fullscreen, Close) */}
          <div className="absolute top-3 right-3 sm:top-6 sm:right-6 flex items-center gap-2 z-[130]">
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95 shadow-md"
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            <button
              onClick={closeVideo}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95 shadow-md"
              aria-label="Close video (press Escape)"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Video Player Container */}
          <m.div
            ref={containerRef}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-premium-xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {expandedVideo.url.includes('r2.dev') ||
            expandedVideo.url.includes('r2.cloudflarestorage.com') ||
            expandedVideo.url.includes('cloudinary.com') ||
            expandedVideo.url.endsWith('.mp4') ? (
              <video
                ref={videoRef}
                src={expandedVideo.url}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
                preload="auto"
              />
            ) : driveId ? (
              <video
                ref={videoRef}
                src={`/api/video-stream?id=${driveId}`}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
                preload="metadata"
              />
            ) : youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={expandedVideo.title}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : (
              <iframe
                src={expandedVideo.url}
                title={expandedVideo.title}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            )}
          </m.div>

          {/* Minimal Title/Caption below video */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-4 sm:bottom-6 left-0 right-0 text-center px-4 pointer-events-none"
          >
            <h3 className="text-white/90 text-sm sm:text-base font-serif tracking-wide drop-shadow-md">
              {expandedVideo.title}
            </h3>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
