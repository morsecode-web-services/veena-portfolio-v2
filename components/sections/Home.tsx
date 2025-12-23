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



  return (
    <section id="home" className="px-4 sm:px-6 md:px-8" aria-label="Home">
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
          <div className="w-24 sm:w-32 h-1 bg-gradient-gold mb-6 md:mb-8 rounded-full animate-pulse-slow"></div>
          <p className="text-lg sm:text-xl md:text-2xl text-navy-600 font-light text-center max-w-3xl leading-relaxed mb-8">
            {config.artist.briefBio}
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-4">
            <motion.a
              href="#music"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-gold-600 text-white rounded-full font-semibold shadow-premium-lg hover:shadow-premium-xl transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
              Watch Showreel
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 border-2 border-navy-900 text-navy-900 rounded-full font-semibold hover:bg-navy-900 hover:text-white transition-all duration-300"
            >
              Book Artiste
            </motion.a>
          </div>
        </motion.div>

        {/* Viral Spotlight: The 3 Generation Trio */}
        {config.spotlight && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8 }}
            className="mb-20 sm:mb-24 md:mb-32 relative overflow-hidden rounded-2xl bg-white text-navy-900 shadow-premium-xl border border-premium"
          >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative h-64 sm:h-80 lg:h-auto order-last lg:order-first">
                <ImageWithFallback
                  src={config.spotlight.imageUrl}
                  alt={config.spotlight.title}
                  fill
                  className="object-cover"
                  priority={false}
                />
              </div>

              <div className="p-8 sm:p-12 md:p-16 flex flex-col justify-center relative z-10 bg-white">
                <div className="inline-block px-3 py-1 bg-gold-600 text-white text-xs font-bold tracking-wider uppercase rounded-full mb-4 self-start">
                  Must See
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4 text-navy-900">
                  {config.spotlight.title}
                </h2>
                <h3 className="text-xl text-gold-600 mb-6 font-serif italic">
                  {config.spotlight.subtitle}
                </h3>
                <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                  {config.spotlight.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 border-t border-gray-200 pt-8">
                  {config.spotlight.features.map((feature, idx) => (
                    <div key={idx}>
                      <h4 className="text-navy-900 font-bold mb-2">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  ))}
                </div>

                <motion.a
                  href="#music"
                  whileHover={{ x: 5 }}
                  className="inline-flex items-center text-gold-600 font-bold hover:text-gold-700 transition-colors"
                >
                  Watch Their Performance <span className="ml-2">→</span>
                </motion.a>
              </div>
            </div>
          </motion.div>
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
