'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { loadConfig } from '@/lib/config';
import FAQItem from '@/components/ui/FAQItem';
import type { SiteConfig } from '@/types';

export default function FAQ() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch((err) => {
        console.error('Failed to load config:', err);
        setError(err.message);
      });
  }, []);

  const handleToggle = (index: number) => {
    // Single-expansion mode: close if already open, otherwise open the clicked item
    setOpenIndex(openIndex === index ? null : index);
  };

  if (error) {
    return (
      <section id="faq" className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Error loading FAQ: {error}</p>
        </div>
      </section>
    );
  }

  if (!config) {
    return (
      <section id="faq" className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-3 border-gray-300 border-t-gold-600 rounded-full animate-spin mb-3" />
              <p className="text-gray-600">Loading FAQ...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="faq" className="px-4 sm:px-6 md:px-8" aria-label="Frequently asked questions">
      <div id="faq-section" className="max-w-4xl mx-auto">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-10 md:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-navy-900 mb-3 md:mb-4 px-4">
            Frequently Asked Questions
          </h2>
          <div className="w-24 sm:w-28 h-1 bg-gradient-gold mx-auto mb-4 sm:mb-5 md:mb-6 rounded-full"></div>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Find answers to common questions about performances, lessons, and bookings
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-lg shadow-premium-lg border border-premium overflow-hidden"
        >
          {config.faq.items.map((item, index) => (
            <FAQItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
              index={index}
            />
          ))}
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8 sm:mt-10 md:mt-12 px-4"
        >
          <p className="text-base sm:text-lg text-gray-700 mb-4">
            Have a question that&apos;s not answered here?
          </p>
          <motion.a
            href="#contact"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="inline-block px-6 sm:px-8 py-3 bg-gold-600 text-white font-semibold rounded-md hover:bg-gold-700 active:bg-gold-800 transition-all duration-300 shadow-premium-md hover:shadow-premium-lg text-sm sm:text-base touch-manipulation"
          >
            Get in Touch
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
