'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes } from 'react-icons/fa';

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'music', label: 'Music' },
  { id: 'press', label: 'Press' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' },
];

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      requestAnimationFrame(() => {
        const sections = navItems.map((item) => item.id);
        const scrollPosition = window.scrollY + 100;

        for (const sectionId of sections) {
          const element = document.getElementById(sectionId);
          if (element) {
            const { offsetTop, offsetHeight } = element;
            if (
              scrollPosition >= offsetTop &&
              scrollPosition < offsetTop + offsetHeight
            ) {
              setActiveSection(sectionId);
              break;
            }
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Header height offset
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        id="navigation"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="hidden md:block"
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="flex space-x-8" role="menubar">
          {navItems.map((item, index) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
              role="none"
            >
              <button
                onClick={() => scrollToSection(item.id)}
                className={`relative text-sm font-medium transition-all duration-300 hover:text-blue-600 hover:scale-105 ${activeSection === item.id
                    ? 'text-blue-600'
                    : 'text-gray-700'
                  }`}
                role="menuitem"
                aria-label={`Navigate to ${item.label} section`}
                aria-current={activeSection === item.id ? 'page' : undefined}
              >
                {item.label}
                {activeSection === item.id && (
                  <motion.div
                    layoutId="activeSection"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    aria-hidden="true"
                  />
                )}
              </button>
            </motion.li>
          ))}
        </ul>
      </motion.nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden text-gray-700 hover:text-blue-600 transition-colors z-50 relative"
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-menu"
      >
        {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Mobile Navigation Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-[9998] md:hidden"
                aria-hidden="true"
              />

              {/* Slide-in Menu */}
              <motion.nav
                id="mobile-menu"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-2xl z-[9999] md:hidden"
                role="navigation"
                aria-label="Mobile navigation"
              >
                <div className="flex flex-col h-full pt-20 px-6">
                  <ul className="flex flex-col space-y-6" role="menu">
                    {navItems.map((item) => (
                      <li key={item.id} role="none">
                        <button
                          onClick={() => scrollToSection(item.id)}
                          className={`text-lg font-medium transition-colors hover:text-blue-600 w-full text-left ${activeSection === item.id
                              ? 'text-blue-600'
                              : 'text-gray-700'
                            }`}
                          role="menuitem"
                          aria-label={`Navigate to ${item.label} section`}
                          aria-current={activeSection === item.id ? 'page' : undefined}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
