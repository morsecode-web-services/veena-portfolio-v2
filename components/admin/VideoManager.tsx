'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Video } from '@/types/video';
import { Trash2, ExternalLink, Plus, Edit2, Check, Star, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import type { SiteConfig } from '@/types';
import { extractYoutubeId } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export function VideoManager() {
    const { addToast } = useToast();
    const [videos, setVideos] = useState<Video[]>([]);
    const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Video>>({});

    // Form state for new video
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);

    const activeCategory = siteConfig?.music.categories.find(c => c.id === category);

    useEffect(() => {
        if (activeCategory && activeCategory.subcategories.length > 0) {
            setSubcategory(activeCategory.subcategories[0].id);
        } else {
            setSubcategory('');
        }
    }, [category, activeCategory]);

    useEffect(() => {
        const init = async () => {
            await fetchSiteConfig();
            await fetchVideos();
        };
        init();
    }, []);

    const triggerRevalidate = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                await fetch('/api/admin/revalidate', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
            }
        } catch (e) {
            console.error('Failed to flush cache', e);
        }
    };

    const fetchSiteConfig = async () => {
        try {
            const resp = await fetch('/api/admin/config');
            if (resp.ok) {
                const data = await resp.json();
                setSiteConfig(data);
                if (data.music.categories.length > 0) {
                    setCategory(data.music.categories[0].id);
                }
            }
        } catch (e) {
            console.error('Failed to fetch site config:', e);
        }
    };

    const fetchVideos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setVideos(data);
        }
        setLoading(false);
    };

    const handleSync = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setSyncing(true);
        try {
            // 1. Fetch metadata from our proxy API
            const response = await fetch('/api/videos/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to fetch metadata');
            }

            const metadata = await response.json();

            // 2. Perform insertion from the CLIENT (where the session is active)
            const { error: insertError } = await supabase
                .from('videos')
                .insert([{
                    title: metadata.title,
                    url: metadata.url,
                    thumbnail_url: metadata.thumbnail_url,
                    category_id: category,
                    subcategory_id: subcategory || null,
                    is_featured: isFeatured,
                    order_index: 0
                }]);

            if (insertError) throw insertError;

            setUrl('');
            setIsFeatured(false);
            fetchVideos();
            triggerRevalidate();
            addToast('Video added and synced successfully', 'success');
        } catch (error: any) {
            console.error('Failed to sync video:', error);
            addToast(error.message || 'Failed to sync video', 'error');
        } finally {
            setSyncing(false);
        }
    };

    const handleUpdateVideo = async (id: string) => {
        try {
            const { error } = await supabase
                .from('videos')
                .update(editData)
                .eq('id', id);

            if (error) throw error;

            setVideos(videos.map(v => v.id === id ? { ...v, ...editData } : v));
            setEditingId(null);
            triggerRevalidate();
            addToast('Video updated successfully', 'success');
        } catch (error) {
            console.error('Error updating video:', error);
            addToast('Failed to update video', 'error');
        }
    };

    const startEditing = (video: Video) => {
        setEditingId(video.id);
        setEditData({
            title: video.title,
            category_id: video.category_id,
            subcategory_id: video.subcategory_id
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this video?')) return;

        const { error } = await supabase.from('videos').delete().eq('id', id);
        if (!error) {
            fetchVideos();
            triggerRevalidate();
            addToast('Video deleted successfully', 'success');
        } else {
            addToast('Failed to delete video', 'error');
        }
    };

    const handleToggleFeatured = async (id: string, current: boolean) => {
        const { error } = await supabase
            .from('videos')
            .update({ is_featured: !current })
            .eq('id', id);

        if (!error) {
            fetchVideos();
            triggerRevalidate();
            addToast(`Video ${!current ? 'featured' : 'unfeatured'} successfully`, 'success');
        }
    };

    if (loading || !siteConfig) return (
        <div className="flex items-center justify-center h-64 text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mr-2" /> {loading ? 'Loading videos...' : 'Finalizing configuration...'}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Add Video Form */}
            <div className="bg-white p-5 rounded border border-slate-200 shadow-none">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add New Performance
                </h2>
                <form onSubmit={handleSync} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            YouTube URL
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-slate-800"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-slate-800 font-semibold"
                        >
                            {siteConfig.music.categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Subcategory
                        </label>
                        <select
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-slate-800 font-semibold"
                            disabled={!activeCategory || activeCategory.subcategories.length === 0}
                        >
                            {activeCategory?.subcategories.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer pb-2">
                            <input
                                type="checkbox"
                                checked={isFeatured}
                                onChange={(e) => setIsFeatured(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900"
                            />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Featured</span>
                        </label>
                        <button
                            type="submit"
                            disabled={syncing || !url}
                            className="bg-slate-900 text-white px-4 py-2 rounded font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            {syncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Sync & Add'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Video List */}
            <div className="bg-white rounded border border-slate-200 shadow-none overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">All Performances ({videos.length})</h3>
                    <button onClick={fetchVideos} className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-400 hover:text-slate-650">
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left">Preview</th>
                                <th className="px-4 py-3 text-left">Title</th>
                                <th className="px-4 py-3 text-left">Category</th>
                                <th className="px-4 py-3 text-left">Subcategory</th>
                                <th className="px-4 py-3 text-center">Featured</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {videos.map((video) => (
                                <tr key={video.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="relative w-24 aspect-video rounded overflow-hidden border border-slate-200 bg-slate-50">
                                            {video.thumbnail_url ? (
                                                <Image
                                                    src={video.thumbnail_url}
                                                    alt={video.title}
                                                    fill
                                                    className="object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        if (!target.src.includes('hqdefault')) {
                                                            const vId = extractYoutubeId(video.url);
                                                            if (vId) target.src = `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-[8px] text-slate-400">No Image</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {editingId === video.id ? (
                                            <input
                                                type="text"
                                                value={editData.title || ''}
                                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                                className="w-full px-2 py-1 text-xs border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 bg-white"
                                            />
                                        ) : (
                                            <div className="text-xs font-semibold text-slate-800 leading-tight">
                                                {video.title}
                                            </div>
                                        )}
                                        <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]">
                                            {video.url}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {editingId === video.id ? (
                                            <select
                                                value={editData.category_id || ''}
                                                onChange={(e) => {
                                                    const catId = e.target.value;
                                                    const subcatId = siteConfig.music.categories.find(c => c.id === catId)?.subcategories[0]?.id || '';
                                                    setEditData({ ...editData, category_id: catId, subcategory_id: subcatId });
                                                }}
                                                className="w-full px-2 py-1 text-xs border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                                            >
                                                {siteConfig.music.categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-wider rounded border border-slate-200">
                                                {video.category_id}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs font-medium text-slate-500 capitalize">
                                        {editingId === video.id ? (
                                            <select
                                                value={editData.subcategory_id || ''}
                                                onChange={(e) => setEditData({ ...editData, subcategory_id: e.target.value })}
                                                className="w-full px-2 py-1 text-xs border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                                            >
                                                {siteConfig.music.categories
                                                    .find(c => c.id === editData.category_id)
                                                    ?.subcategories.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                            </select>
                                        ) : (
                                            video.subcategory_id || '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleToggleFeatured(video.id, video.is_featured)}
                                            className={`transition-colors ${video.is_featured ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}
                                        >
                                            <Star className={`w-4 h-4 ${video.is_featured ? 'fill-current' : ''}`} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1.5">
                                            {editingId === video.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateVideo(video.id)}
                                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                                        title="Save Changes"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                                        title="Cancel"
                                                    >
                                                        <Plus className="w-4 h-4 rotate-45 text-red-500" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEditing(video)}
                                                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all"
                                                        title="Edit Details"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <a
                                                        href={video.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all inline-block"
                                                        title="Open in YouTube"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(video.id)}
                                                        className="p-1 text-red-400 hover:text-red-650 hover:bg-red-50 rounded transition-all"
                                                        title="Delete Performance"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {videos.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-medium italic text-xs">
                                        No performances added yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
