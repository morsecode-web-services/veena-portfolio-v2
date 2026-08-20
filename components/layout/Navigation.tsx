import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes } from 'react-icons/fa';
import { Mail, Instagram, Youtube } from 'lucide-react';
import HeaderPDFButton from './HeaderPDFButton';
import { useRouter, usePathname } from 'next/navigation';
import { SiteConfig } from '@/types';

interface NavigationProps {
  config?: SiteConfig;
  isScrolled?: boolean;
}

export default function Navigation({ config, isScrolled = false }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Pages that show no nav links and no hamburger
  const isStandalonePage =
    pathname === '/hall-of-fame' ||
    pathname?.startsWith('/hall-of-fame') ||
    pathname === '/cohorts' ||
    pathname?.startsWith('/cohorts');

  const navItems = useMemo(() => {
    // Default fallback if no config
    const defaultItems = [
      { id: 'home', label: 'Home' },
      { id: 'about', label: 'About' },
      { id: 'gallery', label: 'Gallery' },
      { id: 'music', label: 'Music' },
      { id: 'events', label: 'Events' },
      { id: 'hall-of-fame', label: 'Hall of Fame', isPageLink: true, path: '/hall-of-fame' },
      { id: 'press', label: 'Press' },
      { id: 'faq', label: 'FAQ' },
      { id: 'contact', label: 'Contact' },
    ];

    if (!config?.layoutOrder) return defaultItems;

    const configItems = config.layoutOrder
      .filter((section) => !config.sections || config.sections[section] !== false)
      .map((section) => ({
        id: section.toLowerCase(),
        label: section,
      }));

    // Inject Hall of Fame into config navigation if not present
    return [
      ...configItems,
      { id: 'hall-of-fame', label: 'Hall of Fame', isPageLink: true, path: '/hall-of-fame' },
    ];
  }, [config]);

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Return focus to hamburger button when menu closes (skip standalone pages)
  useEffect(() => {
    if (
      !isStandalonePage &&
      !isMenuOpen &&
      hamburgerButtonRef.current &&
      document.activeElement !== hamburgerButtonRef.current
    ) {
      const wasMenuClosed = !isMenuOpen;
      if (wasMenuClosed && mounted) {
        hamburgerButtonRef.current.focus();
      }
    }
  }, [isMenuOpen, mounted, isStandalonePage]);

  useEffect(() => {
    setMounted(true);

    if (pathname === '/hall-of-fame') {
      setActiveSection('hall-of-fame');
      return;
    }

    const handleScroll = () => {
      requestAnimationFrame(() => {
        const sections = navItems.map((item) => item.id);
        const scrollPosition = window.scrollY + 120; // Slightly larger offset for trigger

        let currentSection = sections[0];

        for (const sectionId of sections) {
          const element = document.getElementById(sectionId);
          if (element && scrollPosition >= element.offsetTop) {
            currentSection = sectionId;
          }
        }

        setActiveSection(currentSection);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname, navItems]);

  const handleNavClick = (item: {
    id: string;
    label: string;
    isPageLink?: boolean;
    path?: string;
  }) => {
    if (item.isPageLink && item.path) {
      router.push(item.path);
      setIsMenuOpen(false);
      return;
    }

    if (pathname !== '/') {
      router.push(`/#${item.id}`);
      setIsMenuOpen(false);
      return;
    }

    const element = document.getElementById(item.id);
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
        <ul className="flex space-x-4 lg:space-x-6" role="menubar">
          {navItems.map((item, index) => (
            <m.li
              key={item.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
              role="none"
            >
              <button
                onClick={() => handleNavClick(item)}
                className={`relative text-xs font-medium transition-all duration-300 min-h-[44px] flex items-center justify-center px-1.5 lg:px-3 ${
                  activeSection === item.id
                    ? 'text-gold-600'
                    : isScrolled
                      ? 'text-charcoal-700 hover:text-gold-600'
                      : 'text-white hover:text-gold-300'
                }`}
                role="menuitem"
                aria-label={`Navigate to ${item.label} section`}
                aria-current={activeSection === item.id ? 'page' : undefined}
              >
                {item.label}
                {activeSection === item.id && (
                  <m.div
                    layoutId="activeSection"
                    className={`absolute -bottom-1 left-0 right-0 h-0.5 ${isScrolled ? 'bg-gold-600' : 'bg-gold-300'}`}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    aria-hidden="true"
                  />
                )}
              </button>
            </m.li>
          ))}
        </ul>
      </m.nav>

      {!isStandalonePage && (
        <button
          ref={hamburgerButtonRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`md:hidden transition-colors z-[10012] relative flex items-center justify-center ${
            isMenuOpen
              ? 'text-gold-600'
              : isScrolled
                ? 'text-charcoal-700 hover:text-gold-600'
                : 'text-white hover:text-gold-300'
          }`}
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      )}

      {/* Mobile Navigation Portal */}
      {mounted &&
        createPortal(
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
                  ref={mobileMenuRef}
                  id="mobile-menu"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-[110] md:hidden overflow-hidden flex flex-col"
                  role="navigation"
                  aria-label="Mobile navigation"
                >
                  {/* Header inside mobile menu */}
                  <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                    <span className="text-xs font-semibold text-slate-500 tracking-[0.2em] uppercase">
                      Menu
                    </span>
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
                            onClick={() => handleNavClick(item)}
                            className={`text-base font-medium py-3.5 px-2 transition-colors hover:text-gold-600 w-full text-left flex items-center justify-between ${
                              activeSection === item.id ? 'text-gold-600' : 'text-charcoal-700'
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

                      {/* Premium Quick Contact Section */}
                      {config?.artist.email && (
                        <li role="none" className="pt-12 mt-10 border-t border-slate-50 px-2 pb-12">
                          <div className="space-y-10">
                            {/* Social Icons Row - Uniform and High End */}
                            <div className="flex justify-start gap-4 px-2">
                              {config.socialMedia?.instagram && (
                                <a
                                  href={config.socialMedia.instagram}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-navy-400 hover:text-gold-600 hover:bg-gold-50 hover:shadow-premium-sm transition-all duration-500 border border-slate-100"
                                  aria-label="Instagram"
                                >
                                  <Instagram size={20} />
                                </a>
                              )}
                              {config.socialMedia?.youtube && (
                                <a
                                  href={config.socialMedia.youtube}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-navy-400 hover:text-gold-600 hover:bg-gold-50 hover:shadow-premium-sm transition-all duration-500 border border-slate-100"
                                  aria-label="YouTube"
                                >
                                  <Youtube size={20} />
                                </a>
                              )}
                              <a
                                href={`mailto:${config.artist.email}`}
                                className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-navy-400 hover:text-gold-600 hover:bg-gold-50 hover:shadow-premium-sm transition-all duration-500 border border-slate-100"
                                aria-label="Email"
                              >
                                <Mail size={20} />
                              </a>
                            </div>

                            {/* Email Display - Single Line Emphasis */}
                            <div className="space-y-4 px-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block">
                                Get in Touch
                              </span>
                              <a
                                href={`mailto:${config.artist.email}`}
                                className="group block"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <div className="flex flex-col">
                                  <span className="text-[13px] font-bold text-navy-900 group-hover:text-gold-600 transition-colors duration-300 break-all leading-tight">
                                    {config.artist.email}
                                  </span>
                                  <div className="h-0.5 w-8 bg-gold-400 mt-2 group-hover:w-full transition-all duration-500" />
                                </div>
                              </a>
                            </div>
                          </div>
                        </li>
                      )}
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
