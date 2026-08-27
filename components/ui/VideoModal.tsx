'use client';

import { m, AnimatePresence } from 'framer-motion';
import { useVideo } from '@/context/VideoContext';
import { useEffect, useRef, useState, useCallback } from 'react';
import { extractGoogleDriveId, getGoogleDriveEmbedUrl } from '@/lib/utils';
import { X, Maximize, Minimize, RotateCw } from 'lucide-react';

export default function VideoModal() {
  const { expandedVideo, closeVideo } = useVideo();
  const modalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isForcedLandscape, setIsForcedLandscape] = useState(false);

  // Prevent body scroll and manage focus when modal is open
  useEffect(() => {
    if (expandedVideo) {
      document.body.style.overflow = 'hidden';
      // Focus the modal container after a brief delay to ensure it's rendered
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = 'unset';
      setIsFullscreen(false);
      setIsForcedLandscape(false);
      if (
        typeof window !== 'undefined' &&
        screen.orientation &&
        (screen.orientation as any).unlock
      ) {
        try {
          (screen.orientation as any).unlock();
        } catch {
          // Ignore
        }
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [expandedVideo]);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      if (!document.fullscreenElement) {
        if (
          typeof window !== 'undefined' &&
          screen.orientation &&
          (screen.orientation as any).unlock
        ) {
          try {
            (screen.orientation as any).unlock();
          } catch {
            // Ignore
          }
        }
      }
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
        } else if (isForcedLandscape) {
          setIsForcedLandscape(false);
        } else {
          closeVideo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeVideo, expandedVideo, isForcedLandscape]);

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
        // Attempt OS orientation lock to landscape
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch {
            // If OS orientation lock is blocked by system permissions, toggle forced landscape CSS
            setIsForcedLandscape(true);
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        if (screen.orientation && (screen.orientation as any).unlock) {
          try {
            (screen.orientation as any).unlock();
          } catch {
            // Ignore
          }
        }
        setIsForcedLandscape(false);
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  const toggleRotateCinema = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const nextState = !isForcedLandscape;
      setIsForcedLandscape(nextState);

      if (nextState) {
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch {
            // Handled via CSS transform
          }
        }
      } else {
        if (screen.orientation && (screen.orientation as any).unlock) {
          try {
            (screen.orientation as any).unlock();
          } catch {
            // Ignore
          }
        }
      }
    },
    [isForcedLandscape]
  );

  const driveId = expandedVideo ? extractGoogleDriveId(expandedVideo.url) : null;
  const embedUrl = expandedVideo
    ? driveId
      ? getGoogleDriveEmbedUrl(expandedVideo.url) || expandedVideo.url
      : expandedVideo.url
    : '';

  return (
    <AnimatePresence>
      {expandedVideo && (
        <m.div
          ref={modalRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md outline-none ${
            isForcedLandscape ? 'p-0 overflow-hidden' : 'p-3 sm:p-6 md:p-8 landscape:p-0'
          }`}
          onClick={closeVideo}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Video player modal"
        >
          {/* Header Action Buttons (Rotate Cinema, Fullscreen, Close) */}
          <div
            className={`absolute z-[130] flex items-center gap-2 ${
              isForcedLandscape ? 'top-4 right-4' : 'top-3 right-3 sm:top-6 sm:right-6'
            }`}
          >
            {/* Rotate Cinema Toggle (Forces 100% widescreen even with Portrait Lock on) */}
            <button
              onClick={toggleRotateCinema}
              className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all active:scale-95 shadow-md ${
                isForcedLandscape
                  ? 'bg-gold-500 text-navy-950 font-bold'
                  : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
              }`}
              aria-label={isForcedLandscape ? 'Exit Cinema Rotation' : 'Rotate Cinema Widescreen'}
              title={isForcedLandscape ? 'Exit Cinema Rotation' : 'Rotate Cinema Widescreen'}
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Native Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95 shadow-md"
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={closeVideo}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95 shadow-md"
              aria-label="Close video (press Escape)"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Video Container */}
          <m.div
            ref={containerRef}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            style={
              isForcedLandscape
                ? {
                    position: 'fixed',
                    top: 0,
                    left: '100dvw',
                    width: '100dvh',
                    height: '100dvw',
                    transform: 'rotate(90deg)',
                    transformOrigin: 'top left',
                    maxWidth: 'none',
                    borderRadius: 0,
                    border: 'none',
                    zIndex: 110,
                  }
                : undefined
            }
            className={`relative bg-black shadow-premium-xl transition-all duration-300 ${
              isForcedLandscape
                ? 'overflow-hidden'
                : 'w-full max-w-5xl h-[70vh] sm:h-auto sm:aspect-video rounded-2xl overflow-hidden border border-white/10 landscape:h-screen landscape:w-screen landscape:max-w-none landscape:rounded-none landscape:border-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={embedUrl}
              title={expandedVideo.title}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              loading="eager"
            />
          </m.div>

          {/* Minimal Title/Caption below video (hidden in rotated or landscape cinema mode) */}
          {!isForcedLandscape && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-4 sm:bottom-6 left-0 right-0 text-center px-4 pointer-events-none landscape:hidden"
            >
              <h3 className="text-white/90 text-sm sm:text-base font-serif tracking-wide drop-shadow-md">
                {expandedVideo.title}
              </h3>
            </m.div>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}
