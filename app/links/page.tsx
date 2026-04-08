import React from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { loadConfig, getAssetPath } from '@/lib/config';
import { FaYoutube, FaInstagram, FaFacebook, FaTwitter, FaLinkedin, FaLink } from 'react-icons/fa';
import Link from 'next/link';

// Ensure this page is rendered dynamically to always fetch latest links
export const dynamic = 'force-dynamic';

export default async function LinksPage() {
    const config = await loadConfig();

    const { data: links, error } = await supabase
        .from('smart_links')
        .select('*')
        .eq('show_in_bio', true)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching bio links:', error);
    }

    // Determine profile image: Prioritize a personal photo over the site logo
    const profileImage =
        getAssetPath(config.home.images.veena) ||
        getAssetPath(config.artist.logo) ||
        '/images/placeholder.jpg';

    // Helper to render correct icon for social links
    const renderSocialIcon = (platform: string, url: string) => {
        if (!url) return null;
        
        let Icon = FaLink;
        if (platform === 'youtube') Icon = FaYoutube;
        if (platform === 'instagram') Icon = FaInstagram;
        if (platform === 'facebook') Icon = FaFacebook;
        if (platform === 'twitter') Icon = FaTwitter;
        if (platform === 'linkedin') Icon = FaLinkedin;

        return (
            <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 text-navy-600 hover:text-gold-600 hover:bg-gold-500/10 rounded-full transition-all duration-300"
                aria-label={platform}
            >
                <Icon className="w-6 h-6" />
            </a>
        );
    };

    return (
        <div className="min-h-screen relative flex flex-col items-center py-16 px-4 sm:px-6">
            {/* Background */}
            <div className="fixed inset-0 z-0 bg-cream-50 bg-gradient-premium">
                {/* Subtle top light overlay */}
                <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-white to-transparent opacity-60" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                
                {/* Profile Header */}
                <div className="mb-8 text-center flex flex-col items-center">
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-4 border-[3px] border-white shadow-premium">
                        {profileImage && profileImage !== '' ? (
                            <Image
                                src={profileImage}
                                alt={config.artist.name}
                                fill
                                style={{ objectFit: 'cover' }}
                                priority
                                unoptimized={true}
                                sizes="144px"
                                className="hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full bg-navy-100 flex items-center justify-center">
                                <span className="text-3xl text-navy-900 font-serif">
                                    {config.artist.name.charAt(0)}
                                </span>
                            </div>
                        )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy-900 mb-2 tracking-wide">
                        {config.artist.name}
                    </h1>
                    <p className="text-navy-600 text-sm sm:text-base px-4 max-w-sm text-center font-medium">
                        {config.artist.tagline}
                    </p>
                </div>

                {/* Links Section */}
                <div className="w-full flex flex-col gap-4 mb-10">
                    {links && links.length > 0 ? (
                        links.map((link) => (
                            <a
                                key={link.id}
                                href={`/link/${link.slug}`}
                                className="group relative w-full overflow-hidden rounded-xl bg-white border border-premium shadow-sm hover:shadow-premium-md hover:border-gold-300 transition-all duration-300"
                            >
                                <div className="px-6 py-4 flex items-center justify-center">
                                    <span className="font-semibold text-navy-900 tracking-wide group-hover:text-gold-600 transition-colors">
                                        {link.title || link.platform}
                                    </span>
                                </div>
                            </a>
                        ))
                    ) : (
                        <div className="text-center text-navy-600 py-8 text-sm bg-white rounded-xl border border-premium shadow-sm">
                            <p>No featured links available right now.</p>
                            <p className="mt-1">Check back later!</p>
                        </div>
                    )}
                </div>

                {/* Social Footer */}
                <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-200 pt-6 w-full max-w-[280px]">
                    {Object.entries(config.socialMedia || {}).map(([platform, url]) => 
                        renderSocialIcon(platform, url as string)
                    )}
                </div>
            </div>
            
            {/* Watermark/Footer */}
            <div className="relative z-10 mt-auto pt-12 pb-4">
                <Link href="/" className="text-xs text-navy-400 hover:text-gold-600 transition-colors uppercase tracking-widest">
                    {config.artist.name} Official Website
                </Link>
            </div>
        </div>
    );
}
