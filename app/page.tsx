import dynamic from 'next/dynamic';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import HomeSection from '@/components/sections/Home';
import MusicalBackground from '@/components/ui/MusicalBackground';
import PortfolioGeneratorWrapper from '@/components/features/PortfolioGeneratorWrapper';
import siteConfig from '@/public/config/site-config.json';
import { validateConfig } from '@/lib/config';

// Code-split heavy components for better performance
// Removed ssr: false to allow Server Components to render the shell HTML (improved LCP/SEO)
// The JavaScript chunks will still be lazy-loaded
const Gallery = dynamic(() => import('@/components/sections/Gallery'), {
  loading: () => (
    <div className="py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="animate-pulse text-gray-600 text-sm">Loading gallery...</div>
      </div>
    </div>
  ),
});

const Music = dynamic(() => import('@/components/sections/Music'), {
  loading: () => (
    <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="animate-pulse text-gray-600">Loading music...</div>
      </div>
    </div>
  ),
});

const Press = dynamic(() => import('@/components/sections/Press'), {
  loading: () => (
    <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="animate-pulse text-gray-600">Loading press...</div>
      </div>
    </div>
  ),
});

const FAQ = dynamic(() => import('@/components/sections/FAQ'), {
  loading: () => (
    <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="animate-pulse text-gray-600">Loading FAQ...</div>
      </div>
    </div>
  ),
});

const Contact = dynamic(() => import('@/components/sections/Contact'), {
  loading: () => (
    <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="animate-pulse text-gray-600">Loading contact form...</div>
      </div>
    </div>
  ),
});

// About component is high up, load normally via dynamic imports (SSR enabled)
const About = dynamic(() => import('@/components/sections/About'));


export default function Page() {
  // Validate config at build time
  const validation = validateConfig(siteConfig);
  if (!validation.success) {
    console.error('Config validation failed:', validation.error);
    return <div>Configuration Error</div>;
  }
  const config = validation.data;

  return (
    <main id="main-content" className="min-h-screen" role="main">
      {/* Home Section - Hero with full viewport presence */}
      <div className="pt-24 pb-10 sm:pt-28 sm:pb-12 md:pt-32 md:pb-16 bg-cream-50 relative overflow-hidden">
        <MusicalBackground config={config} />
        <div className="relative z-10">
          <SectionErrorBoundary sectionName="Home">
            <HomeSection config={config} />
          </SectionErrorBoundary>
        </div>
      </div>

      <div className="py-8 sm:py-11 md:py-14 bg-white">
        <SectionErrorBoundary sectionName="About">
          <About config={config} />
        </SectionErrorBoundary>
      </div>

      {/* Gallery Section - Subtle background variation */}
      <div className="py-8 sm:py-11 md:py-14 bg-cream-50">
        <SectionErrorBoundary sectionName="Gallery">
          <Gallery config={config} />
        </SectionErrorBoundary>
      </div>

      {/* Music Section - Clean white background */}
      <div className="py-8 sm:py-11 md:py-14 bg-white">
        <SectionErrorBoundary sectionName="Music">
          <Music config={config} />
        </SectionErrorBoundary>
      </div>

      {/* Press Section - Sophisticated gray tone */}
      <div className="py-8 sm:py-11 md:py-14 bg-cream-50">
        <SectionErrorBoundary sectionName="Press">
          <Press config={config} />
        </SectionErrorBoundary>
      </div>

      {/* FAQ Section - Return to white for clarity */}
      <div className="py-8 sm:py-11 md:py-20 bg-white">
        <SectionErrorBoundary sectionName="FAQ">
          <FAQ config={config} />
        </SectionErrorBoundary>
      </div>

      {/* Contact Section - Elegant navy accent background */}
      <div className="py-8 sm:py-11 md:py-20 bg-cream-50">
        <SectionErrorBoundary sectionName="Contact">
          <Contact />
        </SectionErrorBoundary>
      </div>

      {/* Portfolio Download Section */}
      <div id="pdf-generator-section" className="py-8 sm:py-10 md:py-12 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-6 sm:mb-7 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-navy-900 mb-2 md:mb-3 px-4">
              Download Portfolio
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4 leading-relaxed">
              Get a comprehensive PDF portfolio with all sections, images, and clickable links
            </p>
          </div>
          <SectionErrorBoundary sectionName="Portfolio Generator">
            <PortfolioGeneratorWrapper />
          </SectionErrorBoundary>
        </div>
      </div>
    </main>
  );
}

