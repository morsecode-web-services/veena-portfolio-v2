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

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [videos]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { clientWidth } = scrollContainerRef.current;
            const scrollAmount = clientWidth * 0.8; // Scroll 80% of width
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
            // Check scroll state after animation (approximate)
            setTimeout(checkScroll, 500);
        }
    };

    return (
        <div className="py-4 border-b border-gray-100 last:border-0 relative group/carousel">
            {/* Header */}
            <div className="mb-2 px-4 sm:px-0">
                <h3 className="text-2xl font-serif font-bold text-navy-900 mb-2">{title}</h3>
                <p className="text-gray-600 font-light max-w-2xl">{description}</p>
            </div>

            {/* Carousel Controls - Visible on Hover (Desktop) / Always (Mobile if needed) */}
            <div className="relative">
                <AnimatePresence>
                    {canScrollLeft && (
                        <motion.button
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            onClick={() => scroll('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full shadow-lg transition-transform hover:scale-110 border-2 border-white flex items-center justify-center -ml-4 hidden sm:flex"
                            style={{ backgroundColor: '#14213d', color: '#ffffff', minWidth: '40px', minHeight: '40px' }}
                            aria-label="Scroll left"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </motion.button>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {canScrollRight && (
                        <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            onClick={() => scroll('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full shadow-lg transition-transform hover:scale-110 border-2 border-white flex items-center justify-center -mr-4 hidden sm:flex"
                            style={{ backgroundColor: '#14213d', color: '#ffffff', minWidth: '40px', minHeight: '40px' }}
                            aria-label="Scroll right"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className="flex gap-6 overflow-x-auto pb-8 pt-2 px-4 sm:px-2 snap-x snap-mandatory scrollbar-hide scroll-smooth -mx-4 sm:mx-0"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {videos.map((video, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex-none w-[85vw] sm:w-[400px] snap-center first:pl-4 last:pr-4 sm:first:pl-0 sm:last:pr-0"
                        >
                            <div className="bg-white rounded-xl overflow-hidden shadow-premium border border-gray-100 hover:shadow-premium-xl transition-all duration-300 group">
                                <div className="aspect-video relative overflow-hidden">
                                    <VideoEmbed src={video.url} title={video.title} retryCount={2} />
                                </div>
                                <div className="p-4">
                                    <h4 className="text-lg font-medium text-navy-900 line-clamp-2 group-hover:text-gold-600 transition-colors">
                                        {video.title}
                                    </h4>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
