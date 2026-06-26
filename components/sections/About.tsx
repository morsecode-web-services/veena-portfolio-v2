'use client';

import { useState, useRef, useEffect } from 'react';
import { m } from 'framer-motion';
import Image from 'next/image';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { getAssetPath } from '@/lib/config';
import type { SiteConfig } from '@/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SectionWrapper } from '@/components/system/SectionWrapper';
import { SectionTitle } from '@/components/system/SectionTitle';

interface AboutProps {
  config: SiteConfig;
}

export default function About({ config }: AboutProps) {
  // Config passed as prop, no loading state needed
  const shouldReduceMotion = useReducedMotion();

  return (
    <SectionWrapper id="about" spacing="base">
      <SectionTitle title={`About ${config.artist.name.split(' ')[0]}`} alignment="center" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Portrait Image Column - Sticky on Desktop */}
        <m.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, x: -30 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8 }}
          className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24"
        >
          <div
            className="relative aspect-[4/5] sm:aspect-square lg:aspect-[3/4] rounded-2xl overflow-hidden shadow-premium-xl group"
            style={{ minHeight: '400px' }}
          >
            <div className="absolute inset-0 bg-navy-900/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
            <Image
              src={getAssetPath(config.home.images.veena)}
              alt={config.artist.name}
              fill
              className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Decorative Frame */}
            <div className="absolute inset-4 border border-white/30 rounded-xl z-20 pointer-events-none"></div>
          </div>

          {/* Quick Facts Card - Desktop Only */}
          <div className="mt-8 p-6 bg-navy-50 rounded-2xl border border-navy-100 hidden lg:block shadow-sm">
            <h3 className="text-sm font-serif font-bold text-navy-900 mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-8 h-px bg-gold-500"></span>
              Professional Highlights
              <span className="w-8 h-px bg-gold-500"></span>
            </h3>
            <ul className="space-y-4">
              {[
                { label: 'Grade', value: '‘A’-Grade Veena Artist (AIR)' },
                { label: 'Rank', value: '3rd Rank State (Vidwat Antima)' },
                { label: 'Legacy', value: '3rd Generation Musician' },
                {
                  label: 'Awards',
                  value: 'Spirit of Youth , The Music Academy (Best Instrumentalist)',
                },
              ].map((fact, i) => (
                <li key={fact.label} className="flex flex-col">
                  <span className="text-xs text-gold-600 font-bold uppercase tracking-tight">
                    {fact.label}
                  </span>
                  <span className="text-xs xl:text-sm text-navy-800 font-medium">{fact.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </m.div>

        {/* Biography Text Column */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 sm:space-y-8 relative">
          <div className="space-y-5">
            {config.artist.fullBio.map((block, index) => (
              <BiographySubsection key={index} block={block} index={index} />
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
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
  const contentBlock = typeof block === 'string' ? { type: 'paragraph', content: block } : block;

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
            <li key={idx} className="flex items-start gap-2 text-sm sm:text-base text-charcoal-700">
              <span className="text-gold-600 mt-1.5 text-xs">◆</span>
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
      <p className="text-sm sm:text-base text-charcoal-700 leading-relaxed font-light text-justify">
        {contentBlock.content}
      </p>
    </m.div>
  );
};
