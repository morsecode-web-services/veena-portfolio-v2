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

const SpotlightFeatureSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

const SpotlightSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().min(1),
  imagePosition: z.string().optional(),
  features: z.array(SpotlightFeatureSchema),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
});

const FeaturedCarouselItemSchema = z.object({
  id: z.string().min(1),
  image: z.string().min(1),
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
    heroStats: z.array(z.object({
      label: z.string().min(1),
      value: z.string().min(1),
    })).optional(),
    heroCta: z.object({
      text: z.string().min(1),
      link: z.string().min(1),
    }).optional(),
    images: z.object({
      veena: z.string().min(1),
      vocal: z.string().min(1),
    }),
    featuredVideos: z.array(z.union([z.string().url(), MusicVideoSchema])),
    featuredCarousel: z.object({
      enabled: z.boolean(),
      autoScrollInterval: z.number().optional(),
      items: z.array(FeaturedCarouselItemSchema),
      showUpcomingEvent: z.boolean().optional(),
      eventSubtitle: z.string().optional(),
      eventLinkText: z.string().optional(),
    }).optional(),
  }),
  spotlights: z.array(SpotlightSchema).optional(),
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
  features: z.object({
    swaraAnimation: z.object({
      desktop: z.boolean(),
      mobile: z.boolean(),
    }),
  }).optional(),
  layoutOrder: z.array(z.string()).optional(),
  sections: z.record(z.boolean()).optional(),
  blog: z.object({
    title: z.string(),
    subtitle: z.string(),
  }).optional(),
  pdf: z.object({
    backgroundOpacity: z.number().optional(),
    backgroundBrightness: z.number().optional(),
  }).optional(),
  contact: z.object({
    imageUrl: z.string().optional(),
    imageAlt: z.string().optional(),
  }).optional(),
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
    heroTitle: 'Music is the mediator between the spiritual and the sensual life.',
    images: {
      veena: '/images/placeholder.jpg',
      vocal: '/images/placeholder.jpg',
    },
    featuredVideos: [],
  },
  spotlights: [],
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
  features: {
    swaraAnimation: {
      desktop: true,
      mobile: false,
    },
  },
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
};

/**
 * Validates configuration data against the schema
 * @param data - The configuration data to validate
 * @returns Validation result with success status and parsed data or error
 */
export function validateConfig(data: unknown):
  | { success: true; data: SiteConfig }
  | { success: false; error: z.ZodError } {
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

    // Check if we are on a github.io domain and NOT on a custom domain pointing there
    // If there's a subpath that looks like a repo name
    if (hostname.includes('github.io')) {
      const pathParts = pathname.split('/').filter(Boolean);
      if (pathParts.length > 0 && !hostname.startsWith(pathParts[0])) {
        // If it's a subpath deployment, the first part is usually the repo name
        return `/${pathParts[0]}`;
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

  const basePath = getBasePath().replace(/\/$/, '');
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;

  // Avoid duplication if basePath is already present
  if (basePath && sanitizedPath.startsWith(basePath)) {
    return sanitizedPath;
  }

  return `${basePath}${sanitizedPath}`;
}

/**
 * Loads and parses the site configuration from JSON file
 * @param configPath - Path to the configuration file (default: /config/site-config.json)
 * @returns Parsed and validated site configuration
 */
export async function loadConfig(
  configPath: string = '/config/site-config.json'
): Promise<SiteConfig> {
  try {
    // 1. Server-side: Read file directly from filesystem
    if (typeof window === 'undefined') {
      const { readFile } = await import('fs/promises');
      const path = await import('path');

      const filePath = path.join(process.cwd(), 'public', configPath.replace(/^\//, ''));

      try {
        const fileContents = await readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContents);
        const validation = validateConfig(data);

        if (!validation.success) {
          console.error('[Config] Server-side Validation Failed:', validation.error.format());
          return defaultConfig;
        }

        return validation.data!;
      } catch (fsError) {
        console.error(`[Config] Failed to read file at ${filePath}:`, fsError);
        return defaultConfig;
      }
    }

    // 2. Client-side: Use fetch
    const basePath = getBasePath().replace(/\/$/, '');
    const sanitizedConfigPath = configPath.replace(/^\//, '');
    const fullPath = basePath ? `${basePath}/${sanitizedConfigPath}` : `/${sanitizedConfigPath}`;

    const response = await fetch(fullPath);

    if (!response.ok) {
      console.error(`[Config] HTTP Error ${response.status}: ${response.statusText} at ${fullPath}`);
      return defaultConfig;
    }

    const data = await response.json();
    const validation = validateConfig(data);

    if (!validation.success) {
      console.error('[Config] Validation Failed. Errors:', validation.error.format());
      return defaultConfig;
    }

    return validation.data!;
  } catch (error) {
    console.error('[Config] Unexpected Error:', error);
    return defaultConfig;
  }
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
