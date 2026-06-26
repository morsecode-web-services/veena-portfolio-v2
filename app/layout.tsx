import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Providers } from '@/components/Providers';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import MicrosoftClarity from '@/components/MicrosoftClarity';
import { loadConfig } from '@/lib/config';
import ConditionalLayout from '@/components/layout/ConditionalLayout';

export async function generateMetadata(): Promise<Metadata> {
  const config = await loadConfig();

  return {
    metadataBase: new URL('https://www.aishwaryamanikarnike.com'),
    title: {
      default: `${config.artist.name} - ${config.artist.tagline}`,
      template: `%s | ${config.artist.name}`,
    },
    description: config.artist.briefBio,
    keywords: [
      'Veena',
      'Indian classical music',
      'Carnatic music',
      config.artist.name,
      'musician',
      'veena player',
      'vocalist',
    ],
    authors: [{ name: config.artist.name }],
    creator: config.artist.name,
    openGraph: {
      title: `${config.artist.name} - ${config.artist.tagline}`,
      description: config.artist.briefBio,
      url: 'https://www.aishwaryamanikarnike.com',
      siteName: config.artist.name,
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url:
            config.home.heroBackground ||
            'https://placehold.co/1200x630/14213d/d4af37?text=Veena+Performance',
          width: 1200,
          height: 630,
          alt: `${config.artist.name} playing Veena`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${config.artist.name} Musician`,
      description: config.artist.briefBio,
      images: [
        config.home.heroBackground ||
          'https://placehold.co/1200x630/14213d/d4af37?text=Veena+Performance',
      ],
      creator: '@aishwaryaveena',
    },
    verification: {
      google: 'vQ2fP-_vR4J_KzWfX_k9O_o-4pY8Wf3Y8yZ8...',
    },
  };
}

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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#14213d',
};

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
    ].filter(Boolean),
  };

  // 2. MusicGroup Schema
  const musicGroupSchema = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    '@id': `${siteUrl}/#musicgroup`,
    name: config.artist.name,
    url: siteUrl,
    image:
      config.home.heroBackground ||
      'https://placehold.co/1200x630/14213d/d4af37?text=Veena+Performance',
    description: personSchema.description,
    member: [
      {
        '@type': 'OrganizationRole',
        member: { '@id': `${siteUrl}/#person` },
        roleName: 'Lead Musician',
      },
    ],
    sameAs: personSchema.sameAs,
  };

  // 3. VideoObject Schemas
  const videoSchemas: any[] = [];

  const addVideoSchema = (title: string, url: string) => {
    const videoId = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]{11})/
    )?.[1];
    if (videoId) {
      videoSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: title,
        description: `${title} - Performance by Aishwarya Manikarnike`,
        thumbnailUrl: [
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        ],
        uploadDate: '2024-01-01T08:00:00+08:00',
        contentUrl: url,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        author: { '@id': `${siteUrl}/#person` },
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await loadConfig();
  const jsonLdData = generateJsonLd(config);

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
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
        {/* Preconnect to Cloudinary CDN for faster image delivery */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          <ErrorBoundary>
            <ConditionalLayout config={config} jsonLdData={jsonLdData}>
              {children}
            </ConditionalLayout>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
