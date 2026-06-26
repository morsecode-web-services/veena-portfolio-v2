'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import VideoModal from '@/components/ui/VideoModal';
import BackToTop from '@/components/ui/BackToTop';

interface ConditionalLayoutProps {
  children: React.ReactNode;
  config: any;
  jsonLdData: any;
}

export default function ConditionalLayout({
  children,
  config,
  jsonLdData,
}: ConditionalLayoutProps) {
  const pathname = usePathname() || '';

  const isComingSoon = pathname.startsWith('/coming-soon');
  const isStandalonePage =
    isComingSoon || pathname.startsWith('/link') || pathname.startsWith('/admin');

  return (
    <>
      {jsonLdData && !isStandalonePage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      )}
      {!isStandalonePage && (
        <>
          {/* Skip Navigation Links for Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-navy-900 focus:text-white focus:rounded-md focus:shadow-lg focus:font-medium"
          >
            Skip to main content
          </a>
          <a
            href="#navigation"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-48 focus:z-[100] focus:px-6 focus:py-3 focus:bg-navy-900 focus:text-white focus:rounded-md focus:shadow-lg focus:font-medium"
          >
            Skip to navigation
          </a>
        </>
      )}
      {!isStandalonePage && <Header config={config} />}
      {children}
      {!isStandalonePage && <Footer key="site-footer" config={config} />}
      {!isStandalonePage && <VideoModal />}
      {!isStandalonePage && <BackToTop />}
    </>
  );
}
