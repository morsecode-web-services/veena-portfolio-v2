'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import VideoEmbed from '@/components/ui/VideoEmbed';
import { loadConfig } from '@/lib/config';
import type { SiteConfig } from '@/types';

export default function Home() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSpotlight, setCurrentSpotlight] = useState(0);

  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch((err) => {
        console.error('Failed to load config:', err);
        setError(err.message);
      });
  }, []);

  const nextSpotlight = () => {
    if (!config?.spotlights) return;
    setCurrentSpotlight((prev) => (prev + 1) % config.spotlights!.length);
  };

  const prevSpotlight = () => {
    if (!config?.spotlights) return;
    setCurrentSpotlight((prev) => (prev - 1 + config.spotlights!.length) % config.spotlights!.length);
  };

  if (error) {
    return (
      <section id="home" className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Error loading configuration: {error}</p>
        </div>
      </section>
    );
  }

  if (!config) {
    return (
      <section id="home" className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-gray-600">Loading...</div>
          </div>
        </div>
      </section>
    );
  }

  const spotlight = config.spotlights?.[currentSpotlight];

  return (
    <section id="home" className="px-4 sm:px-6 md:px-8" aria-label="Home">
      <div id="home-section" className="max-w-7xl mx-auto">
        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center justify-center mb-6 sm:mb-8 md:mb-10"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-navy-900 mb-2 md:mb-3 text-center">
            {config.artist.name}
          </h1>
          {/* Premium gold accent underline */}
          <div className="w-20 sm:w-24 h-1 bg-gradient-gold mb-5 md:mb-6 rounded-full animate-pulse-slow"></div>
          <p className="text-xs sm:text-sm md:text-base text-navy-600 font-light text-center max-w-2xl leading-relaxed mb-6">
            {config.artist.briefBio}
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-row gap-2 sm:gap-4 mt-3">
            <motion.a
              href="#music"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 sm:px-6 py-2 sm:py-2.5 bg-gold-600 text-white rounded-full text-xs sm:text-sm font-semibold shadow-premium-lg hover:shadow-premium-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap group"
            >
              {/* Minimalist Musical Equalizer Indicator */}
              <div className="flex items-end gap-[2px] h-2.5 w-3.5 mb-[1px]">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: ['20%', '100%', '30%', '80%', '20%']
                    }}
                    transition={{
                      duration: 1 + i * 0.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.1
                    }}
                    className="w-0.5 bg-white rounded-full"
                  />
                ))}
              </div>
              Watch Showreel
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 sm:px-6 py-2 sm:py-2.5 border-2 border-navy-900 text-navy-900 rounded-full text-xs sm:text-sm font-semibold hover:bg-navy-900 hover:text-white transition-all duration-300 whitespace-nowrap flex items-center justify-center"
            >
              Book Artiste
            </motion.a>
          </div>
        </motion.div>

        {/* Viral Spotlight Carousel */}
        {spotlight && (
          <div className="mb-12 sm:mb-24 md:mb-32 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={spotlight.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipeThreshold = 50;
                  const swipeVelocityThreshold = 500;

                  // Swipe left (next)
                  if (offset.x < -swipeThreshold || velocity.x < -swipeVelocityThreshold) {
                    nextSpotlight();
                  }
                  // Swipe right (previous)
                  else if (offset.x > swipeThreshold || velocity.x > swipeVelocityThreshold) {
                    prevSpotlight();
                  }
                }}
                className="relative overflow-hidden rounded-2xl bg-white text-navy-900 shadow-premium-xl border border-premium cursor-grab active:cursor-grabbing"
              >
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="relative aspect-[16/10] sm:aspect-video lg:aspect-auto lg:h-auto lg:min-h-[500px] pointer-events-none">
                    <ImageWithFallback
                      src={spotlight.imageUrl}
                      alt={spotlight.title}
                      fill
                      className="object-cover"
                      style={{ objectPosition: spotlight.imagePosition || 'center' }}
                      priority={true}
                    />
                  </div>

                  <div className="p-4 sm:p-8 md:p-12 flex flex-col justify-center relative z-10 bg-white pointer-events-none">
                    <h2 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold mb-1.5 sm:mb-3 text-navy-900">
                      {spotlight.title}
                    </h2>
                    <h3 className="text-base sm:text-lg text-gold-600 mb-3 sm:mb-5 font-serif italic">
                      {spotlight.subtitle}
                    </h3>
                    <p className="text-gray-700 text-xs sm:text-sm md:text-base mb-5 sm:mb-6 leading-relaxed">
                      {spotlight.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 border-t border-gray-200 pt-6 sm:pt-8">
                      {spotlight.features.map((feature, idx) => (
                        <div key={idx}>
                          <h4 className="text-navy-900 font-bold mb-1 sm:mb-2 text-sm sm:text-base">{feature.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 leading-tight">{feature.description}</p>
                        </div>
                      ))}
                    </div>

                    {spotlight.ctaLink && (
                      <motion.a
                        href={spotlight.ctaLink}
                        whileHover={{ x: 5 }}
                        className="inline-flex items-center text-gold-600 font-bold hover:text-gold-700 transition-colors text-sm sm:text-base pointer-events-auto"
                      >
                        {spotlight.ctaText || 'Learn More'} <span className="ml-2">→</span>
                      </motion.a>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Navigation - Explicit Inline Styles for Visibility and Z-Index */}
            {config.spotlights && config.spotlights.length > 1 && (
              <div className="absolute top-[22%] sm:top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none px-2 sm:px-4 z-50">
                <button
                  onClick={prevSpotlight}
                  className="pointer-events-auto p-2 sm:p-3 rounded-full shadow-lg transition-transform hover:scale-110 border-2 border-white flex items-center justify-center transform hover:scale-110 active:scale-95"
                  style={{ backgroundColor: '#14213d', color: '#ffffff', minWidth: '40px', minHeight: '40px' }}
                  aria-label="Previous spotlight"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextSpotlight}
                  className="pointer-events-auto p-2 sm:p-3 rounded-full shadow-lg transition-transform hover:scale-110 border-2 border-white flex items-center justify-center transform hover:scale-110 active:scale-95"
                  style={{ backgroundColor: '#14213d', color: '#ffffff', minWidth: '40px', minHeight: '40px' }}
                  aria-label="Next spotlight"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Carousel Dots */}
            {config.spotlights && config.spotlights.length > 1 && (
              <div className="flex justify-center gap-1.5 sm:gap-3 mt-3 sm:mt-8 relative z-20">
                {config.spotlights.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSpotlight(idx)}
                    className={`h-1 sm:h-2 rounded-full transition-all duration-300 ${currentSpotlight === idx ? 'w-3 sm:w-8' : 'w-1 sm:w-2 hover:bg-gray-400'
                      }`}
                    style={{
                      backgroundColor: currentSpotlight === idx ? '#14213d' : '#cbd5e1',
                      minWidth: '0',
                      minHeight: '0'
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Featured YouTube videos */}
        {config.home.featuredVideos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            role="region"
            aria-label="Featured performances"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-semibold text-navy-900 text-center mb-5 sm:mb-6 px-4">
              Featured Performances
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {config.home.featuredVideos.map((video, index) => {
                const videoUrl = typeof video === 'string' ? video : video.url;
                const videoTitle = typeof video === 'string' ? `Featured performance ${index + 1}` : video.title || `Featured performance ${index + 1}`;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 + index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                    whileHover={{ y: -5, transition: { duration: 0.3 } }}
                    className="rounded-lg overflow-hidden border border-premium transition-all duration-300"
                  >
                    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-navy-100 hover:border-gold-500/30 transition-all duration-500 group/card">
                      {/* Video Top Section */}
                      <div className="relative aspect-video">
                        <VideoEmbed
                          src={videoUrl}
                          title={videoTitle}
                          retryCount={2}
                        />
                      </div>

                      {/* Integrated Content Section - Soft Navy Tinted Background */}
                      <div className="p-5 flex flex-col items-center justify-center text-center relative overflow-hidden bg-navy-50/30">
                        {/* Subtle decorative top line */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-navy-200/50 to-transparent" />

                        <h3 className="text-sm sm:text-base font-serif font-bold text-navy-900 group-hover/card:text-gold-600 transition-colors duration-300 leading-snug">
                          {videoTitle}
                        </h3>


                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
