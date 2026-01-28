import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

// Metadata
export const metadata: Metadata = {
  metadataBase: new URL('https://www.aishwaryamanikarnike.com'),
  title: {
    default: 'Aishwarya Manikarnike - Veena Musician',
    template: '%s | Aishwarya Manikarnike'
  },
  description: 'Official website of Veena musician Aishwarya Manikarnike. Showcasing classical Indian music performances, recordings, and artistic journey.',
  keywords: ['Veena', 'Indian classical music', 'Carnatic music', 'Aishwarya Manikarnike', 'musician', 'veena player', 'vocalist'],
  authors: [{ name: 'Aishwarya Manikarnike' }],
  creator: 'Aishwarya Manikarnike',
  openGraph: {
    title: 'Aishwarya Manikarnike - Veena Musician',
    description: 'Official website of Veena musician Aishwarya Manikarnike',
    url: 'https://www.aishwaryamanikarnike.com',
    siteName: 'Aishwarya Manikarnike',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/home/veena-performance.jpg',
        width: 1200,
        height: 630,
        alt: 'Aishwarya Manikarnike playing Veena',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aishwarya Manikarnike - Veena Musician',
    description: 'Official website of Veena musician Aishwarya Manikarnike',
    images: ['/images/home/veena-performance.jpg'],
    creator: '@aishwaryaveena',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#14213d',
};

import { Providers } from '@/components/Providers';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import MicrosoftClarity from '@/components/MicrosoftClarity';
import siteConfig from '@/public/config/site-config.json';
import { validateConfig } from '@/lib/config';

// Validate config
const configValidation = validateConfig(siteConfig);
const config = configValidation.success ? configValidation.data : undefined;

// Generate Enhanced JSON-LD
const generateJsonLd = (config: any) => {
  if (!config) return null;

  const siteUrl = 'https://www.aishwaryamanikarnike.com';

  // 1. Person Schema
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${siteUrl}/#person`,
    name: config.artist.name,
    url: siteUrl,
    image: `${siteUrl}${config.artist.logo}`,
    description: config.artist.briefBio,
    jobTitle: 'Musician',
    knowsAbout: ['Carnatic Music', 'Saraswati Veena', 'Vocal Music'],
    sameAs: [
      config.socialMedia.youtube,
      config.socialMedia.instagram,
      config.socialMedia.linkedin,
    ].filter(Boolean)
  };

  // 2. MusicGroup Schema
  const musicGroupSchema = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    '@id': `${siteUrl}/#musicgroup`,
    name: config.artist.name,
    url: siteUrl,
    image: `${siteUrl}/images/home/veena-performance.jpg`,
    description: personSchema.description,
    member: [{
      '@type': 'OrganizationRole',
      member: { '@id': `${siteUrl}/#person` },
      roleName: 'Lead Musician'
    }],
    sameAs: personSchema.sameAs
  };

  // 3. VideoObject Schemas
  const videoSchemas: any[] = [];

  const addVideoSchema = (title: string, url: string) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]{11})/)?.[1];
    if (videoId) {
      videoSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: title,
        description: `${title} - Performance by Aishwarya Manikarnike`,
        thumbnailUrl: [
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        ],
        uploadDate: '2024-01-01T08:00:00+08:00',
        contentUrl: url,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        author: { '@id': `${siteUrl}/#person` }
      });
    }
  };

  config.home.featuredVideos.forEach((v: any, i: number) => {
    const title = typeof v === 'string' ? `Featured Video ${i + 1}` : v.title;
    const url = typeof v === 'string' ? v : v.url;
    addVideoSchema(title, url);
  });

  config.music.categories.forEach((cat: any) => {
    cat.subcategories?.forEach((sub: any) => {
      sub.videos?.forEach((vid: any) => {
        addVideoSchema(vid.title, vid.url);
      });
    });
  });

  return [personSchema, musicGroupSchema, ...videoSchemas];
};

const jsonLdData = generateJsonLd(config);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <GoogleAnalytics />
        <MicrosoftClarity />
        {/* Preconnect to external resources for faster loading */}
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://img.youtube.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        {jsonLdData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
          />
        )}
      </head>
      <body className="font-sans antialiased text-navy-900 bg-cream-50">
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
        <Providers>
          <Header config={config} />
          {children}
          <Footer config={config} />
        </Providers>
      </body>
    </html>
  );
}
