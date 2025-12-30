'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadConfig } from '@/lib/config';
import type { SiteConfig } from '@/types';
import MusicCarousel from '@/components/features/MusicCarousel';
import VideoEmbed from '@/components/ui/VideoEmbed';

export default function Music() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State for multi-select (Carousel Mode)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  // State for single-select (Grid Mode)
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');

  useEffect(() => {
    loadConfig()
      .then((loadedConfig) => {
        setConfig(loadedConfig);
        // Default Initialization
        if (loadedConfig.music.categories.length > 0) {
          // For Carousel: Select ALL initially
          setSelectedCategoryIds(loadedConfig.music.categories.map(c => c.id));
          // For Grid: Select FIRST initially
          setActiveCategoryId(loadedConfig.music.categories[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load config:', err);
        setError(err.message);
      });
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(c => c !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAll = () => {
    if (config) {
      setSelectedCategoryIds(config.music.categories.map(c => c.id));
    }
  };

  const clearAll = () => {
    setSelectedCategoryIds([]);
  }

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

  const isCarouselMode = config.music.layout === 'carousel';

  // Logic for Grid View
  const activeCategory = config.music.categories.find(c => c.id === activeCategoryId);

  // Logic for Carousel View
  const visibleCategories = config.music.categories.filter(c =>
    selectedCategoryIds.includes(c.id)
  );

  return (
    <section id="music" className="px-4 sm:px-6 md:px-8 py-20 bg-gradient-to-b from-white to-gray-50/50" aria-label="Music">
      <div id="music-section" className="max-w-7xl mx-auto">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-navy-900 mb-4 px-4">
            Music
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Explore performances across different styles and traditions
          </p>
        </motion.div>

        {/* ==================== GRID LAYOUT (LEGACY) ==================== */}
        {!isCarouselMode && (
          <>
            {/* Single Select Tabs */}
            <div className="sticky top-0 z-40 py-4 mb-8 -mx-4 px-4 bg-white/80 backdrop-blur-md border-b border-gray-100/50">
              <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-2 sm:gap-3">
                {config.music.categories.map((category) => {
                  const isActive = activeCategoryId === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategoryId(category.id)}
                      className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border shadow-sm hover:-translate-y-0.5 tracking-wide"
                      style={{
                        backgroundColor: isActive ? '#14213d' : '#ffffff',
                        color: isActive ? '#ffffff' : '#14213d',
                        borderColor: isActive ? '#b8860b' : '#e5e7eb',
                        borderWidth: isActive ? '2px' : '1px',
                        padding: isActive ? '9px 23px' : '10px 24px',
                      }}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid Content */}
            <div className="min-h-[400px]">
              <AnimatePresence mode='wait'>
                {activeCategory && (
                  <motion.div
                    key={activeCategory.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="text-center mb-8">
                      <p className="text-gray-600 max-w-2xl mx-auto">{activeCategory.description}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeCategory.videos.map((video, idx) => (
                        <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-premium border border-gray-100 hover:shadow-premium-xl transition-all duration-300">
                          <VideoEmbed
                            src={video.url}
                            title={video.title}
                          />
                          <div className="p-4">
                            <h4 className="text-lg font-medium text-navy-900 line-clamp-2">{video.title}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ==================== CAROUSEL LAYOUT (MODERN) ==================== */}
        {isCarouselMode && (
          <>
            {/* Multi-Select Filters */}
            <div className="sticky top-0 z-40 py-4 mb-8 -mx-4 px-4 bg-white/80 backdrop-blur-md border-b border-gray-100/50">
              <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-2 sm:gap-3">
                <button
                  onClick={selectedCategoryIds.length === config.music.categories.length ? clearAll : selectAll}
                  className="px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border hover:-translate-y-0.5 mr-4"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#14213d',
                    borderColor: '#e5e7eb',
                    borderWidth: '1px',
                    borderStyle: 'dashed'
                  }}
                >
                  {selectedCategoryIds.length === config.music.categories.length ? '✕ Clear Filters' : '✓ Select All'}
                </button>

                <div className="w-px h-8 bg-gray-200 hidden sm:block mr-4 self-center"></div>

                {config.music.categories.map((category) => {
                  const isActive = selectedCategoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border shadow-sm hover:-translate-y-0.5 tracking-wide"
                      style={{
                        backgroundColor: isActive ? '#14213d' : '#ffffff',
                        color: isActive ? '#ffffff' : '#14213d',
                        borderColor: isActive ? '#b8860b' : '#e5e7eb',
                        borderWidth: isActive ? '2px' : '1px',
                        padding: isActive ? '9px 23px' : '10px 24px',
                      }}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Carousels Stack */}
            <div className="space-y-2 min-h-[400px]">
              <AnimatePresence mode='popLayout'>
                {visibleCategories.map((category) => (
                  <motion.div
                    key={category.id}
                    layout // Enable layout animations for reordering/stacking
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <MusicCarousel
                      title={category.name}
                      description={category.description}
                      videos={category.videos}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {visibleCategories.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="text-6xl mb-4">🎵</div>
                  <p className="text-gray-500 text-lg">Select a category to view videos.</p>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
