'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { EventFormData } from '@/types/event';
import {
    Save,
    X,
    MapPin,
    Calendar,
    Clock,
    Info,
    Link as LinkIcon,
    Image as ImageIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ImageUpload } from './ImageUpload';

const eventSchema = z.object({
    // ... (rest of schema)
    title: z.string().min(3, 'Title is required'),
    date: z.string().min(1, 'Date is required'),
    time: z.string().nullable().optional(),
    venue: z.string().min(3, 'Venue is required'),
    city: z.string().min(2, 'City is required'),
    description: z.string().nullable().optional(),
    category: z.enum(['Performance', 'Workshop', 'Class', 'Other']),
    booking_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
    map_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
    image_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
    is_published: z.boolean().default(true),
});

type EventFormSchema = z.infer<typeof eventSchema>;

interface EventFormProps {
    initialData?: Partial<EventFormData>;
    onSubmit: (data: EventFormSchema) => Promise<void>;
    loading?: boolean;
}

export function EventForm({ initialData, onSubmit, loading }: EventFormProps) {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty },
    } = useForm<EventFormSchema>({
        resolver: zodResolver(eventSchema) as any,
        defaultValues: {
            category: 'Performance',
            is_published: true,
            date: new Date().toISOString().split('T')[0],
            ...(initialData as any),
        },
    });

    const imageUrl = watch('image_url');

    const handleFormSubmit = async (data: EventFormSchema) => {
        // Sanitize data: convert empty strings to null for optional fields
        const sanitizedData = {
            ...data,
            time: data.time || null,
            description: data.description || null,
            booking_url: data.booking_url || null,
            map_url: data.map_url || null,
            image_url: data.image_url || null,
        };
        await onSubmit(sanitizedData as any);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-4xl">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                            Event Title
                        </label>
                        <input
                            {...register('title')}
                            className={`w-full px-4 py-3 bg-gray-50 border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all`}
                            placeholder="e.g. Veena Solo Recital - Music Academy"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-500 font-medium">{errors.title.message}</p>}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-navy-400" /> Date
                        </label>
                        <input
                            type="date"
                            {...register('date')}
                            className={`w-full px-4 py-3 bg-gray-50 border ${errors.date ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all`}
                        />
                        {errors.date && <p className="mt-1 text-sm text-red-500 font-medium">{errors.date.message}</p>}
                    </div>

                    {/* Time */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                            <Clock className="h-4 w-4 text-navy-400" /> Time (Optional)
                        </label>
                        <input
                            type="time"
                            {...register('time')}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all"
                        />
                    </div>

                    {/* Venue */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                            Venue Name
                        </label>
                        <input
                            {...register('venue')}
                            className={`w-full px-4 py-3 bg-gray-50 border ${errors.venue ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all`}
                            placeholder="e.g. Chowdiah Memorial Hall"
                        />
                        {errors.venue && <p className="mt-1 text-sm text-red-500 font-medium">{errors.venue.message}</p>}
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-navy-400" /> City
                        </label>
                        <input
                            {...register('city')}
                            className={`w-full px-4 py-3 bg-gray-50 border ${errors.city ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all`}
                            placeholder="e.g. Bangalore"
                        />
                        {errors.city && <p className="mt-1 text-sm text-red-500 font-medium">{errors.city.message}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                            Event Category
                        </label>
                        <select
                            {...register('category')}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all"
                        >
                            <option value="Performance">Performance</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Class">Class</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Visibility */}
                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 h-fit self-end">
                        <input
                            type="checkbox"
                            id="is_published"
                            {...register('is_published')}
                            className="w-5 h-5 rounded border-gray-300 text-navy-900 focus:ring-navy-500 cursor-pointer"
                        />
                        <label htmlFor="is_published" className="text-sm font-bold text-navy-900 cursor-pointer select-none uppercase tracking-wide">
                            Published on Website
                        </label>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                            <Info className="h-4 w-4 text-navy-400" /> Description (Optional)
                        </label>
                        <div className="relative">
                            <textarea
                                {...register('description')}
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all resize-none"
                                placeholder="Add details about the concert, accompanists, etc..."
                                maxLength={500}
                            ></textarea>
                            <div className="absolute bottom-3 right-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest pointer-events-none">
                                {watch('description')?.length || 0} / 500
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-4">External Links & Media</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Booking URL */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-navy-400" /> Booking URL
                        </label>
                        <input
                            {...register('booking_url')}
                            className={`w-full px-4 py-3 bg-gray-50 border ${errors.booking_url ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all`}
                            placeholder="e.g. https://bookmyshow.com/..."
                        />
                        {errors.booking_url && <p className="mt-1 text-sm text-red-500 font-medium">{errors.booking_url.message}</p>}
                    </div>

                    {/* Map URL */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-navy-400" /> Venue Map URL
                        </label>
                        <input
                            {...register('map_url')}
                            className={`w-full px-4 py-3 bg-gray-50 border ${errors.map_url ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all`}
                            placeholder="Google Maps link"
                        />
                        {errors.map_url && <p className="mt-1 text-sm text-red-500 font-medium">{errors.map_url.message}</p>}
                    </div>

                    {/* Image Upload */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-navy-400" /> Featured Image
                        </label>
                        <ImageUpload
                            value={imageUrl || ''}
                            onChange={(url) => setValue('image_url', url)}
                        />
                        {errors.image_url && <p className="mt-1 text-sm text-red-500 font-medium">{errors.image_url.message}</p>}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => {
                        if (isDirty) {
                            if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
                                router.back();
                            }
                        } else {
                            router.back();
                        }
                    }}
                    className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition-colors uppercase tracking-widest text-xs flex items-center gap-2 disabled:bg-navy-200"
                >
                    {loading ? 'Processing...' : (
                        <>
                            <Save className="h-4 w-4" /> Save Event
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
