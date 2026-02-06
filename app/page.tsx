import dynamic from 'next/dynamic';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import HomeSection from '@/components/sections/Home';
import MusicalBackground from '@/components/ui/MusicalBackground';
import PortfolioGeneratorWrapper from '@/components/features/PortfolioGeneratorWrapper';
import siteConfig from '@/public/config/site-config.json';
import { validateConfig } from '@/lib/config';
import { supabase } from '@/lib/supabase'; // Use anon client for public fetch
import { LoadingCard } from '@/components/system/LoadingCard';

export const revalidate = 900; // Revalidate every 15 minutes

// Code-split heavy components for better performance
const Gallery = dynamic(() => import('@/components/sections/Gallery'), {
  loading: () => (
    <div className="py-16 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          <LoadingCard variant="gallery" count={6} />
        </div>
      </div>
    </div>
  ),
});

const Music = dynamic(() => import('@/components/sections/Music'), {
  loading: () => (
    <div className="py-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <LoadingCard variant="video" count={3} />
        </div>
      </div>
    </div>
  ),
});

const Press = dynamic(() => import('@/components/sections/Press'), {
  loading: () => (
    <div className="py-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <LoadingCard variant="blog" count={3} />
        </div>
      </div>
    </div>
  ),
});

const FAQ = dynamic(() => import('@/components/sections/FAQ'), {
  loading: () => (
    <div className="py-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <LoadingCard variant="default" count={4} />
      </div>
    </div>
  ),
});

const Contact = dynamic(() => import('@/components/sections/Contact'), {
  loading: () => (
    <div className="py-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-2xl mx-auto">
        <LoadingCard variant="default" count={1} />
      </div>
    </div>
  ),
});

const About = dynamic(() => import('@/components/sections/About'));
const Schedule = dynamic(() => import('@/components/sections/Schedule'));

export default async function Page() {
  // Validate config
  const validation = validateConfig(siteConfig);
  if (!validation.success) {
    console.error('Config validation failed:', validation.error);
    return <div>Configuration Error</div>;
  }
  const config = validation.data;

  let dbVideos: any[] = [];
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('order_index', { ascending: true });

    if (!error && data) {
      dbVideos = data;
    }
  } catch (e) {
    console.error('Failed to fetch videos from Supabase:', e);
  }

  const featuredVideos = dbVideos.filter(v => v.is_featured);

  return (
    <main id="main-content" className="min-h-screen" role="main">
      {/* Dynamic Sections based on Config */}
      {config.layoutOrder?.map((sectionName) => {
        if (config.sections && config.sections[sectionName] === false) return null;

        switch (sectionName) {
          case 'Home':
            return (
              <div key="Home" className="relative">
                <SectionErrorBoundary sectionName="Home">
                  <HomeSection config={config} dbVideos={featuredVideos} />
                </SectionErrorBoundary>
              </div>
            );
          case 'About':
            return (
              <div key="About" className="py-8 sm:py-11 md:py-14 bg-white">
                <SectionErrorBoundary sectionName="About">
                  <About config={config} />
                </SectionErrorBoundary>
              </div>
            );
          case 'Gallery':
            return (
              <div key="Gallery" className="py-8 sm:py-11 md:py-14 bg-cream-50">
                <SectionErrorBoundary sectionName="Gallery">
                  <Gallery config={config} />
                </SectionErrorBoundary>
              </div>
            );
          case 'Music':
            return (
              <div key="Music" className="py-8 sm:py-11 md:py-14 bg-white">
                <SectionErrorBoundary sectionName="Music">
                  <Music config={config} dbVideos={dbVideos || []} />
                </SectionErrorBoundary>
              </div>
            );
          case 'Events':
            return (
              <div key="Events" className="py-8 sm:py-11 md:py-14 bg-cream-50">
                <SectionErrorBoundary sectionName="Events">
                  <Schedule />
                </SectionErrorBoundary>
              </div>
            );
          case 'Press':
            return (
              <div key="Press" className="py-8 sm:py-11 md:py-14 bg-white">
                <SectionErrorBoundary sectionName="Press">
                  <Press config={config} />
                </SectionErrorBoundary>
              </div>
            );
          case 'FAQ':
            return (
              <div key="FAQ" className="py-8 sm:py-11 md:py-20 bg-cream-50">
                <SectionErrorBoundary sectionName="FAQ">
                  <FAQ config={config} />
                </SectionErrorBoundary>
              </div>
            );
          case 'Contact':
            return (
              <div key="Contact" className="py-8 sm:py-11 md:py-20 bg-white">
                <SectionErrorBoundary sectionName="Contact">
                  <Contact />
                </SectionErrorBoundary>
              </div>
            );
          default:
            return null;
        }
      })}

      {/* Portfolio Download Section */}
      <div id="pdf-generator-section" className="py-8 sm:py-10 md:py-12 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <SectionErrorBoundary sectionName="Portfolio Generator">
            <PortfolioGeneratorWrapper />
          </SectionErrorBoundary>
        </div>
      </div>
    </main>
  );
}

