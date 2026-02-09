'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import type { SiteConfig } from '@/types';
import MusicCarousel from '@/components/features/MusicCarousel';
import { Video } from '@/types/video';
import { extractYoutubeId } from '@/lib/utils';

interface MusicProps {
  config: SiteConfig;
  dbVideos?: Video[];
}

export default function Music({ config, dbVideos }: MusicProps) {
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

        {/* Main Category Tabs (Veena / Vocal) - Minimal Style */}
        <div
          className="sticky z-40 py-6 mb-8 -mx-4 px-4 bg-white/95 backdrop-blur-md"
          style={{ top: 'var(--header-height, 70px)' }}
        >
          <div className="flex justify-center">
            <div className="flex gap-8">
              {config.music.categories.map((category) => {
                const isActive = selectedMainCategoryId === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedMainCategoryId(category.id)}
                    className={`relative pb-4 text-sm font-bold transition-colors duration-300 ${isActive
                      ? 'text-navy-950'
                      : 'text-navy-400 hover:text-navy-600'
                      }`}
                  >
                    {category.name.toUpperCase()}
                    {isActive && (
                      <m.div
                        layoutId="musicTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy-950"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
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
                {selectedMainCategory.subcategories.map((subcategory) => {
                  // Merge and deduplicate by YouTube ID
                  const seenIds = new Set<string>();
                  const subVideos: any[] = [];

                  // 1. Add DB videos first (better metadata)
                  const dbMatches = (dbVideos || []).filter(v =>
                    v.category_id === selectedMainCategory.id &&
                    v.subcategory_id === subcategory.id
                  );

                  dbMatches.forEach(v => {
                    const id = extractYoutubeId(v.url);
                    if (id) {
                      seenIds.add(id);
                      subVideos.push({
                        url: v.url,
                        title: v.title,
                        thumbnail_url: v.thumbnail_url
                      });
                    }
                  });

                  // 2. Add config videos if they aren't already there
                  (subcategory.videos || []).forEach(v => {
                    const id = extractYoutubeId(v.url);
                    if (id && !seenIds.has(id)) {
                      seenIds.add(id);
                      subVideos.push(v);
                    }
                  });

                  if (subVideos.length === 0) return null;

                  return (
                    <m.div
                      key={subcategory.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <MusicCarousel
                        title={subcategory.name}
                        description={subcategory.description}
                        videos={subVideos as any}
                      />
                    </m.div>
                  );
                })}
              </m.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
