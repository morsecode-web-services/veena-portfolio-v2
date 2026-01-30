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

    const { upcomingEvents, pastEventsByYear } = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const upcoming = events.filter(e => new Date(e.date) >= now)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const past = events.filter(e => new Date(e.date) < now)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Group past events by year
        const groupedPast: Record<string, typeof events> = {};
        past.forEach(event => {
            const year = new Date(event.date).getFullYear().toString();
            if (!groupedPast[year]) {
                groupedPast[year] = [];
            }
            groupedPast[year].push(event);
        });

        // Sort years descending
        const sortedYears = Object.keys(groupedPast).sort((a, b) => b.localeCompare(a));
        const pastByYear = sortedYears.map(year => ({
            year,
            events: groupedPast[year].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        }));

        return { upcomingEvents: upcoming, pastEventsByYear: pastByYear };
    }, [events]);

    const totalPastEvents = useMemo(() => {
        return pastEventsByYear.reduce((acc, yearGroup) => acc + yearGroup.events.length, 0);
    }, [pastEventsByYear]);

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
        <section id="schedule" className="relative py-24 px-4 sm:px-6 md:px-8 bg-white overflow-hidden" aria-label="Schedule">
            {/* Minimal Background */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-gold-100/10 rounded-full blur-[80px] pointer-events-none" />

            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}

            <div className="max-w-7xl mx-auto relative z-10">
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10 sm:mb-12"
                >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-navy-900 mb-2 md:mb-3 px-4">
                        {activeTab === 'upcoming' ? 'Concert Schedule' : 'Past Performances'}
                    </h2>
                    <div className="w-20 sm:w-24 h-1 bg-gold-400 mx-auto rounded-full"></div>
                </m.div>

                {/* Minimal Tab Switcher - Centered */}
                <div className="flex justify-center mb-12">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`relative pb-4 text-sm font-bold transition-colors duration-300 ${activeTab === 'upcoming'
                                ? 'text-navy-950'
                                : 'text-navy-400 hover:text-navy-600'
                                }`}
                        >
                            UPCOMING
                            {activeTab === 'upcoming' && (
                                <m.div
                                    layoutId="minimalTabUnderline"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy-950"
                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`relative pb-4 text-sm font-bold transition-colors duration-300 ${activeTab === 'past'
                                ? 'text-navy-950'
                                : 'text-navy-400 hover:text-navy-600'
                                }`}
                        >
                            ARCHIVE
                            {activeTab === 'past' && (
                                <m.div
                                    layoutId="minimalTabUnderline"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy-950"
                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                />
                            )}
                        </button>
                    </div>
                </div>

                <div className="relative">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="h-8 w-8 text-navy-200 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="py-20 text-center text-navy-400">
                            <p>Unable to load performance data at this time.</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Upcoming Content - Kept in DOM */}
                            <div className={`${activeTab === 'upcoming' ? 'block' : 'hidden'} transition-opacity duration-300`}>
                                <m.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate={activeTab === 'upcoming' ? "visible" : "hidden"}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                                >
                                    {upcomingEvents.length > 0 ? (
                                        upcomingEvents.map((event) => (
                                            <EventCard key={event.id} event={event} />
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 text-center text-navy-400">
                                            <p className="font-serif italic text-lg">New dates will be announced soon.</p>
                                        </div>
                                    )}
                                </m.div>
                            </div>

                            {/* Archive Content - Kept in DOM */}
                            <div className={`${activeTab === 'past' ? 'block' : 'hidden'} transition-opacity duration-300`}>
                                <m.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate={activeTab === 'past' ? "visible" : "hidden"}
                                    className="max-w-3xl mx-auto"
                                >
                                    {pastEventsByYear.length > 0 ? (
                                        <div className="space-y-12">
                                            {pastEventsByYear.map((yearGroup) => (
                                                <div key={yearGroup.year}>
                                                    <h3 className="text-sm font-black text-navy-950/20 mb-6 tracking-widest uppercase pb-2">
                                                        {yearGroup.year}
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {yearGroup.events.map((event) => (
                                                            <EventCard
                                                                key={event.id}
                                                                event={event}
                                                                isPast
                                                                viewMode="timeline"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center text-navy-400">
                                            <p>No past performance records available.</p>
                                        </div>
                                    )}
                                </m.div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
