'use client';

import React, { useState, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useEvents } from '@/hooks/useEvents';
import { EventCard } from './EventCard';
import { Music, Calendar, History, Loader2, Sparkles } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

export default function Schedule() {
    const { events, loading, error } = useEvents();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    const { upcomingEvents, pastEvents } = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const upcoming = events.filter(e => new Date(e.date) >= now)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const past = events.filter(e => new Date(e.date) < now)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { upcomingEvents: upcoming, pastEvents: past };
    }, [events]);

    const jsonLd = useMemo(() => {
        if (upcomingEvents.length === 0) return null;

        return {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            'itemListElement': upcomingEvents.map((event, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'item': {
                    '@type': 'MusicEvent',
                    'name': event.title,
                    'startDate': event.date + (event.time ? `T${event.time}` : ''),
                    'location': {
                        '@type': 'Place',
                        'name': event.venue,
                        'address': {
                            '@type': 'PostalAddress',
                            'addressLocality': event.city,
                        }
                    },
                    'description': event.description,
                    'performer': {
                        '@type': 'Person',
                        'name': 'Aishwarya Manikarnike'
                    },
                    'url': event.booking_url || undefined
                }
            }))
        };
    }, [upcomingEvents]);

    return (
        <section id="schedule" className="relative py-24 px-4 sm:px-6 md:px-8 bg-cream-50 overflow-hidden" aria-label="Schedule">
            {/* Premium Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-gold-200/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-navy-200/10 rounded-full blur-[120px] pointer-events-none" />

            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <m.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-navy-900 mb-2 md:mb-3 tracking-tight"
                    >
                        Performance <span className="text-gold-600">Schedule</span>
                    </m.h2>

                    <m.div
                        initial={{ width: 0 }}
                        whileInView={{ width: 80 }}
                        viewport={{ once: true }}
                        className="h-1 bg-gradient-to-r from-gold-400 to-gold-600 mx-auto rounded-full mb-8 shadow-gold-sm"
                    />
                </div>

                {/* Highly Readable Tab Switcher */}
                <div className="flex justify-center mb-16">
                    <div className="relative inline-flex p-1 bg-white shadow-premium-md rounded-2xl border border-navy-100/50">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`relative flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 min-w-[160px] ${activeTab === 'upcoming'
                                ? 'text-navy-950'
                                : 'text-navy-500 hover:text-navy-900'
                                }`}
                        >
                            {activeTab === 'upcoming' && (
                                <m.div
                                    layoutId="activeTabPill"
                                    className="absolute inset-0 bg-gold-600 rounded-xl shadow-lg shadow-gold-600/20"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <Calendar className={`relative z-10 h-4 w-4 ${activeTab === 'upcoming' ? 'text-navy-950' : 'text-navy-400'}`} />
                            <span className="relative z-10 uppercase tracking-widest">Upcoming</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`relative flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 min-w-[160px] ${activeTab === 'past'
                                ? 'text-navy-950'
                                : 'text-navy-500 hover:text-navy-900'
                                }`}
                        >
                            {activeTab === 'past' && (
                                <m.div
                                    layoutId="activeTabPill"
                                    className="absolute inset-0 bg-gold-600 rounded-xl shadow-lg shadow-gold-600/20"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <History className={`relative z-10 h-4 w-4 ${activeTab === 'past' ? 'text-navy-950' : 'text-navy-400'}`} />
                            <span className="relative z-10 uppercase tracking-widest">Past Records</span>
                        </button>
                    </div>
                </div>

                <div className="relative min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <m.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-32 gap-6"
                            >
                                <div className="relative">
                                    <Loader2 className="h-12 w-12 text-gold-600 animate-spin" />
                                    <div className="absolute inset-0 h-12 w-12 border-4 border-gold-100 rounded-full" />
                                </div>
                                <p className="text-navy-400 font-serif italic text-lg tracking-wide animate-pulse">Consulting the calendar...</p>
                            </m.div>
                        ) : error ? (
                            <m.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/50 backdrop-blur-sm border border-red-100 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-premium-lg"
                            >
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Music className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-navy-950 mb-3">Unable to refresh live dates</h3>
                                <p className="text-gray-600 mb-0">Currently displaying previously cached records. Please check back soon.</p>
                            </m.div>
                        ) : (
                            <m.div
                                key={activeTab}
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                            >
                                {activeTab === 'upcoming' ? (
                                    upcomingEvents.length > 0 ? (
                                        upcomingEvents.map((event) => (
                                            <EventCard key={event.id} event={event} />
                                        ))
                                    ) : (
                                        <m.div
                                            key="no-upcoming"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="col-span-full py-32 text-center"
                                        >
                                            <div className="w-24 h-24 bg-gold-50/50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                                                <Music className="h-10 w-10 text-gold-300" />
                                            </div>
                                            <h3 className="text-3xl font-serif font-bold text-navy-950 mb-4 tracking-tight">Ethereal Silence</h3>
                                            <p className="text-navy-400 text-lg max-w-md mx-auto leading-relaxed">The stage is being prepared for new melodies. Upcoming performance dates will be unveiled shortly.</p>
                                        </m.div>
                                    )
                                ) : (
                                    pastEvents.length > 0 ? (
                                        pastEvents.map((event) => (
                                            <EventCard key={event.id} event={event} isPast />
                                        ))
                                    ) : (
                                        <m.div
                                            key="no-past"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="col-span-full py-32 text-center"
                                        >
                                            <h3 className="text-2xl font-serif font-bold text-navy-950 mb-2">Historical Records</h3>
                                            <p className="text-navy-400">No past performance records are currently listed.</p>
                                        </m.div>
                                    )
                                )}
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
