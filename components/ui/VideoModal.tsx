'use client';

import { m, AnimatePresence } from 'framer-motion';
import { useVideo } from '@/context/VideoContext';
import { useEffect, useRef } from 'react';

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

  return (
    <AnimatePresence>
      {expandedVideo && (
        <m.div
          ref={modalRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 outline-none"
          onClick={closeVideo}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Video player modal"
        >
          {/* Close Button */}
          <button
            onClick={closeVideo}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/70 hover:text-white transition-colors z-[110]"
            aria-label="Close video (press Escape)"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <m.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-premium-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={expandedVideo.url}
              title={expandedVideo.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="eager"
            />
          </m.div>

          {/* Minimal Title/Caption below video */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-8 left-0 right-0 text-center px-4"
          >
            <h3 className="text-white/90 text-sm sm:text-lg font-serif tracking-wide">
              {expandedVideo.title}
            </h3>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
