'use client';

import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import ImageGallery from '@/components/ui/ImageGallery';
import type { SiteConfig } from '@/types';
import { EmptyState } from '@/components/system/EmptyState';
import { supabase } from '@/lib/supabase';

interface GalleryProps {
  config: SiteConfig;
}

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}

export default function Gallery({ config }: GalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImages() {
      try {
        // 1. Try fetching from Supabase
        const { data, error } = await supabase
          .from('gallery_images')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setImages(data);
        } else {
          // 2. Fallback to site-config
          if (config.gallery?.images) {
            setImages(config.gallery.images);
          }
        }
      } catch (err) {
        console.warn('Using static gallery config due to error:', err);
        if (config.gallery?.images) {
          setImages(config.gallery.images);
        }
      } finally {
        setLoading(false);
      }
    }

    loadImages();
  }, [config.gallery?.images]);

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
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto px-4 leading-relaxed">
            A visual journey through memorable performances and musical moments
          </p>
        </m.div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[4/3] bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        ) : images.length > 0 ? (
          <ImageGallery images={images} />
        ) : (
          <EmptyState variant="gallery" />
        )}
      </div>
    </section>
  );
}
