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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MusicGroup',
  name: 'Aishwarya Manikarnike',
  url: 'https://morsecode.in',
  image: 'https://morsecode.in/images/home/veena-performance.jpg',
  description: 'Official website of Veena musician Aishwarya Manikarnike. Showcasing classical Indian music performances, recordings, and artistic journey.',
  sameAs: [
    'https://www.youtube.com/@aishwaryamanikarnike',
    'https://www.instagram.com/aishwaryamanikarnike'
  ]
};

export const metadata: Metadata = {
  metadataBase: new URL('https://morsecode.in'),
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
    url: 'https://morsecode.in',
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

// Validate config at build time (optional in layout as it runs on server)
const configValidation = validateConfig(siteConfig);
const config = configValidation.success ? configValidation.data : undefined;

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
