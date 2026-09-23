'use client';

import { m } from 'framer-motion';
import { memo, useState, useEffect } from 'react';
import {
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaEnvelope,
} from 'react-icons/fa';
import type { SiteConfig } from '@/types';
import Image from 'next/image';
import { getAssetPath } from '@/lib/config';
import { analytics } from '@/components/GoogleAnalytics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { detectDevice, getSocialLinkConfig, type DeviceType } from '@/lib/social-links';

const socialMediaIcons = {
  youtube: FaYoutube,
  facebook: FaFacebook,
  instagram: FaInstagram,
  twitter: FaTwitter,
  linkedin: FaLinkedin,
  email: FaEnvelope,
};

import { usePathname } from 'next/navigation';

interface FooterProps {
  config?: SiteConfig;
}

function Footer({ config }: FooterProps) {
  const pathname = usePathname();
  const socialMedia = config?.socialMedia || {};
  const shouldReduceMotion = useReducedMotion();
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  // Detect device type on mount
  useEffect(() => {
    setDeviceType(detectDevice());
  }, []);

  // Hide footer on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const isHome = pathname === '/';
  const getHref = (hash: string) => (isHome ? hash : `/${hash}`);

  const isBlogEnabled = Boolean(
    config?.sections?.['Blog'] === true ||
    config?.sections?.['blog'] === true ||
    config?.layoutOrder?.includes('Blog') ||
    config?.layoutOrder?.includes('blog')
  );

  return (
    <footer
      className="bg-gradient-navy text-white pt-12 sm:pt-16 pb-8 border-t border-premium"
      role="contentinfo"
      suppressHydrationWarning
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Navigation Atlas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand & Artist Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              {config?.artist.logo && (
                <div className="relative w-10 h-10">
                  <Image
                    src={getAssetPath(config.artist.logo)}
                    alt={`${config.artist.name} Logo`}
                    fill
                    className="object-contain brightness-0 invert opacity-90"
                  />
                </div>
              )}
              <h2 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wide">
                {config?.artist.name || 'Aishwarya Manikarnike'}
              </h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              {config?.artist.tagline ||
                'Carnatic Classical Veena Artiste, Composer & Educator dedicated to preserving and reimagining Indian classical heritage.'}
            </p>
            {config?.artist.email && (
              <div className="pt-1">
                <a
                  href={`mailto:${config.artist.email}`}
                  className="text-slate-300 hover:text-gold-400 text-sm font-medium transition-colors duration-200 border-b border-gold-500/30 hover:border-gold-400 inline-block"
                  onClick={() =>
                    analytics.socialMediaClick('email', 'footer', deviceType, 'mailto')
                  }
                >
                  {config.artist.email}
                </a>
              </div>
            )}
          </div>

          {/* Pillar 1: The Artist & Repertoire */}
          <div className="lg:col-span-2 sm:col-span-1 space-y-3">
            <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-[0.2em] font-sans">
              The Artist
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a href={getHref('#about')} className="hover:text-gold-300 transition-colors">
                  Biography
                </a>
              </li>
              <li>
                <a href={getHref('#music')} className="hover:text-gold-300 transition-colors">
                  Music & Videos
                </a>
              </li>
              <li>
                <a href={getHref('#gallery')} className="hover:text-gold-300 transition-colors">
                  Gallery
                </a>
              </li>
              <li>
                <a href={getHref('#events')} className="hover:text-gold-300 transition-colors">
                  Concerts & Tours
                </a>
              </li>
              <li>
                <a href={getHref('#press')} className="hover:text-gold-300 transition-colors">
                  Press & Media
                </a>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Academy & Mentorship */}
          <div className="lg:col-span-3 sm:col-span-1 space-y-3">
            <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-[0.2em] font-sans">
              Academy & Learning
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a
                  href="/cohorts"
                  className="hover:text-gold-300 transition-colors flex items-center gap-1.5"
                >
                  <span>Cohorts & Masterclasses</span>
                  <span className="text-[10px] bg-gold-500/20 text-gold-300 px-1.5 py-0.5 rounded font-medium">
                    New
                  </span>
                </a>
              </li>
              <li>
                <a href="/hall-of-fame" className="hover:text-gold-300 transition-colors">
                  Student Hall of Fame
                </a>
              </li>
              <li>
                <a href="/forms/classes" className="hover:text-gold-300 transition-colors">
                  Private Lessons Inquiry
                </a>
              </li>
              <li>
                <a href={getHref('#faq')} className="hover:text-gold-300 transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
            </ul>
          </div>

          {/* Pillar 3: Journal, Links & Socials */}
          <div className="lg:col-span-3 space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-[0.2em] font-sans">
                Insights & Social
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {isBlogEnabled && (
                  <li>
                    <a href="/blog" className="hover:text-gold-300 transition-colors">
                      Musings & Journal
                    </a>
                  </li>
                )}
                <li>
                  <a href="/links" className="hover:text-gold-300 transition-colors">
                    Smart Bio Links
                  </a>
                </li>
                <li>
                  <a href={getHref('#contact')} className="hover:text-gold-300 transition-colors">
                    Booking & Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Social Media Icons */}
            <div className="pt-2">
              <div
                className="flex flex-wrap gap-2.5"
                role="navigation"
                aria-label="Social media links"
              >
                {Object.entries(socialMedia).map(([platform, url], index) => {
                  if (!url) return null;
                  const Icon = socialMediaIcons[platform as keyof typeof socialMediaIcons];
                  if (!Icon) return null;

                  const linkConfig =
                    platform === 'instagram'
                      ? getSocialLinkConfig('instagram', url, deviceType)
                      : {
                          href: url,
                          target: '_blank' as const,
                          deviceType,
                          linkType: 'https' as const,
                        };

                  const ariaLabel =
                    linkConfig.target === '_blank'
                      ? `Visit our ${platform.charAt(0).toUpperCase() + platform.slice(1)} page (opens in new tab)`
                      : `Visit our ${platform.charAt(0).toUpperCase() + platform.slice(1)} page`;

                  return (
                    <m.a
                      key={platform}
                      initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
                      whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.3,
                        delay: shouldReduceMotion ? 0 : index * 0.05,
                      }}
                      whileHover={shouldReduceMotion ? {} : { scale: 1.15, y: -2 }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                      href={linkConfig.href}
                      target={linkConfig.target}
                      rel="noopener noreferrer"
                      onClick={() =>
                        analytics.socialMediaClick(
                          platform,
                          'footer',
                          linkConfig.deviceType,
                          linkConfig.linkType
                        )
                      }
                      className="text-slate-400 hover:text-white bg-slate-800/60 hover:bg-gold-600/30 border border-slate-700/50 p-2 rounded-lg transition-all duration-200"
                      aria-label={ariaLabel}
                      suppressHydrationWarning
                    >
                      <Icon size={16} />
                    </m.a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>
            &copy; {new Date().getFullYear()} {config?.artist.name || 'Aishwarya Manikarnike'}. All
            rights reserved.
          </p>
          <div className="flex items-center gap-4 text-slate-500">
            <a href={getHref('#home')} className="hover:text-slate-400 transition-colors">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);
