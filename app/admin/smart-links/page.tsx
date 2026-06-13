'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Link as LinkIcon, ExternalLink, RefreshCw, Copy, RotateCcw, Edit2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { invalidateSmartLinksCache } from './actions';

interface SmartLink {
    id: string;
    slug: string;
    target_url: string;
    platform: string;
    clicks: number;
    title: string | null;
    show_in_bio: boolean;
    order_index: number;
    created_at: string;
}

export default function SmartLinksPage() {
    const { addToast } = useToast();
    const [links, setLinks] = useState<SmartLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form state
    const [slug, setSlug] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [platform, setPlatform] = useState('other');
    const [domain, setDomain] = useState('yourdomain.com');
    const [title, setTitle] = useState('');
    const [showInBio, setShowInBio] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setDomain(window.location.host);
        fetchLinks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCopy = (slug: string) => {
        const url = `${window.location.origin}/link/${slug}`;
        navigator.clipboard.writeText(url);
        addToast('Link copied to clipboard', 'success');
    };

    const fetchLinks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('smart_links')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching smart links:', error);
            addToast('Failed to fetch smart links', 'error');
        } else {
            setLinks(data || []);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        if (!formattedSlug || !targetUrl) {
            addToast('Please fill all required fields', 'error');
            return;
        }

        if (editingId) {
            setIsUpdating(true);
            const { error } = await supabase
                .from('smart_links')
                .update({ slug: formattedSlug, target_url: targetUrl, platform, title: title || null, show_in_bio: showInBio })
                .eq('id', editingId);

            if (error) {
                console.error('Error updating link:', error);
                if (error.code === '23505') {
                    addToast('That custom slug is already taken.', 'error');
                } else {
                    addToast('Failed to update link', 'error');
                }
            } else {
                await invalidateSmartLinksCache();
                addToast('Smart link updated successfully', 'success');
                handleCancelEdit();
                fetchLinks();
            }
            setIsUpdating(false);
        } else {
            setIsCreating(true);
            const { error } = await supabase
                .from('smart_links')
                .insert([{ slug: formattedSlug, target_url: targetUrl, platform, title: title || null, show_in_bio: showInBio }]);

            if (error) {
                console.error('Error creating link:', error);
                if (error.code === '23505') {
                    addToast('That custom slug is already taken. Please choose another.', 'error');
                } else {
                    addToast('Failed to create link', 'error');
                }
            } else {
                await invalidateSmartLinksCache();
                addToast('Smart link created successfully', 'success');
                setSlug('');
                setTargetUrl('');
                setPlatform('other');
                setTitle('');
                setShowInBio(false);
                fetchLinks();
            }
            setIsCreating(false);
        }
    };

    const handleEditClick = (link: SmartLink) => {
        setSlug(link.slug);
        setTargetUrl(link.target_url);
        setPlatform(link.platform);
        setTitle(link.title || '');
        setShowInBio(link.show_in_bio || false);
        setEditingId(link.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setSlug('');
        setTargetUrl('');
        setPlatform('other');
        setTitle('');
        setShowInBio(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this smart link?')) return;

        const { error } = await supabase
            .from('smart_links')
            .delete()
            .eq('id', id);

        if (error) {
            addToast('Failed to delete smart link', 'error');
        } else {
            await invalidateSmartLinksCache();
            addToast('Smart link deleted', 'success');
            if (editingId === id) handleCancelEdit();
            fetchLinks();
        }
    };

    const handleResetClicks = async (id: string) => {
        if (!confirm('Are you sure you want to reset the clicks for this link?')) return;

        const { error } = await supabase
            .from('smart_links')
            .update({ clicks: 0 })
            .eq('id', id);

        if (error) {
            addToast('Failed to reset clicks', 'error');
        } else {
            addToast('Clicks reset to 0', 'success');
            fetchLinks();
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Smart Links</h1>
                    <p className="text-slate-500 text-xs mt-0.5">Create short, trackable redirect links. Optionally enable deep linking to open native apps like YouTube and Instagram on mobile.</p>
                </div>
                <button
                    onClick={fetchLinks}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-650 text-xs font-semibold transition-colors"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh Data</span>
                </button>
            </div>

            {/* Form Box */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    {editingId ? <Edit2 className="w-3.5 h-3.5 text-slate-500" /> : <Plus className="w-3.5 h-3.5 text-slate-505" />}
                    {editingId ? 'Edit Smart Link' : 'Create New Smart Link'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target URL</label>
                            <input
                                type="url"
                                required
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-slate-800"
                                value={targetUrl}
                                onChange={(e) => setTargetUrl(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Custom Slug</label>
                            <div className="flex rounded overflow-hidden border border-slate-200 bg-slate-50">
                                <span className="inline-flex items-center px-3 border-r border-slate-200 bg-slate-100 text-slate-500 text-xs font-mono select-none">
                                    {domain}/link/
                                </span>
                                <input
                                    type="text"
                                    required
                                    placeholder="yt-promo"
                                    className="px-3 py-2 bg-white text-xs outline-none focus:ring-1 focus:ring-slate-900 transition-all flex-1 text-slate-800"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Display Title (for Bio Page)</label>
                            <input
                                type="text"
                                placeholder="e.g. Watch my new video"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-slate-800"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Optional. Only used if displayed on the Link-in-Bio page.</p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Show in Bio Page?</label>
                            <div className="flex items-center h-8">
                                <label className="flex items-center cursor-pointer relative">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only"
                                        checked={showInBio}
                                        onChange={(e) => setShowInBio(e.target.checked)}
                                    />
                                    <div className={`w-9 h-5 rounded-full transition duration-200 ease-in-out ${showInBio ? 'bg-slate-900' : 'bg-slate-300'}`}></div>
                                    <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${showInBio ? 'transform translate-x-4' : ''}`}></div>
                                </label>
                                <span className="ml-2.5 text-xs text-slate-600 truncate font-semibold">
                                    {showInBio ? 'Visible on /links page' : 'Hidden from /links page'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Link Type</label>
                        <select
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className="w-full md:w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-slate-800"
                        >
                            <option value="other">Standard Redirect</option>
                            <option value="youtube">YouTube (Deep Link)</option>
                            <option value="instagram">Instagram (Deep Link)</option>
                            <option value="twitter">X / Twitter (Deep Link)</option>
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1 italic">{platform === 'other' ? 'Redirects straight to the target URL on all devices.' : 'On mobile, attempts to open the native app before falling back to the web URL.'}</p>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                        <button
                            type="submit"
                            disabled={isCreating || isUpdating}
                            className="bg-slate-900 text-white hover:bg-slate-805 px-4.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                            {editingId ? (isUpdating ? 'Updating...' : 'Update Smart Link') : (isCreating ? 'Creating...' : 'Create Smart Link')}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={isUpdating}
                                className="px-3.5 py-2 text-xs font-semibold text-slate-550 hover:bg-slate-50 border border-slate-200 rounded transition-all bg-white"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                        Manage Existing Links
                    </h2>
                </div>
                
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-16 text-center text-slate-400">
                            <div className="h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-xs">Loading links...</p>
                        </div>
                    ) : links.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 bg-slate-50/50">
                            <LinkIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-slate-850">No smart links created yet. Create your first one above!</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-3.5">Link & URL</th>
                                    <th className="px-5 py-3.5 hidden sm:table-cell">Platform</th>
                                    <th className="px-5 py-3.5 hidden md:table-cell">Bio Status</th>
                                    <th className="px-5 py-3.5">Clicks</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {links.map((link) => (
                                    <tr key={link.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-5 py-3">
                                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                /link/{link.slug}
                                                <a href={`/link/${link.slug}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px] sm:max-w-xs xl:max-w-md" title={link.target_url}>
                                                {link.target_url}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 hidden sm:table-cell">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase bg-slate-100 text-slate-600 border-slate-200 capitalize">
                                                {link.platform}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 hidden md:table-cell">
                                            {link.show_in_bio ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase bg-emerald-50 text-emerald-700 border-emerald-100">
                                                    Visible
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase bg-slate-100 text-slate-500 border-slate-200">
                                                    Hidden
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 font-mono font-bold text-slate-800">
                                            {link.clicks.toLocaleString()}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleCopy(link.slug)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded border border-slate-200 bg-white transition-colors"
                                                    title="Copy Link URL"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleResetClicks(link.id)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded border border-slate-200 bg-white transition-colors"
                                                    title="Reset Clicks"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(link)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded border border-slate-200 bg-white transition-colors"
                                                    title="Edit Link"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(link.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded border border-slate-200 bg-white transition-colors"
                                                    title="Delete Link"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
