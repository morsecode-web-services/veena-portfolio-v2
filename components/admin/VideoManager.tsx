'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Video } from '@/types/video';
import { Trash2, ExternalLink, Plus, Edit2, Check, Star, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import siteConfig from '@/public/config/site-config.json';
import { extractYoutubeId } from '@/lib/utils';

export function VideoManager() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Video>>({});

    // Form state for new video
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState(siteConfig.music.categories[0]?.id || '');
    const [subcategory, setSubcategory] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);

    const activeCategory = siteConfig.music.categories.find(c => c.id === category);

    useEffect(() => {
        if (activeCategory && activeCategory.subcategories.length > 0) {
            setSubcategory(activeCategory.subcategories[0].id);
        } else {
            setSubcategory('');
        }
    }, [category]);

    useEffect(() => {
        fetchVideos();
    }, []);

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

    const handleImportFromConfig = async () => {
        if (!confirm('This will import all videos from site-config.json to Supabase. Continue?')) return;
        setImporting(true);
        try {
            let count = 0;
            // Collect all videos from config
            const configVideos: any[] = [];

            // 1. Featured videos
            siteConfig.home.featuredVideos.forEach(v => {
                configVideos.push({ ...v, is_featured: true, category_id: 'veena' });
            });

            // 2. Category videos
            siteConfig.music.categories.forEach(cat => {
                cat.subcategories.forEach(sub => {
                    sub.videos.forEach(v => {
                        configVideos.push({
                            ...v,
                            category_id: cat.id,
                            subcategory_id: sub.id,
                            is_featured: false
                        });
                    });
                });
            });

            for (const v of configVideos) {
                const url = typeof v === 'string' ? v : v.url;
                const title = typeof v === 'string' ? 'Legacy Performance' : v.title;
                const vId = extractYoutubeId(url) || '';

                // Fetch metadata if possible
                const syncRes = await fetch('/api/videos/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url }),
                });

                const metadata = syncRes.ok ? await syncRes.json() : { title, thumbnail_url: `https://img.youtube.com/vi/${vId}/hqdefault.jpg`, url };

                await supabase.from('videos').insert([{
                    title: metadata.title,
                    url: metadata.url,
                    thumbnail_url: metadata.thumbnail_url,
                    category_id: v.category_id,
                    subcategory_id: v.subcategory_id || null,
                    is_featured: v.is_featured,
                    order_index: count++
                }]);
            }
            alert('Import complete!');
            fetchVideos();
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Check console.');
        } finally {
            setImporting(false);
        }
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
        } catch (error: any) {
            console.error('Failed to sync video:', error);
            alert(`Error: ${error.message || 'Check console'}`);
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
        } catch (error) {
            console.error('Error updating video:', error);
            alert('Failed to update video');
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
        } else {
            alert('Failed to delete video');
        }
    };

    const handleToggleFeatured = async (id: string, current: boolean) => {
        const { error } = await supabase
            .from('videos')
            .update({ is_featured: !current })
            .eq('id', id);

        if (!error) {
            fetchVideos();
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mr-2" /> Loading videos...
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-serif font-bold text-navy-900">Video Management</h1>
                <button
                    onClick={handleImportFromConfig}
                    disabled={importing}
                    className="px-4 py-2 bg-gold-50 text-gold-700 rounded-xl text-xs font-bold uppercase tracking-widest border border-gold-200 hover:bg-gold-100 transition-all flex items-center gap-2"
                >
                    {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Import from Config
                </button>
            </div>

            {/* Add Video Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-lg font-serif font-bold text-navy-900 mb-6 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-gold-500" /> Add New Performance
                </h2>
                <form onSubmit={handleSync} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            YouTube URL
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 outline-none text-sm font-bold"
                        >
                            {siteConfig.music.categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Subcategory
                        </label>
                        <select
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 outline-none text-sm font-bold"
                            disabled={!activeCategory || activeCategory.subcategories.length === 0}
                        >
                            {activeCategory?.subcategories.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer pt-4">
                            <input
                                type="checkbox"
                                checked={isFeatured}
                                onChange={(e) => setIsFeatured(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-navy-900 focus:ring-navy-500"
                            />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Featured</span>
                        </label>
                        <button
                            type="submit"
                            disabled={syncing || !url}
                            className="bg-navy-900 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-navy-800 disabled:opacity-50 transition-all shadow-md active:scale-95"
                        >
                            {syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Sync & Add'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Video List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-serif font-bold text-navy-900">All Performances ({videos.length})</h3>
                    <button onClick={fetchVideos} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-navy-400 uppercase tracking-widest">Preview</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-navy-400 uppercase tracking-widest">Title</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-navy-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-navy-400 uppercase tracking-widest">Subcategory</th>
                                <th className="px-6 py-4 text-center text-xs font-black text-navy-400 uppercase tracking-widest">Featured</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-navy-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {videos.map((video) => (
                                <tr key={video.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="relative w-24 aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
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
                                                <div className="flex items-center justify-center h-full text-[8px] text-gray-400">No Image</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === video.id ? (
                                            <input
                                                type="text"
                                                value={editData.title || ''}
                                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                                className="w-full px-2 py-1 text-sm border border-gold-300 rounded focus:outline-none focus:ring-1 focus:ring-gold-500"
                                            />
                                        ) : (
                                            <div className="text-sm font-serif font-bold text-navy-900 leading-tight">
                                                {video.title}
                                            </div>
                                        )}
                                        <div className="text-[10px] text-gray-400 mt-1 truncate max-w-[200px]">
                                            {video.url}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === video.id ? (
                                            <select
                                                value={editData.category_id || ''}
                                                onChange={(e) => {
                                                    const catId = e.target.value;
                                                    const subcatId = siteConfig.music.categories.find(c => c.id === catId)?.subcategories[0]?.id || '';
                                                    setEditData({ ...editData, category_id: catId, subcategory_id: subcatId });
                                                }}
                                                className="w-full px-2 py-1 text-xs border border-gold-300 rounded"
                                            >
                                                {siteConfig.music.categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="px-2 py-1 bg-navy-50 text-navy-400 text-[10px] font-black uppercase tracking-widest rounded">
                                                {video.category_id}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-400 capitalize">
                                        {editingId === video.id ? (
                                            <select
                                                value={editData.subcategory_id || ''}
                                                onChange={(e) => setEditData({ ...editData, subcategory_id: e.target.value })}
                                                className="w-full px-2 py-1 text-xs border border-gold-300 rounded"
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
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleToggleFeatured(video.id, video.is_featured)}
                                            className={`transition-colors ${video.is_featured ? 'text-gold-500' : 'text-gray-300 hover:text-gold-300'}`}
                                        >
                                            <Star className={`w-5 h-5 ${video.is_featured ? 'fill-current' : ''}`} />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {editingId === video.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateVideo(video.id)}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                                        title="Save Changes"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                                                        title="Cancel"
                                                    >
                                                        <Plus className="w-4 h-4 rotate-45 text-red-400" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEditing(video)}
                                                        className="p-1.5 text-navy-400 hover:bg-navy-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Edit Details"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <a
                                                        href={video.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 text-navy-400 hover:bg-navy-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(video.id)}
                                                        className="p-1.5 text-red-400 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {videos.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium italic">
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
