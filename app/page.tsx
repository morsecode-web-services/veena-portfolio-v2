'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import HomeSection from '@/components/sections/Home';
import About from '@/components/sections/About';
import MusicalBackground from '@/components/ui/MusicalBackground';

// Code-split heavy components for better performance
const Gallery = dynamic(() => import('@/components/sections/Gallery'), {
  loading: () => (
    <div className="py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="animate-pulse text-gray-600 text-sm">Loading gallery...</div>
      </div>
    </div>
  ),
  ssr: true,
});

const Music = dynamic(() => import('@/components/sections/Music'), {
  loading: () => (
    <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="animate-pulse text-gray-600">Loading music...</div>
      </div>
    </div>
  ),
  ssr: true,
});

const Press = dynamic(() => import('@/components/sections/Press'), {
  loading: () => (
    <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="animate-pulse text-gray-600">Loading press...</div>
      </div>
    </div>
  ),
  ssr: true,
});

const FAQ = dynamic(() => import('@/components/sections/FAQ'), {
  loading: () => (
    <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="animate-pulse text-gray-600">Loading FAQ...</div>
      </div>
    </div>
  ),
  ssr: true,
});

const Contact = dynamic(() => import('@/components/sections/Contact'), {
  loading: () => (
    <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="animate-pulse text-gray-600">Loading contact form...</div>
      </div>
    </div>
  ),
  ssr: true,
});

// PDF generator is heavy and rarely used - load only when needed
const PortfolioGenerator = dynamic(() => import('@/components/features/PortfolioGenerator'), {
  loading: () => (
    <div className="flex justify-center items-center py-8">
      <div className="animate-pulse text-gray-600">Loading portfolio generator...</div>
    </div>
  ),
  ssr: false, // Client-side only for PDF generation
});

export default function Page() {
  return (
    <motion.main
      id="main-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
      role="main"
    >
      {/* Home Section - Hero with full viewport presence */}
      <div className="pt-24 pb-10 sm:pt-28 sm:pb-12 md:pt-32 md:pb-16 bg-cream-50 relative overflow-hidden">
        <MusicalBackground />
        <div className="relative z-10">
          <SectionErrorBoundary sectionName="Home">
            <HomeSection />
          </SectionErrorBoundary>
        </div>
      </div>

      <div className="py-8 sm:py-11 md:py-14 bg-white">
        <SectionErrorBoundary sectionName="About">
          <About />
        </SectionErrorBoundary>
      </div>

      {/* Gallery Section - Subtle background variation */}
      <div className="py-8 sm:py-11 md:py-14 bg-cream-50">
        <SectionErrorBoundary sectionName="Gallery">
          <Gallery />
        </SectionErrorBoundary>
      </div>

      {/* Music Section - Clean white background */}
      <div className="py-8 sm:py-11 md:py-14 bg-white">
        <SectionErrorBoundary sectionName="Music">
          <Music />
        </SectionErrorBoundary>
      </div>

      {/* Press Section - Sophisticated gray tone */}
      <div className="py-8 sm:py-11 md:py-14 bg-cream-50">
        <SectionErrorBoundary sectionName="Press">
          <Press />
        </SectionErrorBoundary>
      </div>

      {/* FAQ Section - Return to white for clarity */}
      <div className="py-8 sm:py-11 md:py-14 bg-white">
        <SectionErrorBoundary sectionName="FAQ">
          <FAQ />
        </SectionErrorBoundary>
      </div>

      {/* Contact Section - Elegant navy accent background */}
      <div className="py-8 sm:py-11 md:py-14 bg-cream-50">
        <SectionErrorBoundary sectionName="Contact">
          <Contact />
        </SectionErrorBoundary>
      </div>

      {/* Portfolio Download Section */}
      <div id="pdf-generator-section" className="py-8 sm:py-10 md:py-12 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6 sm:mb-7 md:mb-8"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-navy-900 mb-2 md:mb-3 px-4">
              Download Portfolio
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4 leading-relaxed">
              Get a comprehensive PDF portfolio with all sections, images, and clickable links
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SectionErrorBoundary sectionName="Portfolio Generator">
              <PortfolioGenerator />
            </SectionErrorBoundary>
          </motion.div>
        </div>
      </div>
    </motion.main>
  );
}
