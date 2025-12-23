'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { debounce } from '@/lib/utils';
import Navigation from './Navigation';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedHandleScroll = useCallback(
    debounce(() => {
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 20);
      });
    }, 10),
    []
  );

  useEffect(() => {
    const handleScroll = () => {
      debouncedHandleScroll();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [debouncedHandleScroll]);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-white shadow-premium-md border-b border-premium'
        : 'bg-transparent'
        }`}
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center"
          >
            <a href="#home" className="focus:outline-none focus:ring-2 focus:ring-blue-600 rounded">
              <h1 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-navy-900">
                Aishwarya Manikarnike
              </h1>
            </a>
          </motion.div>
          <Navigation />
        </div>
      </div>
    </motion.header>
  );
}
