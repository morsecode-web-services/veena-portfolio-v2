'use client';

import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ExternalLink, Ticket, ArrowRight, X, Maximize2 } from 'lucide-react';
import { Event } from '../../types/event';
import Image from 'next/image';

interface EventCardProps {
    event: Event;
    isPast?: boolean;
}

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 15
        }
    }
};

// Utility to check if a value is a valid, non-null, non-empty string
const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const trimmed = url.toString().trim();
    return trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined';
};

export const EventCard: React.FC<EventCardProps> = ({ event, isPast }) => {
    const [dateInfo, setDateInfo] = useState<{ day: string, month: string, year: string, weekday: string } | null>(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    useEffect(() => {
        const dateObj = new Date(event.date);
        setDateInfo({
            day: dateObj.toLocaleDateString('en-US', { day: '2-digit' }),
            month: dateObj.toLocaleDateString('en-US', { month: 'short' }),
            year: dateObj.toLocaleDateString('en-US', { year: 'numeric' }),
            weekday: dateObj.toLocaleDateString('en-US', { weekday: 'short' })
        });
    }, [event.date]);

    const hasImage = isValidUrl(event.image_url);
    const hasBooking = isValidUrl(event.booking_url);
    const hasMap = isValidUrl(event.map_url);

    return (
        <>
            <m.div
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative flex flex-col gap-0 rounded-[2rem] bg-white border border-navy-100 shadow-premium transition-all duration-500 hover:shadow-gold-lg overflow-hidden"
            >
                {/* Conditional Layout: Poster (Vertical with Image) vs Slate (Horizontal without Image) */}
                {hasImage ? (
                    <>
                        <div
                            className="relative w-full h-52 overflow-hidden cursor-zoom-in group/img"
                            onClick={() => setIsLightboxOpen(true)}
                        >
                            <Image
                                src={event.image_url!}
                                alt={event.title}
                                fill
                                className={`object-cover transition-transform duration-700 group-hover/img:scale-110 ${isPast ? 'opacity-60 grayscale' : ''}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent opacity-60" />

                            {/* Zoom Overlay Hint */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-300">
                                <div className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white">
                                    <Maximize2 className="h-5 w-5" />
                                </div>
                            </div>

                            {/* Date Badge Overlay */}
                            <div className="absolute top-4 left-4 z-30 flex flex-col items-center justify-center gap-0 w-20 h-24 rounded-2xl bg-navy-950 text-white shadow-xl overflow-hidden group-hover:bg-gold-600 transition-all duration-500 border border-white/10 pointer-events-none">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gold-400 group-hover:bg-white transition-colors duration-500" />
                                <div className="flex flex-col items-center justify-center p-2 relative z-10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-400 group-hover:text-navy-950 transition-colors duration-500">
                                        {dateInfo?.month || '---'}
                                    </span>
                                    <span className="text-3xl font-serif font-black text-white group-hover:text-navy-950 tracking-tighter leading-none my-1 transition-colors duration-500">
                                        {dateInfo?.day || '--'}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 group-hover:text-navy-950/80 transition-colors duration-500">
                                        {dateInfo?.weekday || '---'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Content Container (Poster Mode) */}
                        <div className="relative z-10 flex-grow flex flex-col gap-4 p-8">
                            {renderContent(event, isPast || false, hasBooking, hasMap)}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-0 group/card min-h-[12rem] relative z-20">
                        {/* Badge on Left (Horizontal Mode) */}
                        <div className="pt-8 px-8 sm:pr-0 flex-shrink-0 flex items-center justify-center relative z-30">
                            <div className="flex flex-col items-center justify-center gap-0 w-24 h-32 rounded-2xl bg-navy-950 text-white shadow-xl overflow-hidden relative group-hover:bg-gold-600 transition-all duration-500 border border-navy-800">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gold-400 group-hover:bg-white transition-colors duration-500" />
                                <div className="flex flex-col items-center justify-center p-3 relative z-10">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-gold-400 group-hover:text-navy-950 transition-colors duration-500">
                                        {dateInfo?.month || '---'}
                                    </span>
                                    <span className="text-4xl font-serif font-black text-white group-hover:text-navy-950 tracking-tighter leading-none my-1.5 transition-colors duration-500">
                                        {dateInfo?.day || '--'}
                                    </span>
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/70 group-hover:text-navy-950/80 transition-colors duration-500">
                                        {dateInfo?.weekday || '---'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Content Container (Slate Mode) */}
                        <div className="relative z-10 flex-grow flex flex-col gap-4 p-8 justify-center">
                            {renderContent(event, isPast || false, hasBooking, hasMap)}
                        </div>
                    </div>
                )}
            </m.div>

            {/* Custom Premium Lightbox */}
            <AnimatePresence>
                {isLightboxOpen && hasImage && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/95 backdrop-blur-md p-4 sm:p-8"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <m.button
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-[110]"
                            onClick={() => setIsLightboxOpen(false)}
                        >
                            <X className="h-6 w-6" />
                        </m.button>

                        <m.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative max-w-5xl w-full aspect-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative w-full h-[80vh]">
                                <Image
                                    src={event.image_url!}
                                    alt={event.title}
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                <h4 className="text-xl font-serif font-bold text-white mb-1">{event.title}</h4>
                                <p className="text-gold-400 text-sm font-medium uppercase tracking-widest">{event.venue}, {event.city}</p>
                            </div>
                        </m.div>
                    </m.div>
                )}
            </AnimatePresence>
        </>
    );
};

// Helper for rendering shared content accurately
function renderContent(event: Event, isPast: boolean, hasBooking: boolean, hasMap: boolean) {
    return (
        <div className={isPast ? 'opacity-70 grayscale-[0.3]' : ''}>
            {/* Category & Status */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isPast ? 'bg-navy-200' : 'bg-gold-500 animate-pulse'}`} />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold-700">
                        {event.category || 'Performance'}
                    </span>
                </div>
                {isPast && (
                    <span className="text-[9px] uppercase tracking-[0.2em] font-black text-navy-400">
                        Archived
                    </span>
                )}
            </div>

            {/* Performance Title */}
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-navy-900 leading-tight group-hover:text-gold-700 transition-colors duration-300">
                {event.title}
            </h3>

            {/* Essential Info Grid */}
            <div className="flex flex-col gap-3 my-2">
                <div className="flex items-start gap-3 text-navy-800">
                    <MapPin className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium leading-tight">{event.venue}, {event.city}</span>
                </div>
                {isValidUrl(event.time) && (
                    <div className="flex items-center gap-3 text-navy-600">
                        <Clock className="h-4 w-4 text-gold-500 flex-shrink-0" />
                        <span className="text-sm font-medium">{event.time}</span>
                    </div>
                )}
            </div>

            {/* Description */}
            {isValidUrl(event.description) && (
                <p className="text-sm leading-relaxed text-navy-500/80 line-clamp-2 italic border-l-2 border-gold-100 pl-4 py-1">
                    &quot;{event.description}&quot;
                </p>
            )}

            {/* Premium CTA Buttons */}
            {(hasBooking || hasMap) && (
                <div className={`mt-auto flex items-center gap-4 pt-6 mt-2 border-t border-navy-50/50 ${hasBooking && hasMap ? 'justify-between' : 'justify-end'
                    }`}>
                    {hasBooking && !isPast && (
                        <a
                            href={event.booking_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs font-bold text-navy-950 hover:text-gold-600 transition-colors group/btn"
                        >
                            <Ticket className="h-4 w-4" />
                            <span>SECURE ACCESS</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                        </a>
                    )}

                    {hasMap && (
                        <a
                            href={event.map_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-navy-50 text-navy-400 hover:bg-navy-950 hover:text-gold-400 transition-all duration-300 shadow-sm"
                            aria-label="View Map"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
