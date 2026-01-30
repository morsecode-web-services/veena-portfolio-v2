'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { m } from 'framer-motion';
import { debounce } from '@/lib/utils';
import Navigation from './Navigation';
import HeaderPDFButton from './HeaderPDFButton';
import Image from 'next/image';
import { getAssetPath } from '@/lib/config';
import type { SiteConfig } from '@/types';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  config?: SiteConfig;
}

export default function Header({ config }: HeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  // Hide header on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const logo = config?.artist.logo;
  const artistName = config?.artist.name || 'Aishwarya Manikarnike';

  const headerRef = useRef<HTMLElement>(null);

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

    // Track header height for other sticky elements
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      }
    };

    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }
    updateHeaderHeight();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [debouncedHandleScroll]);

  return (
    <m.header
      ref={headerRef}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-white shadow-premium-md border-b border-premium'
        : 'bg-transparent'
        }`}
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-3">
        <div className="flex items-center justify-between">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center"
          >
            <a href="#home" className="focus:outline-none focus:ring-2 focus:ring-blue-600 rounded flex items-center gap-2 md:gap-3 group">
              {logo && (
                <div className="relative w-8 h-8 md:w-10 md:h-10 transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src={getAssetPath(logo)}
                    alt={`${artistName} Logo`}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              )}
              <h1 className="text-base sm:text-lg md:text-xl font-serif font-bold text-navy-900 mb-0 group-hover:text-gold-600 transition-colors duration-300">
                {artistName}
              </h1>
            </a>
          </m.div>

          <div className="flex items-center gap-4">
            <Navigation />
            <m.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="hidden sm:block"
            >
              <HeaderPDFButton />
            </m.div>
          </div>
        </div>
      </div>
    </m.header>
  );
}
