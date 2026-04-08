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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-navy-900">Smart Links</h1>
                    <p className="text-navy-600">Create short, trackable redirect links. Optionally enable deep linking to open native apps like YouTube and Instagram on mobile.</p>
                </div>
                <button
                    onClick={fetchLinks}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-navy-600 transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-sm font-medium">Refresh Data</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
                    {editingId ? <Edit2 className="w-5 h-5 text-navy-500" /> : <Plus className="w-5 h-5 text-gold-500" />}
                    {editingId ? 'Edit Smart Link' : 'Create New Smart Link'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Target URL</label>
                            <input
                                type="url"
                                required
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                value={targetUrl}
                                onChange={(e) => setTargetUrl(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Custom Slug</label>
                            <div className="flex group">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm whitespace-nowrap">
                                    {domain}/link/
                                </span>
                                <input
                                    type="text"
                                    required
                                    placeholder="yt-promo"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent flex-1"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Display Title (for Bio Page)</label>
                            <input
                                type="text"
                                placeholder="e.g. Watch my new video"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Optional. Only used if displayed on the Link-in-Bio page.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Show in Bio Page?</label>
                            <div className="flex items-center h-full pb-2">
                                <label className="flex items-center cursor-pointer relative">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only"
                                        checked={showInBio}
                                        onChange={(e) => setShowInBio(e.target.checked)}
                                    />
                                    <div className={`w-11 h-6 rounded-full transition duration-200 ease-in-out ${showInBio ? 'bg-gold-500' : 'bg-gray-300'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${showInBio ? 'transform translate-x-5' : ''}`}></div>
                                </label>
                                <span className="ml-3 text-sm text-gray-600 truncate">
                                    {showInBio ? 'Visible on /links page' : 'Hidden from /links page'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Link Type</label>
                        <select
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className="w-full md:w-1/2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        >
                            <option value="other">Standard Redirect</option>
                            <option value="youtube">YouTube (Deep Link)</option>
                            <option value="instagram">Instagram (Deep Link)</option>
                            <option value="twitter">X / Twitter (Deep Link)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">{platform === 'other' ? 'Redirects straight to the target URL on all devices.' : 'On mobile, attempts to open the native app before falling back to the web URL.'}</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={isCreating || isUpdating}
                            className="px-6 py-2 bg-navy-900 text-white font-medium rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-50"
                        >
                            {editingId ? (isUpdating ? 'Updating...' : 'Update Smart Link') : (isCreating ? 'Creating...' : 'Create Smart Link')}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={isUpdating}
                                className="px-6 py-2 bg-white text-navy-600 border border-gray-200 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-gold-500" />
                        Manage Existing Links
                    </h2>
                </div>
                
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading links...</div>
                    ) : links.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No smart links created yet. Create your first one above!</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-navy-600 text-sm border-b border-gray-100">
                                    <th className="p-4 font-medium">Link & URL</th>
                                    <th className="p-4 font-medium hidden sm:table-cell">Platform</th>
                                    <th className="p-4 font-medium hidden md:table-cell">Bio Status</th>
                                    <th className="p-4 font-medium">Clicks</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {links.map((link) => (
                                    <tr key={link.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-navy-900 flex items-center gap-2">
                                                /link/{link.slug}
                                                <a href={`/link/${link.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold-500">
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px] sm:max-w-xs xl:max-w-md" title={link.target_url}>
                                                {link.target_url}
                                            </div>
                                        </td>
                                        <td className="p-4 hidden sm:table-cell">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                                {link.platform}
                                            </span>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            {link.show_in_bio ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Visible
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">
                                                    Hidden
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono font-medium text-gold-600">
                                            {link.clicks.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleCopy(link.slug)}
                                                className="p-2 text-gray-400 hover:text-navy-600 transition-colors rounded-lg hover:bg-gray-100 mr-2"
                                                title="Copy Link URL"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleResetClicks(link.id)}
                                                className="p-2 text-gray-400 hover:text-orange-500 transition-colors rounded-lg hover:bg-orange-50 mr-2"
                                                title="Reset Clicks"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(link)}
                                                className="p-2 text-gray-400 hover:text-navy-600 transition-colors rounded-lg hover:bg-gray-100 mr-2"
                                                title="Edit Link"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(link.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                title="Delete Link"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
