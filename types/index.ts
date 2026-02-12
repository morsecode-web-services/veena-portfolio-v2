// Type definitions for the Veena Musician Website

export type BioBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; content: string }
  | { type: 'list'; items: string[] };

export interface FeaturedCarouselItem {
  id: string;
  type: 'custom' | 'event'; // Type discriminator
  image?: string; // Optional - some items like events may not have images
  imagePosition?: string; // CSS object-position for desktop (default: "center")
  imagePositionMobile?: string; // CSS object-position for mobile (default: same as imagePosition or "center")
  title: string;
  description: string;
  subtitle?: string; // Optional gold label text (e.g., "Highlights", "Featured recognitions")
  link?: string;
  linkText?: string;
}

export interface SiteConfig {
  artist: {
    name: string;
    tagline: string;
    briefBio: string;
    fullBio: (string | BioBlock)[];
    email?: string;
    logo?: string;
  };
  home: {
    heroTitle?: string; // "Music is the mediator..."
    heroBackground?: string; // Path to hero background image
    heroBackgroundPosition?: string; // CSS object-position for hero background
    heroTagline?: string; // Small tagline at top of hero
    heroStats?: Array<{
      label: string;
      value: string;
    }>; // Stats shown at bottom left of hero
    heroCta?: {
      text: string;
      link: string;
    }; // Main CTA button
    images: {
      veena: string;
      vocal: string;
    };
    featuredVideos: (string | MusicVideo)[];
    featuredCarousel?: {
      enabled: boolean;
      autoScrollInterval?: number; // milliseconds, default 5000
      items: Array<{
        id: string;
        image: string;
        imagePosition?: string; // CSS object-position for desktop (default: "center")
        imagePositionMobile?: string; // CSS object-position for mobile (default: same as imagePosition or "center")
        title: string;
        description: string;
        subtitle?: string;
        link?: string;
        linkText?: string;
      }>;
      showUpcomingEvent?: boolean; // default true
      eventSubtitle?: string; // subtitle for event items, default "Upcoming Event"
      eventLinkText?: string; // default "View Event Details"
    };
  };
  spotlights: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    features: {
      title: string;
      description: string;
    }[];
    imageUrl: string;
    imagePosition?: string;
    ctaText?: string;
    ctaLink?: string;
  }[];
  gallery: {
    images: GalleryImage[];
  };
  music: {
    layout?: 'grid' | 'carousel';
    categories: MusicCategory[];
  };
  press: {
    articles: PressArticle[];
  };
  faq: {
    items: FAQItem[];
  };
  socialMedia: {
    youtube?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  layoutOrder?: string[];
  sections?: Record<string, boolean>;
  blog?: {
    title: string;
    subtitle: string;
  };
  pdf?: {
    backgroundOpacity?: number;
    backgroundBrightness?: number;
    gradients?: {
      enabled?: boolean;    // Toggle: true = gradients, false = legacy grayscale images
      opacity?: number;     // Override default opacity (0-1, default: 0.3)
    };
  };
}

export interface MusicVideo {
  title?: string;
  url: string;
}

export interface MusicSubcategory {
  id: string;
  name: string;
  description: string;
  videos: MusicVideo[];
}

export interface MusicCategory {
  id: string;
  name: string;
  description: string;
  subcategories: MusicSubcategory[];
}

export interface PressArticle {
  title: string;
  publication: string;
  date: string;
  url: string;
  excerpt: string;
  imageUrl?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export type InquiryType =
  | 'performance'
  | 'classes'
  | 'collaboration'
  | 'general';

export interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  inquiryType: InquiryType;
  purpose: string;
  timestamp: Date;
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
}

// Social Links Types
export type DeviceType = 'ios' | 'android' | 'desktop';
export type LinkTarget = '_blank' | '_self' | undefined;
export type LinkType = 'app_scheme' | 'intent' | 'https';

export interface SocialLinkConfig {
  href: string;
  target?: LinkTarget;
  deviceType: DeviceType;
  linkType: LinkType;
}
