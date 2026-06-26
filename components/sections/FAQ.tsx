'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import FAQItem from '@/components/ui/FAQItem';
import { Button } from '@/components/system/Button';
import { SectionWrapper } from '@/components/system/SectionWrapper';
import { SectionTitle } from '@/components/system/SectionTitle';
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
    <SectionWrapper id="faq" background="cream" spacing="base">
      <SectionTitle
        title="Frequently Asked Questions"
        description="Find answers to common questions about performances, lessons, and bookings"
        alignment="center"
      />

      <div id="faq-section">
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
          <p className="text-base sm:text-lg text-charcoal-700 mb-4">
            Have a question that&apos;s not answered here?
          </p>
          <Button
            variant="secondary"
            size="base"
            onClick={() => {
              const contactSection = document.getElementById('contact');
              if (contactSection) {
                const offset = 80;
                const elementPosition = contactSection.offsetTop - offset;
                window.scrollTo({
                  top: elementPosition,
                  behavior: 'smooth',
                });
              }
            }}
          >
            Get in Touch
          </Button>
        </m.div>
      </div>
    </SectionWrapper>
  );
}
