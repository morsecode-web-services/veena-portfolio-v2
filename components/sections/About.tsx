'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
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
      <div id="about-section" className="max-w-5xl mx-auto">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-navy-900 mb-3 md:mb-4 px-4">
            About {config.artist.name.split(' ')[0]}
          </h2>
          <div className="w-24 sm:w-28 h-1 bg-gradient-gold mx-auto rounded-full"></div>
        </motion.div>

        {/* Biography Subsections */}
        <div className="space-y-6 sm:space-y-8 md:space-y-10 px-2 relative">
          {/* Decorative vertical line */}
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-transparent via-gold-200 to-transparent opacity-50 hidden sm:block"></div>

          {config.artist.fullBio.map((block, index) => (
            <BiographySubsection
              key={index}
              block={block}
              index={index}
            />
          ))}
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
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={hasAnimated ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
        transition={{ duration: 0.6, delay: getDelay() }}
        className="pt-6 sm:pt-8"
      >
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-navy-900 border-l-4 border-gold-500 pl-4">
          {contentBlock.content}
        </h3>
      </motion.div>
    );
  }

  if (contentBlock.type === 'list') {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: getDelay() }}
        className="pl-4 sm:pl-8"
      >
        <ul className="space-y-3">
          {contentBlock.items?.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-base sm:text-lg text-gray-700">
              <span className="text-gold-600 mt-1.5 text-xs">◆</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    );
  }

  // Default to paragraph
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: getDelay() }}
      className="pl-0 sm:pl-4"
    >
      <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-light text-justify">
        {contentBlock.content}
      </p>
    </motion.div>
  );
};
