import Image from 'next/image';
import { loadConfig, getAssetPath } from '@/lib/config';
import { createClient } from '@supabase/supabase-js';
import CohortClient from '../cohorts/CohortClient';

export default async function ComingSoonPage() {
    const config = await loadConfig();
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: cohorts } = await supabase
        .from('cohorts')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

    return (
        <div className="min-h-screen relative overflow-y-auto overflow-x-hidden bg-black">
            {/* Background Replicating Main Hero */}
            <div className="fixed inset-0 z-0">
                <Image
                    src={getAssetPath(config.home.heroBackground || 'https://placehold.co/1920x1080/14213d/d4af37?text=Hero+Image')}
                    alt="Background"
                    fill
                    className="object-cover"
                    style={{ objectPosition: config.home.heroBackgroundPosition || 'center 35%' }}
                    priority
                    unoptimized={true}
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full flex flex-col items-center pt-24 pb-24 px-6">
                {/* Hero Content */}
                <div className="max-w-3xl text-center flex flex-col items-center mb-24">
                    {config.artist.logo && (
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-10">
                            <Image
                                src={getAssetPath(config.artist.logo)}
                                alt="Logo"
                                fill
                                className="object-contain brightness-0 invert opacity-80"
                                priority
                                unoptimized={true}
                            />
                        </div>
                    )}
                    
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white tracking-wide leading-tight mb-6">
                        {config.artist.name}
                    </h1>
                    
                    <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-gold-500 to-transparent my-6"></div>
                    
                    <p className="text-gold-200/90 text-lg sm:text-xl md:text-2xl font-serif italic mb-10">
                        {config.artist.tagline || 'Classical Veena Artiste & Vocalist'}
                    </p>

                    <p className="text-xs sm:text-sm tracking-[0.25em] sm:tracking-[0.4em] text-white/50 uppercase font-light">
                        Something beautiful is on its way
                    </p>
                </div>

                {/* Cohorts Section */}
                {config.showCohortsOnComingSoon && (
                    <div className="w-full max-w-7xl">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">
                                Next Avarthanam
                            </h2>
                            <div className="w-16 h-[1px] bg-gold-500/50 mx-auto"></div>
                        </div>
                        
                        <CohortClient initialCohorts={cohorts || []} />
                    </div>
                )}

                {/* Social Links */}
                <div className="mt-24 flex flex-wrap justify-center gap-8 sm:gap-12">
                    {config.socialMedia?.instagram && (
                        <a
                            href={config.socialMedia.instagram as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/40 hover:text-gold-400 text-xs sm:text-sm tracking-widest uppercase transition-colors border-b border-gold-500/30 hover:border-gold-400 pb-1"
                        >
                            Instagram
                        </a>
                    )}
                    {config.socialMedia?.youtube && (
                        <a
                            href={config.socialMedia.youtube as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/40 hover:text-gold-400 text-xs sm:text-sm tracking-widest uppercase transition-colors border-b border-gold-500/30 hover:border-gold-400 pb-1"
                        >
                            YouTube
                        </a>
                    )}
                    {config.artist.email && (
                        <a
                            href={`mailto:${config.artist.email}`}
                            className="text-white/40 hover:text-gold-400 text-xs sm:text-sm tracking-widest uppercase transition-colors border-b border-gold-500/30 hover:border-gold-400 pb-1"
                        >
                            Contact
                        </a>
                    )}
                </div>
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent z-20"></div>
        </div>
    );
}
