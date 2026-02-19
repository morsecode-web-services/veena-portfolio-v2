'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import ImageGallery from '@/components/ui/ImageGallery';
import { EmptyState } from '@/components/system/EmptyState';
import { SectionWrapper } from '@/components/system/SectionWrapper';
import { SectionTitle } from '@/components/system/SectionTitle';
import type { SiteConfig } from '@/types';

interface GalleryProps {
  config: SiteConfig;
}

export default function Gallery({ config }: GalleryProps) {
  // Config passed as prop, no loading state needed

  return (
    <SectionWrapper id="gallery" background="cream" spacing="base">
      <SectionTitle
        title="Performance Gallery"
        description="A visual journey through memorable performances and musical moments"
        alignment="center"
      />

      <div id="gallery-section">

        {/* Gallery Grid */}
        {config.gallery?.images && config.gallery.images.length > 0 ? (
          <ImageGallery images={config.gallery.images} />
        ) : (
          <EmptyState variant="gallery" />
        )}
      </div>
    </SectionWrapper>
  );
}

