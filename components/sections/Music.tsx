'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadConfig } from '@/lib/config';
import type { SiteConfig } from '@/types';
import MusicCarousel from '@/components/features/MusicCarousel';

export default function Music() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State for main category selection (Veena or Vocal)
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string>('');

  useEffect(() => {
    loadConfig()
      .then((loadedConfig) => {
        setConfig(loadedConfig);
        // Default Initialization: Select first main category
        if (loadedConfig.music.categories.length > 0) {
          setSelectedMainCategoryId(loadedConfig.music.categories[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load config:', err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <section id="music" className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Error loading configuration: {error}</p>
        </div>
      </section>
    );
  }

  if (!config) {
    return (
      <section id="music" className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-3 border-gray-300 border-t-gold-600 rounded-full animate-spin mb-3" />
              <p className="text-gray-600">Loading music...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const selectedMainCategory = config.music.categories.find(c => c.id === selectedMainCategoryId);

  return (
    <section id="music" className="px-4 sm:px-6 md:px-8" aria-label="Music">
      <div id="music-section" className="max-w-7xl mx-auto">
        {/* Section Title */}
        <motion.div
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
        </motion.div>

        {/* Main Category Tabs (Veena / Vocal) */}
        <div className="sticky top-[80px] z-40 py-4 mb-4 -mx-4 px-4 bg-white/90 backdrop-blur-md border-b border-gray-100/50">
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
          <motion.div
            key={selectedMainCategory.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-8"
          >
            <p className="text-gray-600 max-w-2xl mx-auto px-4">
              {selectedMainCategory.description}
            </p>
          </motion.div>
        )}

        {/* Subcategory Carousels */}
        {selectedMainCategory && (
          <div className="space-y-2 min-h-[400px]">
            <AnimatePresence mode='wait'>
              <motion.div
                key={selectedMainCategory.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-2"
              >
                {selectedMainCategory.subcategories.map((subcategory) => (
                  <motion.div
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
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
