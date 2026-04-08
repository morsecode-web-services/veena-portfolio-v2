import Image from 'next/image';
import { loadConfig, getAssetPath } from '@/lib/config';

export default async function ComingSoonPage() {
    const config = await loadConfig();

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center py-16 px-6 overflow-hidden">
            {/* Background Replicating Main Hero */}
            <div className="fixed inset-0 z-0">
                <Image
                    src={getAssetPath(config.home.heroBackground || '/images/home/hero-bg.jpg')}
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
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_50%,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center mt-[-5%]">
                {/* Logo */}
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

                <p className="text-xs sm:text-sm tracking-[0.25em] sm:tracking-[0.4em] text-white/50 uppercase font-light mb-16">
                    Something beautiful is on its way
                </p>

                {/* Social Links */}
                <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
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
            
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"></div>
        </div>
    );
}
