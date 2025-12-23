'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { loadConfig } from '@/lib/config';
import ImageGallery from '@/components/ui/ImageGallery';
import type { SiteConfig } from '@/types';

export default function Gallery() {
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
      <section id="gallery" className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Error loading gallery: {error}</p>
        </div>
      </section>
    );
  }

  if (!config) {
    return (
      <section id="gallery" className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-3 border-gray-300 border-t-gold-600 rounded-full animate-spin mb-3" />
              <p className="text-gray-600">Loading gallery...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="px-4 sm:px-6 md:px-8" aria-label="Performance gallery">
      <div id="gallery-section" className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-8 sm:mb-10 md:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-navy-900 mb-3 md:mb-4 px-4">
            Performance Gallery
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            A visual journey through memorable performances and musical moments
          </p>
        </motion.div>

        {/* Gallery Grid */}
        {config.gallery?.images && config.gallery.images.length > 0 ? (
          <ImageGallery images={config.gallery.images} />
        ) : (
          <div className="text-center text-gray-500 px-4">
            <p className="text-base sm:text-lg">No gallery images available at this time.</p>
          </div>
        )}
      </div>
    </section>
  );
}
