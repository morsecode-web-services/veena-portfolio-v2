'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import ImageGallery from '@/components/ui/ImageGallery';
import type { SiteConfig } from '@/types';

interface GalleryProps {
  config: SiteConfig;
}

export default function Gallery({ config }: GalleryProps) {
  // Config passed as prop, no loading state needed

  return (
    <section id="gallery" className="px-4 sm:px-6 md:px-8" aria-label="Performance gallery">
      <div id="gallery-section" className="max-w-7xl mx-auto">
        {/* Section Header */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-6 sm:mb-8 md:mb-10"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-navy-900 mb-2 md:mb-3 px-4">
            Performance Gallery
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4 leading-relaxed">
            A visual journey through memorable performances and musical moments
          </p>
        </m.div>

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
