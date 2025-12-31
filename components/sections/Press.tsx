'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { loadConfig } from '@/lib/config';
import type { SiteConfig } from '@/types';
import PressCard from '@/components/ui/PressCard';

export default function Press() {
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
      <section id="press" className="px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Error loading press articles: {error}</p>
        </div>
      </section>
    );
  }

  if (!config) {
    return (
      <section id="press" className="px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-gray-600">Loading press articles...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="press" className="px-4 sm:px-6 md:px-8" aria-label="Press and recognition">
      <div id="press-section" className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-10 md:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-navy-900 mb-2 md:mb-3 px-4">
            Press & Recognition
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4 leading-relaxed">
            Featured articles and media coverage highlighting achievements and contributions to classical music
          </p>
        </motion.div>

        {/* Press Articles Grid */}
        {config.press.articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {config.press.articles.map((article, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <PressCard article={article} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 px-4">
            <p className="text-base sm:text-lg">No press articles available at this time.</p>
          </div>
        )}
      </div>
    </section>
  );
}
