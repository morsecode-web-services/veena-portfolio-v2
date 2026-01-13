'use client';

import { useEffect, useState, useRef } from 'react';
import { m } from 'framer-motion';
import Image from 'next/image';
import { loadConfig } from '@/lib/config';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import type { SiteConfig } from '@/types';

export default function About() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch((err) => {
        console.error('Failed to load config:', err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <section id="about" className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Error loading configuration: {error}</p>
        </div>
      </section>
    );
  }

  if (!config) {
    return (
      <section id="about" className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-gray-600">Loading...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="about" className="px-4 sm:px-6 md:px-8" aria-label="About">
      <div id="about-section" className="max-w-7xl mx-auto">
        {/* Section Title */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-navy-900 mb-2 md:mb-3 px-4">
            About {config.artist.name.split(' ')[0]}
          </h2>
          <div className="w-20 sm:w-24 h-1 bg-gradient-gold mx-auto rounded-full"></div>
        </m.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Portrait Image Column - Sticky on Desktop */}
          <m.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24"
          >
            <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[3/4] rounded-2xl overflow-hidden shadow-premium-xl group" style={{ minHeight: '400px' }}>
              <div className="absolute inset-0 bg-navy-900/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <Image
                src={config.home.images.veena}
                alt={config.artist.name}
                width={800}
                height={1000}
                priority
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105"
              />
              {/* Decorative Frame */}
              <div className="absolute inset-4 border border-white/30 rounded-xl z-20 pointer-events-none"></div>
            </div>

            {/* Quick Facts Card - Desktop Only */}
            <div className="mt-8 p-6 bg-navy-50 rounded-2xl border border-navy-100 hidden lg:block shadow-sm">
              <h3 className="text-sm font-serif font-bold text-navy-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-px bg-gold-500"></span>
                Professional Highlights
              </h3>
              <ul className="space-y-4">
                {[
                  { label: "Grade", value: "‘A’-Grade Veena Artist (AIR)" },
                  { label: "Rank", value: "3rd Rank State (Vidwat Antima)" },
                  { label: "Legacy", value: "3rd Generation Musician" },
                  { label: "Awards", value: "Spirit of Youth (Best Instrumentalist)" }
                ].map((fact, i) => (
                  <li key={fact.label} className="flex flex-col">
                    <span className="text-[10px] text-gold-600 font-bold uppercase tracking-tight">{fact.label}</span>
                    <span className="text-xs xl:text-sm text-navy-800 font-medium">{fact.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </m.div>

          {/* Biography Text Column */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6 sm:space-y-8 relative">
            {/* Decorative vertical line */}
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-transparent via-gold-200 to-transparent opacity-50 hidden sm:block"></div>

            <div className="space-y-5">
              {config.artist.fullBio.map((block, index) => (
                <BiographySubsection
                  key={index}
                  block={block}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Subsection component with intersection observer
interface BiographySubsectionProps {
  block: string | { type: string; content?: string; items?: string[] };
  index: number;
}

const BiographySubsection = ({ block, index }: BiographySubsectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useIntersectionObserver(ref, { threshold: 0.1 });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated]);

  // Normalize block to object format if it's a string
  const contentBlock = typeof block === 'string'
    ? { type: 'paragraph', content: block }
    : block;

  const getDelay = () => Math.min(index * 0.1, 0.5); // Cap delay for long lists

  if (contentBlock.type === 'heading') {
    return (
      <m.div
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={hasAnimated ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
        transition={{ duration: 0.6, delay: getDelay() }}
        className="pt-4 sm:pt-6"
      >
        <h3 className="text-lg sm:text-xl font-serif font-bold text-navy-900 border-l-4 border-gold-500 pl-4">
          {contentBlock.content}
        </h3>
      </m.div>
    );
  }

  if (contentBlock.type === 'list') {
    return (
      <m.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: getDelay() }}
        className="pl-5"
      >
        <ul className="space-y-2">
          {contentBlock.items?.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm sm:text-base text-gray-700">
              <span className="text-gold-600 mt-1.5 text-[10px]">◆</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </m.div>
    );
  }

  // Default to paragraph
  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: getDelay() }}
      className="pl-5"
    >
      <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-light text-justify">
        {contentBlock.content}
      </p>
    </m.div>
  );
};
