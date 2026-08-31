import { z } from 'zod';
import type { SiteConfig } from '@/types';

// Zod schemas for validation
const BioBlockSchema = z.union([
  z.object({ type: z.literal('paragraph'), content: z.string() }),
  z.object({ type: z.literal('heading'), content: z.string() }),
  z.object({ type: z.literal('list'), items: z.array(z.string()) }),
]);

const MusicVideoSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().url(),
});

const MusicSubcategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  videos: z.array(MusicVideoSchema),
});

const MusicCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  subcategories: z.array(MusicSubcategorySchema),
});

const PressArticleSchema = z.object({
  title: z.string().min(1),
  publication: z.string().min(1),
  date: z.string().min(1),
  url: z.string().url(),
  excerpt: z.string(),
  imageUrl: z.string().optional(),
});

const FAQItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const GalleryImageSchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  caption: z.string().optional(),
});

const FeaturedCarouselItemSchema = z.object({
  id: z.string().min(1),
  image: z.string().min(1).optional(),
  imagePosition: z.string().optional(),
  imagePositionMobile: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  subtitle: z.string().optional(),
  link: z.string().optional(),
  linkText: z.string().optional(),
});

const SiteConfigSchema = z.object({
  artist: z.object({
    name: z.string().min(1),
    tagline: z.string().min(1),
    briefBio: z.string().min(1),
    fullBio: z.array(z.union([z.string().min(1), BioBlockSchema])),
    email: z.string().email().optional(),
    logo: z.string().optional(),
  }),
  home: z.object({
    heroTitle: z.string().optional(),
    heroBackground: z.string().optional(),
    heroBackgroundPosition: z.string().optional(),
    heroTagline: z.string().optional(),
    heroStats: z
      .array(
        z.object({
          label: z.string().min(1),
          value: z.string().min(1),
        })
      )
      .optional(),
    heroCta: z
      .object({
        text: z.string().min(1),
        link: z.string().min(1),
      })
      .optional(),
    images: z.object({
      veena: z.string().min(1),
      vocal: z.string().min(1),
    }),
    featuredVideos: z.array(z.union([z.string().url(), MusicVideoSchema])),
    featuredCarousel: z
      .object({
        enabled: z.boolean(),
        autoScrollInterval: z.number().optional(),
        items: z.array(FeaturedCarouselItemSchema),
        showUpcomingEvent: z.boolean().optional(),
        eventSubtitle: z.string().optional(),
        eventLinkText: z.string().optional(),
      })
      .optional(),
  }),
  gallery: z.object({
    images: z.array(GalleryImageSchema),
  }),
  music: z.object({
    layout: z.enum(['grid', 'carousel']).optional(),
    categories: z.array(MusicCategorySchema),
  }),
  press: z.object({
    articles: z.array(PressArticleSchema),
  }),
  faq: z.object({
    items: z.array(FAQItemSchema),
  }),
  socialMedia: z.object({
    youtube: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
  }),
  layoutOrder: z.array(z.string()).optional(),
  sections: z.record(z.boolean()).optional(),
  blog: z
    .object({
      title: z.string(),
      subtitle: z.string(),
    })
    .optional(),
  pdf: z
    .object({
      backgroundOpacity: z.number().optional(),
      backgroundBrightness: z.number().optional(),
      gradients: z
        .object({
          enabled: z.boolean().optional(),
          opacity: z.number().min(0).max(1).optional(),
        })
        .optional(),
    })
    .optional(),
  contact: z
    .object({
      imageUrl: z.string().optional(),
      imageAlt: z.string().optional(),
      formSlugs: z.array(z.string()).optional(),
    })
    .optional(),
  showCohortsOnComingSoon: z.boolean().optional(),
  cohorts_faq: z
    .object({
      items: z.array(FAQItemSchema),
    })
    .optional(),
  hallOfFame: z
    .object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      enabled: z.boolean().optional(),
    })
    .optional(),
  cohorts: z
    .object({
      registrationsPaused: z.boolean().optional(),
      registrationsPausedMessage: z.string().optional(),
    })
    .optional(),
  automation: z
    .object({
      email_enabled: z.boolean(),
      whatsapp_enabled: z.boolean(),
      telegram_enabled: z.boolean(),
      twilio_whatsapp_enabled: z.boolean(),
    })
    .optional(),
});

// Default fallback configuration
const defaultConfig: SiteConfig = {
  artist: {
    name: 'Artist Name',
    tagline: 'Musician',
    briefBio: 'Brief biography not available.',
    fullBio: ['Full biography not available.'],
  },
  home: {
    heroTitle: '',
    images: {
      veena: '/images/placeholder.jpg',
      vocal: '/images/placeholder.jpg',
    },
    featuredVideos: [],
  },
  gallery: {
    images: [],
  },
  music: {
    categories: [],
  },
  press: {
    articles: [],
  },
  faq: {
    items: [],
  },
  socialMedia: {},
  layoutOrder: ['Home', 'About', 'Gallery', 'Music', 'Events', 'Press', 'FAQ', 'Contact'],
  sections: {
    Home: true,
    About: true,
    Gallery: true,
    Music: true,
    Events: true,
    Press: true,
    FAQ: true,
    Contact: true,
  },
  blog: {
    title: 'Deep Dives into the Ocean of Swaras',
    subtitle: 'Journal & Musings',
  },
  contact: {
    imageUrl: '/images/contact/contact-image.jpg',
    imageAlt: 'Contact',
    formSlugs: ['classes', 'performance'],
  },
  showCohortsOnComingSoon: false,
  hallOfFame: {
    title: 'Cohort: Vande Mataram',
    subtitle: 'HALL OF FAME',
    description:
      'These students showed exceptional display of talent across our Veena learning challenges.',
    enabled: true,
  },
  cohorts_faq: {
    items: [
      {
        question: 'What is the format of these monthly cohorts?',
        answer:
          'Each cohort is designed for a specific learning goal over a 4-week period. It includes weekly live interactive sessions, structured practice assignments, and ongoing support via our private community.',
      },
      {
        question: 'Are the live sessions recorded?',
        answer:
          'Yes, all live sessions are recorded and uploaded to the student portal within 24 hours. You will have lifetime access to these recordings so you can revisit the lessons anytime.',
      },
      {
        question: 'Do I need to own a Veena to join the classes?',
        answer:
          'For the Veena cohorts, having an instrument is essential for practice. If you are a beginner looking to buy one, I can provide guidance on selecting a quality instrument once you enroll.',
      },
      {
        question: 'How do I access the private Telegram group?',
        answer:
          'Upon successful enrollment, our system automatically sends a personalized invite link to your registered email and WhatsApp. This link is single-use and secure.',
      },
    ],
  },
  automation: {
    email_enabled: true,
    whatsapp_enabled: false,
    telegram_enabled: true,
    twilio_whatsapp_enabled: false,
  },
};

/**
 * Validates configuration data against the schema
 * @param data - The configuration data to validate
 * @returns Validation result with success status and parsed data or error
 */
export function validateConfig(
  data: unknown
): { success: true; data: SiteConfig } | { success: false; error: z.ZodError } {
  try {
    const parsed = SiteConfigSchema.parse(data);
    return { success: true, data: parsed as SiteConfig };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Get the base path for the application
 * This handles both development and production environments
 */
export function getBasePath(): string {
  // 1. Build-time environment variable (primary source)
  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    const bp = process.env.NEXT_PUBLIC_BASE_PATH;
    return bp.startsWith('/') ? bp : `/${bp}`;
  }

  // 2. Client-side runtime detection (fallback for GitHub Pages)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // Check if we are on a github.io domain or a subpath-based environment
    if (hostname.includes('github.io')) {
      const pathParts = pathname.split('/').filter(Boolean);
      // If the first part of the path is likely the repo name (not a known route or empty)
      if (pathParts.length > 0 && pathParts[0] === 'veena-portfolio-v2') {
        return '/veena-portfolio-v2';
      }
    }
  }

  return '';
}

/**
 * Normalizes an asset path by prepending the base path if necessary
 */
export function getAssetPath(path: string | undefined): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  // Ensure path starts with a single slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Get and sanitize base path
  const basePath = getBasePath().replace(/\/$/, '');

  if (!basePath) return cleanPath;

  // If the path already starts with the base path, don't prepend it again
  if (cleanPath.startsWith(basePath)) {
    return cleanPath;
  }

  return `${basePath}${cleanPath}`;
}

/**
 * Loads and parses the site configuration.
 * Prioritizes the Supabase database with a fallback to the local JSON file.
 * @returns Parsed and validated site configuration
 */
export async function loadConfig(): Promise<SiteConfig> {
  // 1. Try loading from Database (Supabase) first
  try {
    const { getDbConfig } = await import('./db-config');
    const dbConfig = await getDbConfig();
    if (dbConfig) {
      return dbConfig;
    }
  } catch (err) {
    console.warn('[config] Failed to load from DB, falling back to local file:', err);
  }

  // 3. Ultimate Fallback: The hardcoded default config
  return defaultConfig;
}

/**
 * Synchronously loads configuration (for server-side use)
 * @param configData - Pre-loaded configuration data
 * @returns Parsed and validated site configuration
 */
export function loadConfigSync(configData: unknown): SiteConfig {
  try {
    const validation = validateConfig(configData);

    if (!validation.success) {
      console.error('Configuration validation failed:', validation.error);
      return defaultConfig;
    }

    return validation.data!;
  } catch (error) {
    console.error('Error loading configuration:', error);
    return defaultConfig;
  }
}

export { SiteConfigSchema, defaultConfig };
