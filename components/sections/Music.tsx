'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import type { SiteConfig } from '@/types';
import MusicCarousel from '@/components/features/MusicCarousel';
import { Video } from '@/types/video';
import { extractYoutubeId } from '@/lib/utils';
import { SectionWrapper } from '@/components/system/SectionWrapper';
import { SectionTitle } from '@/components/system/SectionTitle';

interface MusicProps {
  config: SiteConfig;
  dbVideos?: Video[];
}

export default function Music({ config, dbVideos }: MusicProps) {
  // State for main category selection (Veena or Vocal)
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string>(
    config.music.categories.length > 0 ? config.music.categories[0].id : ''
  );

  const selectedMainCategory = config.music.categories.find((c) => c.id === selectedMainCategoryId);

  return (
    <SectionWrapper id="music" background="white" spacing="base">
      <SectionTitle
        title="Music"
        description="Explore performances across different styles and traditions"
        alignment="center"
      />

      <div id="music-section">
        {/* Main Category Tabs (Veena / Vocal) - Minimal Style */}
        <div
          className="sticky z-40 py-6 mb-8 -mx-4 px-4 bg-white/98 border-b border-gray-100 shadow-sm"
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
                    className={`relative pb-4 text-sm font-bold transition-colors duration-300 ${
                      isActive ? 'text-navy-950' : 'text-navy-400 hover:text-navy-600'
                    }`}
                  >
                    {category.name.toUpperCase()}
                    {isActive && (
                      <m.div
                        layoutId="musicTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy-950"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
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
            <AnimatePresence mode="wait">
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
                  const dbMatches = (dbVideos || []).filter(
                    (v) =>
                      v.category_id === selectedMainCategory.id &&
                      v.subcategory_id === subcategory.id
                  );

                  dbMatches.forEach((v) => {
                    const id = extractYoutubeId(v.url);
                    if (id) {
                      seenIds.add(id);
                      subVideos.push({
                        url: v.url,
                        title: v.title,
                        thumbnail_url: v.thumbnail_url,
                      });
                    }
                  });

                  // 2. Add config videos if they aren't already there
                  (subcategory.videos || []).forEach((v) => {
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
    </SectionWrapper>
  );
}
