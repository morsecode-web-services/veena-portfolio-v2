'use client';

import { m, AnimatePresence } from 'framer-motion';
import { useVideo } from '@/context/VideoContext';
import { useEffect } from 'react';

export default function VideoModal() {
    const { expandedVideo, closeVideo } = useVideo();

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (expandedVideo) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [expandedVideo]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeVideo();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeVideo]);

    return (
        <AnimatePresence>
            {expandedVideo && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8"
                    onClick={closeVideo}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeVideo}
                        className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/70 hover:text-white transition-colors z-[110]"
                        aria-label="Close video"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
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
