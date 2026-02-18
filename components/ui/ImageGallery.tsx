'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { m, AnimatePresence } from 'framer-motion';
import { getAssetPath } from '@/lib/config';
import type { GalleryImage } from '@/types';

const GALLERY_CONFIG = {
  INITIAL_VISIBLE: 6,
  LOAD_MORE_INCREMENT: 6,
} as const;

interface ImageGalleryProps {
  images: GalleryImage[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchEnd, setTouchEnd] = useState<number>(0);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Load More state
  const [visibleCount, setVisibleCount] = useState<number>(GALLERY_CONFIG.INITIAL_VISIBLE);

  const showLoadMore = images.length > visibleCount;
  const visibleImages = images.slice(0, visibleCount);
  const remainingImages = images.length - visibleCount;

  const handleLoadMore = () => {
    setVisibleCount(prev =>
      Math.min(prev + GALLERY_CONFIG.LOAD_MORE_INCREMENT, images.length)
    );
  };

  const navigateNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % images.length;
      setSelectedImage(images[nextIndex]);
      return nextIndex;
    });
  }, [images]);

  const navigatePrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const prevIndexVal = (prevIndex - 1 + images.length) % images.length;
      setSelectedImage(images[prevIndexVal]);
      return prevIndexVal;
    });
  }, [images]);

  // Handle keyboard navigation and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;

      switch (e.key) {
        case 'Escape':
          setSelectedImage(null);
          break;
        case 'ArrowLeft':
          navigatePrevious();
          break;
        case 'ArrowRight':
          navigateNext();
          break;
        case 'Tab': {
          // Trap focus within modal
          if (!modalRef.current) return;

          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, navigateNext, navigatePrevious]);

  // Prevent body scroll and manage focus when lightbox is open
  useEffect(() => {
    if (selectedImage) {
      // Save the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      document.body.style.overflow = 'hidden';

      // Focus the modal container after a brief delay to allow render
      setTimeout(() => {
        const firstButton = modalRef.current?.querySelector('button');
        firstButton?.focus();
      }, 100);
    } else {
      document.body.style.overflow = 'unset';

      // Return focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  const openLightbox = (image: GalleryImage, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  // Touch gesture handlers
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
      // Swipe left - next image
      navigateNext();
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous image
      navigatePrevious();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        {visibleImages.map((image, index) => {
          const isNewlyRevealed = index >= visibleCount - GALLERY_CONFIG.LOAD_MORE_INCREMENT;

          return (
            <m.div
              key={image.id}
              initial={isNewlyRevealed ? { opacity: 0, scale: 0.9 } : false}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
              transition={{
                duration: 0.2,
                delay: isNewlyRevealed ?
                  (index - (visibleCount - GALLERY_CONFIG.LOAD_MORE_INCREMENT)) * 0.1 : 0
              }}
              className="group relative aspect-[3/2] cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-premium-lg"
              onClick={() => openLightbox(image, index)}
              role="button"
              tabIndex={0}
              aria-label={`View ${image.alt}`}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openLightbox(image, index);
                }
              }}
            >
              <ImageWithFallback
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                loading={index < 2 ? 'eager' : 'lazy'}
                quality={85}
              />
              {/* Caption Overlay - Always visible */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 pointer-events-none opacity-100"
              >
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  {image.caption && (
                    <p className="text-white text-xs sm:text-sm font-medium leading-tight">
                      {image.caption}
                    </p>
                  )}
                </div>
              </div>
            </m.div>
          );
        })}
      </div>

      {/* Load More Button */}
      {showLoadMore && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center mt-12 sm:mt-16"
        >
          <button
            onClick={handleLoadMore}
            className="group relative py-3 px-1 flex flex-col items-center gap-2"
            aria-label={`Load ${Math.min(GALLERY_CONFIG.LOAD_MORE_INCREMENT, remainingImages)} more images`}
          >
            <span className="block text-xs font-medium tracking-[0.25em] text-navy-600 uppercase group-hover:text-navy-900 transition-colors duration-300">
              Load More
            </span>
            <svg
              className="w-4 h-4 text-navy-400 group-hover:text-navy-900 group-hover:translate-y-1 transition-all duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </m.div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <m.div
            ref={modalRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 sm:p-4"
            onClick={closeLightbox}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 text-white hover:text-gray-300 active:text-slate-400 transition-colors p-3 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Close image viewer (press Escape)"
            >
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Previous button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigatePrevious();
              }}
              className="absolute left-2 sm:left-4 z-10 text-white hover:text-gray-300 active:text-slate-400 transition-colors p-3 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Previous image (press left arrow)"
            >
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Next button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateNext();
              }}
              className="absolute right-2 sm:right-4 z-10 text-white hover:text-gray-300 active:text-slate-400 transition-colors p-3 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Next image (press right arrow)"
            >
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Image container */}
            <m.div
              key={selectedImage.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative max-w-7xl max-h-[90vh] w-full px-8 sm:px-12"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="image-title"
            >
              {/* Screen reader announcement */}
              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
              >
                Viewing image {currentIndex + 1} of {images.length}: {selectedImage.alt}
              </div>
              <h2 id="image-title" className="sr-only">
                {selectedImage.caption || selectedImage.alt}
              </h2>

              <div className="relative w-full h-full flex items-center justify-center">
                <ImageWithFallback
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  width={selectedImage.width}
                  height={selectedImage.height}
                  className="max-w-full max-h-[65vh] sm:max-h-[75vh] w-auto h-auto object-contain"
                  priority
                  showErrorMessage={true}
                  retryCount={2}
                />
              </div>
              {selectedImage.caption && (
                <div className="mt-4 sm:mt-6 text-center max-w-2xl mx-auto px-4">
                  <p className="text-white text-sm sm:text-base md:text-lg font-medium tracking-wide">
                    {selectedImage.caption}
                  </p>
                  <p className="text-slate-400 text-xs sm:text-sm mt-2 font-mono">
                    {currentIndex + 1} / {images.length}
                  </p>
                </div>
              )}
            </m.div>

            {/* Instructions */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 text-slate-400 text-xs sm:text-sm px-4 text-center">
              <p className="hidden md:block">Use arrow keys or click arrows to navigate • Press ESC to close</p>
              <p className="md:hidden">Swipe to navigate • Tap outside to close</p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
