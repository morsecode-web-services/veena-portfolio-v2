'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import type { SiteConfig } from '@/types';
import MusicCarousel from '@/components/features/MusicCarousel';

interface MusicProps {
  config: SiteConfig;
}

export default function Music({ config }: MusicProps) {
  // State for main category selection (Veena or Vocal)
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string>(
    config.music.categories.length > 0 ? config.music.categories[0].id : ''
  );

  const selectedMainCategory = config.music.categories.find(c => c.id === selectedMainCategoryId);

  return (
    <section id="music" className="px-4 sm:px-6 md:px-8" aria-label="Music">
      <div id="music-section" className="max-w-7xl mx-auto">
        {/* Section Title */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-navy-900 mb-3 px-4">
            Music
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Explore performances across different styles and traditions
          </p>
        </m.div>

        {/* Main Category Tabs (Veena / Vocal) */}
        <div
          className="sticky z-40 py-4 mb-4 -mx-4 px-4 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]"
          style={{ top: 'var(--header-height, 70px)' }}
        >
          <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-3 sm:gap-4">
            {config.music.categories.map((category) => {
              const isActive = selectedMainCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedMainCategoryId(category.id)}
                  className="px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border-2 shadow-md hover:-translate-y-0.5 tracking-wide"
                  style={{
                    backgroundColor: isActive ? '#14213d' : '#ffffff',
                    color: isActive ? '#ffffff' : '#14213d',
                    borderColor: isActive ? '#b8860b' : '#e5e7eb',
                  }}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subcategory Description */}
        {selectedMainCategory && (
          <m.div
            key={selectedMainCategory.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-8"
          >
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
              {selectedMainCategory.description}
            </p>
          </m.div>
        )}

        {/* Subcategory Carousels */}
        {selectedMainCategory && (
          <div className="space-y-2 min-h-[400px]">
            <AnimatePresence mode='wait'>
              <m.div
                key={selectedMainCategory.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-2"
              >
                {selectedMainCategory.subcategories.map((subcategory) => (
                  <m.div
                    key={subcategory.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <MusicCarousel
                      title={subcategory.name}
                      description={subcategory.description}
                      videos={subcategory.videos}
                    />
                  </m.div>
                ))}
              </m.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
