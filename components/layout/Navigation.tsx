'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes } from 'react-icons/fa';
import HeaderPDFButton from './HeaderPDFButton';

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
      <m.nav
        id="navigation"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="hidden md:block"
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="flex space-x-6" role="menubar">
          {navItems.map((item, index) => (
            <m.li
              key={item.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
              role="none"
            >
              <button
                onClick={() => scrollToSection(item.id)}
                className="relative text-xs font-medium transition-all duration-300 hover:text-gold-600 min-h-[44px] min-w-[44px] flex items-center justify-center px-3"
                style={{ color: activeSection === item.id ? '#8B6914' : '#334155' }}
                role="menuitem"
                aria-label={`Navigate to ${item.label} section`}
                aria-current={activeSection === item.id ? 'page' : undefined}
              >
                {item.label}
                {activeSection === item.id && (
                  <m.div
                    layoutId="activeSection"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gold-600"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    aria-hidden="true"
                  />
                )}
              </button>
            </m.li>
          ))}
        </ul>
      </m.nav>

      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`md:hidden transition-colors z-[10012] relative flex items-center justify-center ${isMenuOpen ? 'text-gold-600' : 'text-gray-700'
          } hover:text-gold-600`}
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-menu"
      >
        {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Mobile Navigation Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/60 z-[100] md:hidden backdrop-blur-sm"
                aria-hidden="true"
              />

              {/* Slide-in Menu */}
              <m.nav
                id="mobile-menu"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed top-0 right-0 bottom-0 w-72 bg-white shadow-2xl z-[110] md:hidden overflow-hidden flex flex-col"
                role="navigation"
                aria-label="Mobile navigation"
              >
                {/* Header inside mobile menu */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
                  <span className="text-[10px] font-semibold text-gray-500 tracking-[0.2em] uppercase">Menu</span>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-gold-600 hover:bg-gold-50 rounded-full transition-colors"
                    aria-label="Close menu"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
                  <ul className="flex flex-col space-y-1" role="menu">
                    {navItems.map((item) => (
                      <li key={item.id} role="none">
                        <button
                          onClick={() => scrollToSection(item.id)}
                          className={`text-base font-medium py-3.5 px-2 transition-colors hover:text-gold-600 w-full text-left flex items-center justify-between ${activeSection === item.id
                            ? 'text-gold-600'
                            : 'text-gray-700'
                            }`}
                          role="menuitem"
                          aria-label={`Navigate to ${item.label} section`}
                          aria-current={activeSection === item.id ? 'page' : undefined}
                        >
                          {item.label}
                          {activeSection === item.id && (
                            <m.div
                              layoutId="activeDot"
                              className="w-1.5 h-1.5 rounded-full bg-gold-600"
                            />
                          )}
                        </button>
                      </li>
                    ))}
                    <li role="none" className="pt-4 border-t border-gray-100 mt-4">
                      <HeaderPDFButton showLabel={true} />
                    </li>
                  </ul>
                </div>
              </m.nav>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
