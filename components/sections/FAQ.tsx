'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import FAQItem from '@/components/ui/FAQItem';
import type { SiteConfig } from '@/types';

interface FAQProps {
  config: SiteConfig;
}

export default function FAQ({ config }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    // Single-expansion mode: close if already open, otherwise open the clicked item
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="px-4 sm:px-6 md:px-8" aria-label="Frequently asked questions">
      <div id="faq-section" className="max-w-4xl mx-auto">
        {/* Section Title */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8 md:mb-10"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-navy-900 mb-2 md:mb-3 px-4">
            Frequently Asked Questions
          </h2>
          <div className="w-20 sm:w-24 h-1 bg-gradient-gold mx-auto mb-3 sm:mb-4 md:mb-5 rounded-full"></div>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4 leading-relaxed">
            Find answers to common questions about performances, lessons, and bookings
          </p>
        </m.div>

        {/* FAQ Accordion */}
        <m.div
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
        </m.div>

        {/* Contact CTA */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8 sm:mt-10 md:mt-12 px-4"
        >
          <p className="text-base sm:text-lg text-gray-700 mb-4">
            Have a question that&apos;s not answered here?
          </p>
          <m.a
            href="#contact"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 bg-gold-600 text-white font-semibold rounded-md hover:bg-gold-700 active:bg-gold-800 transition-all duration-300 shadow-premium-md hover:shadow-premium-lg text-xs sm:text-sm touch-manipulation"
          >
            Get in Touch
          </m.a>
        </m.div>
      </div>
    </section>
  );
}
