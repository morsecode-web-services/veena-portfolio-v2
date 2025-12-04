'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import VideoEmbed from '@/components/ui/VideoEmbed';
import { loadConfig } from '@/lib/config';
import type { SiteConfig } from '@/types';

export default function Home() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch((err) => {
        console.error('Failed to load config:', err);
        setError(err.message);
      });
  }, []);

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

  const handleReadMoreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-cream-50" aria-label="Home">
      <div id="home-section" className="max-w-7xl mx-auto">
        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center justify-center mb-8 sm:mb-10 md:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-navy-900 mb-3 md:mb-4 text-center">
            {config.artist.name}
          </h1>
          {/* Premium gold accent underline */}
          <div className="w-24 sm:w-32 h-1 bg-gradient-gold mb-3 md:mb-4 rounded-full"></div>
          <p className="text-lg sm:text-xl md:text-2xl text-navy-600 font-light text-center" role="doc-subtitle">
            {config.artist.tagline}
          </p>
        </motion.div>

        {/* Two-column layout for images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-14 md:mb-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full h-[300px] sm:h-[350px] md:h-[450px] lg:h-[500px] rounded-lg overflow-hidden shadow-premium-lg border border-premium group"
          >
            <ImageWithFallback
              src={config.home.images.veena}
              alt={`${config.artist.name} performing with Veena`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              showErrorMessage={true}
              retryCount={2}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full h-[300px] sm:h-[350px] md:h-[450px] lg:h-[500px] rounded-lg overflow-hidden shadow-premium-lg border border-premium group"
          >
            <ImageWithFallback
              src={config.home.images.vocal}
              alt={`${config.artist.name} performing vocals`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              showErrorMessage={true}
              retryCount={2}
            />
          </motion.div>
        </div>

        {/* Brief biography with Read More link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-12 sm:mb-14 md:mb-16 flex flex-col items-center justify-center max-w-3xl mx-auto px-4"
        >
          <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed mb-6 text-center">
            {config.artist.briefBio}
          </p>
          <motion.a
            href="#about"
            onClick={handleReadMoreClick}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="inline-block px-6 sm:px-8 py-3 bg-navy-900 text-white rounded-md hover:bg-navy-800 active:bg-navy-950 transition-all duration-300 font-medium shadow-premium-md hover:shadow-premium-lg text-sm sm:text-base touch-manipulation"
            style={{ backgroundColor: '#14213d', color: '#ffffff' }}
          >
            Read More About {config.artist.name.split(' ')[0]}
          </motion.a>
        </motion.div>

        {/* Featured YouTube videos */}
        {config.home.featuredVideos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0, ease: [0.25, 0.1, 0.25, 1] }}
            role="region"
            aria-label="Featured performances"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-navy-900 text-center mb-6 sm:mb-8 px-4">
              Featured Performances
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {config.home.featuredVideos.map((videoUrl, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 + index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  whileHover={{ y: -5, transition: { duration: 0.3 } }}
                  className="rounded-lg overflow-hidden shadow-premium-lg hover:shadow-premium-xl border border-premium transition-all duration-300"
                >
                  <VideoEmbed
                    src={videoUrl}
                    title={`Featured video ${index + 1}`}
                    retryCount={2}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
