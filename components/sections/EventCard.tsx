'use client';

import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ExternalLink, Ticket, ArrowRight, X, Maximize2 } from 'lucide-react';
import { Event } from '../../types/event';
import Image from 'next/image';

interface EventCardProps {
    event: Event;
    isPast?: boolean;
    viewMode?: 'grid' | 'timeline';
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

// Helper format time to AM/PM
const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    try {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
        return timeStr;
    }
};

// Utility to check if a value is a valid, non-null, non-empty string
const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const trimmed = url.toString().trim();
    return trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined';
};

export const EventCard: React.FC<EventCardProps> = ({ event, isPast, viewMode = 'grid' }) => {
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

    if (viewMode === 'timeline') {
        return (
            <m.div
                variants={itemVariants}
                className="group flex gap-4 sm:gap-6"
            >
                {/* Minimal Date Column */}
                <div className="w-16 sm:w-20 pt-1 text-right flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <span className="block text-sm font-bold text-navy-900 leading-tight">{dateInfo?.month} {dateInfo?.day}</span>
                    <span className="block text-[10px] text-navy-400 font-medium uppercase tracking-wider">{dateInfo?.weekday}</span>
                </div>

                {/* Timeline Track */}
                <div className="relative flex flex-col items-center">
                    {/* Minimal Solid Dot */}
                    <div className="w-2 h-2 rounded-full bg-navy-200 mt-2 group-hover:bg-gold-500 transition-colors duration-300 z-10" />
                    {/* Continuous Line */}
                    <div className="w-px bg-navy-50 absolute top-2 bottom-0 left-1/2 -ml-[0.5px] -z-0" />
                </div>

                {/* Content */}
                <div className="pb-8 pt-0.5 flex-grow">
                    <h3 className="text-lg font-serif font-bold text-navy-900 mb-2 leading-tight group-hover:text-navy-700 transition-colors">
                        {event.title}
                    </h3>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-500 mb-2">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-navy-300" />
                            <span>{event.venue || event.city}</span>
                        </div>
                    </div>

                    {hasMap && (
                        <a
                            href={event.map_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-navy-400 hover:text-gold-600 transition-colors uppercase tracking-widest mt-1"
                        >
                            <ExternalLink className="h-3 w-3" />
                            <span>Details</span>
                        </a>
                    )}
                </div>
            </m.div>
        );
    }

    return (
        <>
            <m.div
                variants={itemVariants}
                className="group relative flex flex-col bg-white border border-navy-50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            >
                {hasImage && (
                    <div
                        className="relative w-full h-56 overflow-hidden cursor-zoom-in"
                        onClick={() => setIsLightboxOpen(true)}
                    >
                        <Image
                            src={event.image_url!}
                            alt={event.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Clean Date Badge */}
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-navy-50 text-center min-w-[50px]">
                            <span className="block text-[10px] font-black text-navy-400 uppercase leading-none mb-1">{dateInfo?.month}</span>
                            <span className="block text-xl font-serif font-bold text-navy-900 leading-none">{dateInfo?.day}</span>
                        </div>
                    </div>
                )}

                <div className="p-6 flex flex-col gap-4">
                    {!hasImage && (
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-2xl font-serif font-bold text-navy-900">{dateInfo?.day}</span>
                            <span className="text-xs font-bold text-navy-400 uppercase tracking-wider">{dateInfo?.month} {dateInfo?.year}</span>
                        </div>
                    )}

                    <div>
                        <span className="text-[9px] font-bold text-gold-600 uppercase tracking-[0.2em] mb-1 block">
                            {event.category || 'Performance'}
                        </span>
                        <h3 className="text-xl font-serif font-bold text-navy-900 leading-tight">
                            {event.title}
                        </h3>
                    </div>

                    <div className="flex flex-col gap-2 text-sm text-navy-600">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-navy-300 mt-0.5" />
                            <span>{event.venue}, {event.city}</span>
                        </div>
                        {isValidUrl(event.time) && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-navy-300" />
                                <span>{formatTime(event.time!)}</span>
                            </div>
                        )}
                    </div>

                    {(hasBooking || hasMap) && (
                        <div className="mt-2 pt-4 flex items-center justify-between">
                            {hasBooking && !isPast ? (
                                <a
                                    href={event.booking_url!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-bold text-navy-900 hover:text-gold-600 transition-colors uppercase tracking-widest flex items-center gap-2"
                                >
                                    Tickets <ArrowRight className="h-3 w-3" />
                                </a>
                            ) : <div></div>}

                            {hasMap && (
                                <a
                                    href={event.map_url!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-navy-50 text-navy-400 hover:bg-navy-100 transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </m.div>

            <AnimatePresence>
                {isLightboxOpen && hasImage && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/90 backdrop-blur-sm p-4"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <m.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative max-w-4xl w-full rounded-xl overflow-hidden bg-white shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative aspect-video">
                                <Image
                                    src={event.image_url!}
                                    alt={event.title}
                                    fill
                                    className="object-contain bg-navy-50"
                                />
                            </div>
                            <div className="p-6">
                                <h4 className="text-xl font-serif font-bold text-navy-900">{event.title}</h4>
                                <p className="text-sm text-navy-500">{event.venue} — {event.city}</p>
                            </div>
                            <button
                                className="absolute top-4 right-4 p-2 rounded-full bg-navy-900/10 hover:bg-navy-900/20 text-navy-900 transition-colors"
                                onClick={() => setIsLightboxOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </button>
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
        <div className={isPast ? 'opacity-90' : ''}>
            {/* Category & Status */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isPast ? 'bg-gold-300' : 'bg-gold-500 animate-pulse'}`} />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold-700">
                        {event.category || 'Performance'}
                    </span>
                </div>
                {isPast && (
                    <span className="text-[9px] uppercase tracking-[0.2em] font-black text-navy-400 bg-navy-50 px-2 py-0.5 rounded-full">
                        Heritage
                    </span>
                )}
            </div>

            {/* Performance Title */}
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-navy-900 leading-tight group-hover:text-gold-700 transition-colors duration-300 mb-4">
                {event.title}
            </h3>

            {/* Essential Info Grid */}
            <div className="flex flex-col gap-3 my-4">
                <div className="flex items-start gap-3 text-navy-800">
                    <MapPin className="h-5 w-5 text-gold-500 mt-0.5 flex-shrink-0" />
                    <span className="text-base font-medium leading-tight">{event.venue}, {event.city}</span>
                </div>
                {isValidUrl(event.time) && (
                    <div className="flex items-center gap-3 text-navy-600">
                        <Clock className="h-5 w-5 text-gold-500 flex-shrink-0" />
                        <span className="text-base font-medium">{formatTime(event.time!)}</span>
                    </div>
                )}
            </div>

            {/* Description */}
            {isValidUrl(event.description) && (
                <p className="text-base leading-relaxed text-navy-500/80 line-clamp-2 italic border-l-3 border-gold-100 pl-6 py-2 mb-6">
                    &quot;{event.description}&quot;
                </p>
            )}

            {/* Premium CTA Buttons */}
            {(hasBooking || hasMap) && (
                <div className={`mt-auto flex items-center gap-6 pt-6 border-t border-navy-50/50 ${hasBooking && hasMap ? 'justify-between' : 'justify-end'
                    }`}>
                    {hasBooking && !isPast && (
                        <a
                            href={event.booking_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs font-bold text-navy-950 hover:text-gold-600 transition-colors group/btn"
                        >
                            <Ticket className="h-4 w-4" />
                            <span className="uppercase tracking-widest">Reserve Spotlight</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                        </a>
                    )}

                    {hasMap && (
                        <a
                            href={event.map_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-2xl bg-navy-50 text-navy-400 hover:bg-navy-950 hover:text-gold-400 transition-all duration-300 shadow-sm"
                            aria-label="View Direction"
                        >
                            <ExternalLink className="h-5 w-5" />
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
