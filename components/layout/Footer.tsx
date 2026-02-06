'use client';

import { m } from 'framer-motion';
import {
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
} from 'react-icons/fa';
import type { SiteConfig } from '@/types';
import Image from 'next/image';
import { getAssetPath } from '@/lib/config';
import { analytics } from '@/components/GoogleAnalytics';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const socialMediaIcons = {
  youtube: FaYoutube,
  facebook: FaFacebook,
  instagram: FaInstagram,
  twitter: FaTwitter,
  linkedin: FaLinkedin,
};

import { usePathname } from 'next/navigation';

interface FooterProps {
  config?: SiteConfig;
}

export default function Footer({ config }: FooterProps) {
  const pathname = usePathname();
  const socialMedia = config?.socialMedia || {};
  const shouldReduceMotion = useReducedMotion();

  // Hide footer on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-gradient-navy text-white py-6 sm:py-8 md:py-10 border-t border-premium" role="contentinfo">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col items-center space-y-6 md:space-y-8">
          {/* Logo */}
          {config?.artist.logo && (
            <m.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
              className="relative w-12 h-12 md:w-16 md:h-16"
            >
              <Image
                src={getAssetPath(config.artist.logo)}
                alt={`${config.artist.name} Logo`}
                fill
                className="object-contain brightness-0 invert opacity-80 hover:opacity-100 transition-opacity duration-300"
              />
            </m.div>
          )}

          {/* Social Media Icons */}
          <m.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
            className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5"
            role="navigation"
            aria-label="Social media links"
          >
            {Object.entries(socialMedia).map(([platform, url], index) => {
              if (!url) return null;
              const Icon =
                socialMediaIcons[platform as keyof typeof socialMediaIcons];
              if (!Icon) return null;

              return (
                <m.a
                  key={platform}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : index * 0.1 }}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.2, y: -3 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => analytics.socialMediaClick(platform, 'footer')}
                  className="text-slate-400 hover:text-white active:text-gray-300 transition-colors duration-200 touch-manipulation p-1.5"
                  aria-label={`Visit our ${platform.charAt(0).toUpperCase() + platform.slice(1)} page (opens in new tab)`}
                >
                  <Icon size={20} className="sm:w-6 sm:h-6" />
                </m.a>
              );
            })}
          </m.div>

          {/* Copyright */}
          <m.div
            initial={shouldReduceMotion ? undefined : { opacity: 0 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.3 }}
            className="text-center text-slate-400 text-xs px-4"
          >
            <p>
              &copy; {new Date().getFullYear()}{' '}
              {config?.artist.name || 'Aishwarya Manikarnike'}. All rights
              reserved.
            </p>
          </m.div>
        </div>
      </div>
    </footer>
  );
}
