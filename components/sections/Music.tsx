'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoEmbed from '@/components/ui/VideoEmbed';
import { loadConfig } from '@/lib/config';
import type { SiteConfig, MusicCategory } from '@/types';

export default function Music() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadConfig()
      .then((loadedConfig) => {
        setConfig(loadedConfig);
        // Set the first category as default
        if (loadedConfig.music.categories.length > 0) {
          setSelectedCategory(loadedConfig.music.categories[0].id);
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

  const currentCategory = config.music.categories.find(
    (cat) => cat.id === selectedCategory
  );

  return (
    <section id="music" className="px-4 sm:px-6 md:px-8" aria-label="Music">
      <div id="music-section" className="max-w-7xl mx-auto">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-8 sm:mb-10 md:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-navy-900 mb-3 md:mb-4 px-4">
            Music
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Explore performances across different styles and traditions
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 sm:mb-10 md:mb-12 px-2"
          role="tablist"
          aria-label="Music categories"
        >
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4">
            {config.music.categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-medium 
                  transition-all duration-300 text-sm sm:text-base touch-manipulation
                  ${selectedCategory === category.id
                    ? 'bg-navy-900 text-white shadow-premium-md border border-navy-800'
                    : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-premium border border-premium hover:shadow-premium-md'
                  }
                `}
                style={selectedCategory === category.id ? { backgroundColor: '#14213d', color: '#ffffff' } : {}}
                role="tab"
                aria-selected={selectedCategory === category.id}
                aria-controls={`category-panel-${category.id}`}
              >
                {category.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Category Description */}
        <AnimatePresence mode="wait">
          {currentCategory && (
            <motion.div
              key={`desc-${currentCategory.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-8 sm:mb-10 text-center px-4"
            >
              <p className="text-base sm:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
                {currentCategory.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Grid */}
        <AnimatePresence mode="wait">
          {currentCategory && currentCategory.videos.length > 0 && (
            <motion.div
              key={`videos-${currentCategory.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
              role="tabpanel"
              id={`category-panel-${currentCategory.id}`}
              aria-label={`${currentCategory.name} videos`}
            >
              {currentCategory.videos.map((video, index) => (
                <motion.div
                  key={`${currentCategory.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.3 } }}
                  className="rounded-lg overflow-hidden shadow-premium-lg hover:shadow-premium-xl border border-premium transition-all duration-300"
                >
                  <VideoEmbed
                    src={video.url}
                    title={video.title}
                    retryCount={2}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {currentCategory && currentCategory.videos.length === 0 && (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500 text-base sm:text-lg">
              No videos available for this category yet.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
