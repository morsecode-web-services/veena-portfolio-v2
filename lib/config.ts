import { z } from 'zod';
import type { SiteConfig } from '@/types';

// Zod schemas for validation
const MusicVideoSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
});

const MusicCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  videos: z.array(MusicVideoSchema),
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
  features: z.array(SpotlightFeatureSchema),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
});

const SiteConfigSchema = z.object({
  artist: z.object({
    name: z.string().min(1),
    tagline: z.string().min(1),
    briefBio: z.string().min(1),
    fullBio: z.array(z.string().min(1)),
  }),
  home: z.object({
    images: z.object({
      veena: z.string().min(1),
      vocal: z.string().min(1),
    }),
    featuredVideos: z.array(z.string().url()),
  }),
  spotlights: z.array(SpotlightSchema).optional(),
  gallery: z.object({
    images: z.array(GalleryImageSchema),
  }),
  music: z.object({
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
};

/**
 * Validates configuration data against the schema
 * @param data - The configuration data to validate
 * @returns Validation result with success status and parsed data or error
 */
export function validateConfig(data: unknown): {
  success: boolean;
  data?: SiteConfig;
  error?: z.ZodError;
} {
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
function getBasePath(): string {
  // In production (GitHub Pages), use the hardcoded base path
  // In development, use empty string
  if (typeof window !== 'undefined') {
    // Client-side: check if we're on GitHub Pages
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // If we're on GitHub Pages and not at root, extract base path
    if (hostname.includes('github.io') && pathname.startsWith('/veena-portfolio-v2')) {
      return '/veena-portfolio-v2';
    }
  }

  // Default to environment variable or empty string
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
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
    // Handle base path for GitHub Pages deployment
    const basePath = getBasePath();
    const fullPath = `${basePath}${configPath}`;

    console.log(`Loading config from: ${fullPath}`);

    const response = await fetch(fullPath);

    if (!response.ok) {
      console.error(`Failed to load configuration from ${fullPath}: ${response.statusText}`);
      return defaultConfig;
    }

    const data = await response.json();
    const validation = validateConfig(data);

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
