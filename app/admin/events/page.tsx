'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types/event';
import {
    Plus,
    Search,
    MapPin,
    Calendar,
    Clock,
    ExternalLink,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Filter,
    Globe
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';

export default function EventsPage() {
    const { addToast } = useToast();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: false });

            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            addToast('Failed to fetch events', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    async function togglePublish(id: string, currentStatus: boolean) {
        try {
            const { error } = await supabase
                .from('events')
                .update({ is_published: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setEvents(events.map(e => e.id === id ? { ...e, is_published: !currentStatus } : e));
            addToast(`Event ${!currentStatus ? 'published' : 'unpublished'} successfully`, 'success');
        } catch (error) {
            console.error('Error toggling publish status:', error);
            addToast('Failed to update event status', 'error');
        }
    }

    async function deleteEvent(id: string) {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            // 1. Find the event to get its image_url
            const eventToDelete = events.find(e => e.id === id);

            // 2. If it has an image, delete it from storage first
            if (eventToDelete?.image_url) {
                try {
                    // Extract filename from URL (format: .../public/events/filename.png)
                    const urlParts = eventToDelete.image_url.split('/');
                    const fileName = urlParts[urlParts.length - 1];

                    if (fileName) {
                        const { error: storageError } = await supabase.storage
                            .from('events')
                            .remove([fileName]);

                        if (storageError) {
                            console.warn('Storage cleanup failed, proceeding with DB deletion:', storageError);
                        }
                    }
                } catch (err) {
                    console.error('Error parsing image URL for cleanup:', err);
                }
            }

            // 3. Delete from database
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setEvents(events.filter(e => e.id !== id));
            addToast('Event deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting event:', error);
            addToast('Failed to delete event', 'error');
        }
    }

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Events Management</h1>
                    <p className="text-slate-500 text-xs mt-0.5">Manage your concert dates and event details.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 rounded-lg text-xs font-semibold transition-colors"
                    >
                        <Globe className="h-3.5 w-3.5" />
                        View Site
                    </Link>
                    <Link
                        href="/admin/events/new"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Event
                    </Link>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search events, venues, cities..."
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="px-3 py-2 border border-slate-200 rounded text-xs font-semibold flex items-center gap-1.5 text-slate-600 hover:bg-slate-50 transition-colors bg-white">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    Filters
                </button>
            </div>

            {/* Events List */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center text-slate-400">
                        <div className="h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-xs">Loading events...</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-slate-50/50">
                        <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-800">
                            {searchTerm ? `No events match "${searchTerm}"` : 'No events scheduled yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-505">
                                    <th className="px-5 py-3.5">Event Details</th>
                                    <th className="px-5 py-3.5">Date & Time</th>
                                    <th className="px-5 py-3.5">Location</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredEvents.map((event) => (
                                    <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                {event.image_url ? (
                                                    <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 border border-slate-200 bg-slate-50">
                                                        <Image
                                                            src={event.image_url}
                                                            alt={event.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                                        <Calendar className="h-4 w-4 text-slate-305" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-slate-800 line-clamp-1">
                                                        {event.title}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{event.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="text-slate-700 flex items-center gap-1.5 font-medium">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                {event.date}
                                            </div>
                                            {event.time && (
                                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    {event.time}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="text-slate-700 font-medium">{event.venue}</div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                                                <MapPin className="h-3 w-3" />
                                                {event.city}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <button
                                                onClick={() => togglePublish(event.id, event.is_published)}
                                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider transition-colors ${
                                                    event.is_published
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/70'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/70'
                                                }`}
                                            >
                                                {event.is_published ? (
                                                    <><Eye className="h-3 w-3" /> Published</>
                                                ) : (
                                                    <><EyeOff className="h-3 w-3" /> Draft</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                {event.is_published && (
                                                    <Link
                                                        href="/#events"
                                                        target="_blank"
                                                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 bg-white rounded transition-colors"
                                                        title="View Live"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </Link>
                                                )}
                                                <Link
                                                    href={`/admin/events/edit?id=${event.id}`}
                                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 bg-white rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Link>
                                                <button
                                                    onClick={() => deleteEvent(event.id)}
                                                    className="p-1 text-slate-400 hover:text-red-650 hover:bg-red-50 border border-slate-200 bg-white rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
