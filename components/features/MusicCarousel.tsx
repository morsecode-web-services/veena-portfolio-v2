'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoEmbed from '@/components/ui/VideoEmbed';
import type { MusicVideo } from '@/types';

interface MusicCarouselProps {
    title: string;
    description: string;
    videos: MusicVideo[];
}

export default function MusicCarousel({ title, description, videos }: MusicCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    // Generate a unique ID for this carousel instance for navigation accessibility
    const carouselId = title.toLowerCase().replace(/\s+/g, '-');

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        // Add a small delay to ensure rendering is complete
        const timer = setTimeout(checkScroll, 100);
        window.addEventListener('resize', checkScroll);
        return () => {
            window.removeEventListener('resize', checkScroll);
            clearTimeout(timer);
        };
    }, [videos]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { clientWidth } = scrollContainerRef.current;
            const scrollAmount = clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
            setTimeout(checkScroll, 500);
        }
    };

    return (
        <div className="py-6 border-b border-gray-100 last:border-0 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
                <div className="px-4 sm:px-0">
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-navy-900 mb-1">
                        {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Custom Navigation - Hidden on mobile, shown on desktop */}
                <div className="hidden sm:flex gap-2">
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className="w-8 h-8 rounded-full border border-gray-200 lg:group-hover:opacity-100 flex items-center justify-center text-navy-900 hover:bg-navy-900 hover:text-white hover:border-navy-900 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm bg-white"
                        aria-label={`Previous ${title} videos`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className="w-8 h-8 rounded-full border border-gray-200 lg:group-hover:opacity-100 flex items-center justify-center text-navy-900 hover:bg-navy-900 hover:text-white hover:border-navy-900 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm bg-white"
                        aria-label={`Next ${title} videos`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Scroll Container */}
            <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-hide scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {videos.map((video, index) => (
                    <motion.div
                        key={`${carouselId}-${index}`}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="flex-none w-[75vw] sm:w-[280px] md:w-[320px] snap-center"
                    >
                        <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden group border border-navy-100 hover:border-gold-500/30 transition-all duration-500 cursor-pointer">
                            <div className="relative aspect-video">
                                <VideoEmbed src={video.url} title={video.title || 'Performance Video'} />
                            </div>
                            <div className="p-4 flex flex-col items-center justify-center text-center relative overflow-hidden bg-navy-50/20">
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-navy-200/30 to-transparent" />
                                <h4 className="text-sm font-serif font-bold text-navy-900 group-hover:text-gold-600 transition-colors duration-300 leading-snug line-clamp-2">
                                    {video.title || 'Performance Video'}
                                </h4>

                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
