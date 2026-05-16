'use client';

import { m } from 'framer-motion';
import { useMemo } from 'react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import VideoEmbed from '@/components/ui/VideoEmbed';
import { FeaturedCarousel } from '@/components/ui/FeaturedCarousel';
import type { SiteConfig, FeaturedCarouselItem } from '@/types';
import { Video } from '@/types/video';
import { useEvents } from '@/hooks/useEvents';
import { getNextUpcomingEvent, formatEventDate } from '@/lib/events';
import { getAssetPath } from '@/lib/config';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface HomeProps {
  config: SiteConfig;
  dbVideos?: Video[];
}

export default function Home({ config, dbVideos }: HomeProps) {
  const { events } = useEvents();
  const shouldReduceMotion = useReducedMotion();

  // Build carousel items array
  const carouselItems = useMemo(() => {
    if (!config?.home?.featuredCarousel?.enabled) {
      return [];
    }

    const carouselConfig = config.home.featuredCarousel;
    const items: FeaturedCarouselItem[] = carouselConfig.items.map(item => ({
      ...item,
      type: 'custom' as const
    }));

    // Add upcoming event if enabled
    if (carouselConfig.showUpcomingEvent !== false) {
      const nextEvent = getNextUpcomingEvent(events);
      if (nextEvent) {
        items.push({
          id: `event-${nextEvent.id}`,
          type: 'event' as const,
          image: nextEvent.image_url || undefined,
          title: nextEvent.title,
          description: `${formatEventDate(nextEvent.date)} • ${nextEvent.venue}, ${nextEvent.city}`,
          subtitle: carouselConfig.eventSubtitle || 'Upcoming Event',
          link: nextEvent.booking_url || '#events',
          linkText: carouselConfig.eventLinkText || 'View Event Details'
        });
      }
    }

    return items;
  }, [events, config]);

  // Guard clause just in case, though parent should handle validity
  if (!config) return null;

  const carouselConfig = config.home.featuredCarousel;
  const heroBackground = config.home.heroBackground || 'https://placehold.co/1920x1080/14213d/d4af37?text=Hero+Image';
  const heroBackgroundPosition = config.home.heroBackgroundPosition || 'center 35%';
  const heroTagline = config.home.heroTagline || 'Classical Veena Artiste';
  const heroStats = config.home.heroStats || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as any },
    },
  };

  return (
    <section id="home" aria-label="Home">
      {/* Full-Height Hero Section with Background Image */}
      <div className="relative h-screen min-h-[700px] w-full overflow-hidden">
        {/* Layer 1: Background Image */}
        <div className="absolute inset-0">
          <m.div
            initial={shouldReduceMotion ? undefined : { scale: 1.05 }}
            animate={shouldReduceMotion ? undefined : { scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 1.2, ease: "easeOut" }}
            className="h-full w-full"
          >
            {getAssetPath(heroBackground).includes('cloudinary.com') ? (
              <CldImage
                src={getAssetPath(heroBackground)}
                alt="Hero background"
                fill
                className="object-cover"
                style={{ objectPosition: heroBackgroundPosition }}
                priority
                sizes="(max-width: 768px) 100vw, 100vw"
              />
            ) : (
              <Image
                src={getAssetPath(heroBackground)}
                alt="Hero background"
                fill
                className="object-cover"
                style={{ objectPosition: heroBackgroundPosition }}
                priority
                quality={80}
                sizes="(max-width: 768px) 100vw, 100vw"
              />
            )}
          </m.div>

          {/* Overlays for Depth */}
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_50%,transparent_0%,rgba(0,0,0,0.6)_100%)]"></div>
        </div>

        {/* Layer 2: Content Overlay */}
        <m.div
          variants={shouldReduceMotion ? {} : containerVariants}
          initial={shouldReduceMotion ? undefined : "hidden"}
          animate={shouldReduceMotion ? undefined : "visible"}
          className="relative h-full flex flex-col justify-between px-6 sm:px-12 md:px-16 lg:px-20 py-12 sm:py-16 md:py-20 z-20"
        >
          {/* Top Section - Small Tagline */}
          <m.div variants={itemVariants} className="pt-8 hidden sm:block">
            <p className="text-xs sm:text-sm md:text-base tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] text-gold-500 font-light uppercase">
              {heroTagline}
            </p>
          </m.div>

          {/* Center-Left Section - Large Name */}
          <div className="flex-1 flex items-center -translate-y-16 sm:translate-y-0">
            <div className="max-w-4xl">
              <m.h1
                variants={shouldReduceMotion ? {} : itemVariants}
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[6.5rem] font-serif font-bold text-white leading-[0.85] tracking-tighter"
              >
                {config.artist.name}
              </m.h1>

              <m.div
                variants={itemVariants}
                className="h-1 w-24 bg-gold-500 mt-8 sm:mt-12"
              ></m.div>
            </div>
          </div>

          {/* Bottom Section - Stats and Featured Work */}
          <div className="flex flex-col lg:flex-row justify-between items-end gap-6 lg:gap-16 pb-16 sm:pb-8 w-full">
            {/* Bottom Left - Stats */}
            {heroStats.length > 0 && (
              <m.div variants={itemVariants} className="hidden lg:block lg:w-72 flex-shrink-0 space-y-8 sm:space-y-10">
                {heroStats.map((stat, idx) => (
                  <div key={idx} className="group">
                    <p className="text-xs tracking-[0.25em] text-gold-200/60 font-light uppercase mb-2 group-hover:text-gold-400/80 transition-colors">
                      {stat.label}
                    </p>
                    <p className="text-lg sm:text-xl md:text-2xl font-serif text-white italic border-l-2 border-white/10 pl-4 py-1 whitespace-pre-line">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </m.div>
            )}

            {/* Bottom Right - Featured Carousel */}
            {carouselItems.length > 0 && (
              <m.div variants={itemVariants} className="w-fit ml-auto max-w-2xl lg:max-w-4xl">
                <FeaturedCarousel
                  items={carouselItems}
                  autoScrollInterval={carouselConfig?.autoScrollInterval}
                />
              </m.div>
            )}
          </div>

          {/* Scroll Hint */}
          <m.div
            variants={itemVariants}
            className="absolute bottom-4 sm:bottom-10 left-0 right-0 flex flex-col items-center gap-1 sm:gap-2 pointer-events-none"
          >
            <span className="text-xs tracking-[0.3em] text-gold-300/40 uppercase font-light">Scroll</span>
            <div className="w-px h-8 sm:h-12 bg-gradient-to-b from-gold-500/80 to-transparent">
              <m.div
                animate={shouldReduceMotion ? {} : { y: [0, 24, 0], opacity: [0, 1, 0] }}
                transition={{ duration: shouldReduceMotion ? 0 : 2, repeat: shouldReduceMotion ? 0 : Infinity, ease: "easeInOut" }}
                className="w-full h-1/2 bg-white"
              />
            </div>
          </m.div>
        </m.div>
      </div>


      {/* Featured YouTube videos */}
      {((dbVideos && dbVideos.length > 0) || (config.home.featuredVideos && config.home.featuredVideos.length > 0)) && (
        <div className="px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20 bg-cream-50">
          <div className="max-w-7xl mx-auto">
            <m.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] as any }}
              role="region"
              aria-label="Featured performances"
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-semibold text-navy-900 text-center mb-8 sm:mb-10 md:mb-12">
                Featured Performances
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {(dbVideos && dbVideos.length > 0 ? dbVideos : config.home.featuredVideos).map((video, index) => {
                  const videoUrl = typeof video === 'string' ? video : video.url;
                  const videoTitle = typeof video === 'string' ? `Featured performance ${index + 1}` : video.title || `Featured performance ${index + 1}`;
                  const thumbnailUrl = typeof video === 'object' && 'thumbnail_url' in video ? (video as any).thumbnail_url : null;

                  return (
                    <m.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] as any }}
                      whileHover={{ y: -5, transition: { duration: 0.3 } }}
                      className="rounded-xl overflow-hidden shadow-premium hover:shadow-premium-md transition-all duration-300"
                    >
                      <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden group/card hover:shadow-premium-lg transition-all duration-500">
                        {/* Video Top Section */}
                        <div className="relative aspect-video">
                          <VideoEmbed
                            src={videoUrl}
                            title={videoTitle}
                            thumbnailUrl={thumbnailUrl}
                            retryCount={2}
                          />
                        </div>

                        {/* Integrated Content Section - Clean Look */}
                        <div className="p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                          <h3 className="text-sm sm:text-base font-serif font-bold text-navy-900 group-hover/card:text-gold-600 transition-colors duration-300 leading-snug">
                            {videoTitle}
                          </h3>
                        </div>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </m.div>
          </div>
        </div>
      )}
    </section>
  );
}
