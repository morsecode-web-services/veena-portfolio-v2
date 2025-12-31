'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FAQItem as FAQItemType } from '@/types';

interface FAQItemProps {
  item: FAQItemType;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

export default function FAQItem({ item, isOpen, onToggle, index }: FAQItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(0);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="border-b border-gray-200 last:border-b-0"
    >
      <button
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
        className="w-full text-left py-4 px-5 flex items-center justify-between hover:bg-cream-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:ring-inset"
      >
        <h3 className="text-base md:text-lg font-serif font-semibold text-navy-900 pr-6" id={`faq-question-${index}`}>
          {item.question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-shrink-0"
        >
          <svg
            className="w-5 h-5 text-gold-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? height : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          height: { duration: 0.3, ease: 'easeInOut' },
          opacity: { duration: 0.2, ease: 'easeInOut' },
        }}
        className="overflow-hidden"
        id={`faq-answer-${index}`}
        role="region"
        aria-labelledby={`faq-question-${index}`}
      >
        <div ref={contentRef} className="px-5 pb-5">
          <p className="text-sm md:text-base text-gray-700 leading-relaxed font-light">
            {item.answer}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
