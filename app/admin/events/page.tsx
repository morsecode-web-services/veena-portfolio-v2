'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types/event';
import {
    Plus,
    Search,
    MoreVertical,
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
import { format } from 'date-fns';
import { useToast } from '@/context/ToastContext';

export default function EventsPage() {
    const { addToast } = useToast();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    async function fetchEvents() {
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
    }

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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900">Events Management</h1>
                    <p className="text-sm text-gray-500">Manage your concert dates and event details</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-bold text-sm"
                    >
                        <Globe className="h-4 w-4" />
                        View Site
                    </Link>
                    <Link
                        href="/admin/events/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors font-bold text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Add Event
                    </Link>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search events, venues, cities..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm flex items-center gap-2 text-gray-600 hover:bg-gray-50">
                    <Filter className="h-4 w-4" />
                    Filters
                </button>
            </div>

            {/* Events List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading events...</div>
                ) : filteredEvents.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        {searchTerm ? 'No events match your search.' : 'No events scheduled yet.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-5 text-[10px] font-black text-navy-900/40 uppercase tracking-[0.2em]">Event Details</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-navy-900/40 uppercase tracking-[0.2em]">Date & Time</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-navy-900/40 uppercase tracking-[0.2em]">Location</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-navy-900/40 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-6 py-5 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredEvents.map((event) => (
                                    <tr key={event.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                {event.image_url ? (
                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                                        <Image
                                                            src={event.image_url}
                                                            alt={event.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-100">
                                                        <Calendar className="h-5 w-5 text-gray-300" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-navy-900 group-hover:text-navy-600 transition-colors font-serif line-clamp-1">
                                                        {event.title}
                                                    </div>
                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{event.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                {event.date}
                                            </div>
                                            {event.time && (
                                                <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {event.time}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 font-medium">{event.venue}</div>
                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {event.city}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => togglePublish(event.id, event.is_published)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${event.is_published
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {event.is_published ? (
                                                    <><Eye className="h-3 w-3" /> Published</>
                                                ) : (
                                                    <><EyeOff className="h-3 w-3" /> Draft</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {event.is_published && (
                                                    <Link
                                                        href="/#events"
                                                        target="_blank"
                                                        className="p-1.5 text-gray-400 hover:text-navy-600 transition-colors"
                                                        title="View Live"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                <Link
                                                    href={`/admin/events/edit?id=${event.id}`}
                                                    className="p-1.5 text-gray-400 hover:text-navy-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => deleteEvent(event.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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
