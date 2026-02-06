'use client';

import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { FeaturedCarouselItem } from '@/types';

interface FeaturedCarouselProps {
  items: FeaturedCarouselItem[];
  autoScrollInterval?: number;
}

export function FeaturedCarousel({ items, autoScrollInterval = 5000 }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Auto-scroll logic (pause on hover)
  useEffect(() => {
    if (items.length <= 1 || isHovering) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [currentIndex, isHovering, items.length, autoScrollInterval]);

  // Navigation functions
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  const goToSlide = (index: number) => setCurrentIndex(index);

  // Touch swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);

  // Reset currentIndex if it's out of bounds (can happen when items change)
  useEffect(() => {
    if (currentIndex >= items.length && items.length > 0) {
      setCurrentIndex(0);
    }
  }, [items.length, currentIndex]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  // Safety check
  if (!currentItem) return null;

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <m.div
          key={currentItem.id}
          initial={{ opacity: 0, scale: 0.98, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 1.02, x: -20 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as any }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-end gap-2 sm:gap-8 md:gap-10"
        >
          {/* Text Content */}
          <div className="space-y-0.5 sm:space-y-5 text-right flex-1">
            {/* Subtitle Label */}
            {currentItem.subtitle && (
              <div className="flex items-center justify-end gap-3 sm:gap-4">
                <p className="text-xs tracking-[0.3em] text-gold-500 font-medium uppercase">
                  {currentItem.subtitle}
                </p>
                <div className="h-px w-8 sm:w-12 bg-gold-500/30"></div>
              </div>
            )}

            {/* Title */}
            <h2 className="text-xl sm:text-3xl md:text-4xl font-serif text-white leading-tight tracking-tight">
              <span className="italic">{currentItem.title}</span>
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-base text-white/80 leading-relaxed max-w-lg font-light ml-auto line-clamp-2 sm:line-clamp-none">
              {currentItem.description}
            </p>

            {/* CTA Link */}
            {currentItem.link && currentItem.linkText && (
              <m.a
                href={currentItem.link}
                whileHover={{ x: -4 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-2.5 text-xs text-gold-500 font-medium tracking-[0.15em] uppercase mt-0.5 sm:mt-3 group"
              >
                <span>{currentItem.linkText}</span>
                <svg
                  className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
              </m.a>
            )}
          </div>

          {/* Image Thumbnail */}
          <div className="relative w-full h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-md overflow-hidden border border-white/15 shadow-2xl flex-shrink-0 group/img">
            <ImageWithFallback
              src={currentItem.image}
              alt={currentItem.title}
              fill
              className="object-cover transition-transform duration-700 group-hover/img:scale-105"
              sizes="(max-width: 640px) 100vw, 176px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-500"></div>
          </div>
        </m.div>
      </AnimatePresence>

      {/* Navigation Controls - Dot Indicators Only */}
      {items.length > 1 && (
        <div className="hidden sm:flex items-center justify-center gap-2 mt-4 sm:mt-8" role="tablist" aria-label="Carousel navigation">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => goToSlide(index)}
              className={`group p-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/40 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center ${index === currentIndex ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                }`}
              aria-label={`View slide ${index + 1} of ${items.length}: ${item.title}`}
              aria-selected={index === currentIndex}
              aria-current={index === currentIndex ? 'true' : 'false'}
              role="tab"
            >
              <div
                className={`rounded-full bg-white transition-all duration-500 ease-out ${index === currentIndex ? 'w-10 h-2' : 'w-2 h-2'
                  }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
