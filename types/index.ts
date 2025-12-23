// Type definitions for the Veena Musician Website

export interface SiteConfig {
  artist: {
    name: string;
    tagline: string;
    briefBio: string;
    fullBio: string[];
  };
  home: {
    images: {
      veena: string;
      vocal: string;
    };
    featuredVideos: string[];
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
    ctaText?: string;
    ctaLink?: string;
  }[];
  gallery: {
    images: GalleryImage[];
  };
  music: {
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
  features?: {
    swaraAnimation: {
      desktop: boolean;
      mobile: boolean;
    };
  };
}

export interface MusicVideo {
  title: string;
  url: string;
}

export interface MusicCategory {
  id: string;
  name: string;
  description: string;
  videos: MusicVideo[];
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

export interface ContactFormData {
  name: string;
  phone: string;
  email: string;
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
