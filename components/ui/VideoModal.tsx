'use client';

import { m, AnimatePresence } from 'framer-motion';
import { useVideo } from '@/context/VideoContext';
import { useEffect, useRef } from 'react';
import { extractGoogleDriveId, getGoogleDriveEmbedUrl } from '@/lib/utils';
import { X } from 'lucide-react';

export default function VideoModal() {
  const { expandedVideo, closeVideo } = useVideo();
  const modalRef = useRef<HTMLDivElement>(null);

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
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [expandedVideo]);

  // Handle Escape key - only close if modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedVideo) {
        closeVideo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeVideo, expandedVideo]);

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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 md:p-8 outline-none"
          onClick={closeVideo}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Video player modal"
        >
          {/* Close Button */}
          <button
            onClick={closeVideo}
            className="absolute top-3 right-3 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all z-[110] active:scale-95"
            aria-label="Close video (press Escape)"
          >
            <X className="w-6 h-6" />
          </button>

          <m.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-5xl h-[70vh] sm:h-auto sm:aspect-video bg-black rounded-2xl overflow-hidden shadow-premium-xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={embedUrl}
              title={expandedVideo.title}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="eager"
            />
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
