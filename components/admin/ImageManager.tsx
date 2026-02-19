'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Trash2, Plus, Edit2, Check, X, ChevronUp, ChevronDown,
    Eye, Upload, Loader2, ImageIcon, Save, RotateCcw,
    Home, Sparkles, Grid3X3, Mail, Newspaper
} from 'lucide-react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import type { SiteConfig, GalleryImage } from '@/types';

type SectionTab = 'hero' | 'spotlights' | 'gallery' | 'other';

export function ImageManager() {
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [originalConfig, setOriginalConfig] = useState<SiteConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<SectionTab>('gallery');
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
    const [editAlt, setEditAlt] = useState('');
    const [editCaption, setEditCaption] = useState('');
    const [uploadingFor, setUploadingFor] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryFileInputRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<{ section: string; field: string; index?: number } | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    async function fetchConfig() {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/config');
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                setOriginalConfig(JSON.parse(JSON.stringify(data)));
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!config) return;
        try {
            setSaving(true);
            setStatus(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                const result = await res.json();
                setConfig(result.data);
                setOriginalConfig(JSON.parse(JSON.stringify(result.data)));
                setStatus({ type: 'success', message: 'Images saved successfully!' });
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save');
            }
        } catch (error: any) {
            console.error('Save error:', error);
            setStatus({ type: 'error', message: error.message });
        } finally {
            setSaving(false);
        }
    }

    function handleReset() {
        if (originalConfig) {
            setConfig(JSON.parse(JSON.stringify(originalConfig)));
            setStatus(null);
        }
    }

    const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

    // ── Upload helper (to local filesystem via API) ──
    async function handleFileUpload(
        e: React.ChangeEvent<HTMLInputElement>,
        callback: (path: string, w: number, h: number) => void
    ) {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        setUploadingFor('active');

        try {
            // Compress
            let uploadFile: File = file;
            try {
                uploadFile = await imageCompression(file, {
                    maxSizeMB: 1.5,
                    maxWidthOrHeight: 2400,
                    useWebWorker: true,
                });
            } catch { /* use original */ }

            // Get dimensions
            const dims = await getImageDimensions(uploadFile);

            // Get auth token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            // Upload via local API
            const formData = new FormData();
            formData.append('file', uploadFile, file.name);
            formData.append('subfolder', 'gallery');

            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Upload failed');
            }

            const result = await res.json();
            callback(result.path, dims.width, dims.height);
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setUploadingFor(null);
            if (e.target) e.target.value = '';
        }
    }

    function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
        return new Promise((resolve) => {
            const img = document.createElement('img');
            img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(img.src); };
            img.onerror = () => { resolve({ width: 1920, height: 1080 }); URL.revokeObjectURL(img.src); };
            img.src = URL.createObjectURL(file);
        });
    }

    // ── Gallery helpers ──
    function addGalleryImage(src: string, width: number, height: number) {
        if (!config) return;
        const images = config.gallery?.images || [];
        const newId = String(Date.now());
        const newImage: GalleryImage = {
            id: newId,
            src,
            alt: '',
            width,
            height,
            caption: '',
        };
        setConfig({
            ...config,
            gallery: { ...config.gallery, images: [...images, newImage] }
        });
    }

    function removeGalleryImage(id: string) {
        if (!config) return;
        setConfig({
            ...config,
            gallery: {
                ...config.gallery,
                images: (config.gallery?.images || []).filter(img => img.id !== id)
            }
        });
    }

    function moveGalleryImage(id: string, direction: 'up' | 'down') {
        if (!config) return;
        const images = [...(config.gallery?.images || [])];
        const idx = images.findIndex(img => img.id === id);
        if (idx === -1) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= images.length) return;
        [images[idx], images[swapIdx]] = [images[swapIdx], images[idx]];
        setConfig({ ...config, gallery: { ...config.gallery, images } });
    }

    function saveGalleryEdit(id: string) {
        if (!config) return;
        setConfig({
            ...config,
            gallery: {
                ...config.gallery,
                images: (config.gallery?.images || []).map(img =>
                    img.id === id ? { ...img, alt: editAlt, caption: editCaption } : img
                )
            }
        });
        setEditingGalleryId(null);
    }

    function startEditingGallery(img: GalleryImage) {
        setEditingGalleryId(img.id);
        setEditAlt(img.alt);
        setEditCaption(img.caption || '');
    }

    // ── Loading / error states ──
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-navy-900 mb-4" />
                <p className="text-navy-600 font-medium italic">Loading images...</p>
            </div>
        );
    }

    if (!config) return <div>Error loading configuration.</div>;

    const galleryImages = config.gallery?.images || [];

    return (
        <div className="space-y-6">
            {/* Save Bar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                    {/* Tab Buttons */}
                    <TabPill active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} icon={Grid3X3} label="Gallery" count={galleryImages.length} />
                    <TabPill active={activeTab === 'hero'} onClick={() => setActiveTab('hero')} icon={Home} label="Hero & Brand" />
                    <TabPill active={activeTab === 'spotlights'} onClick={() => setActiveTab('spotlights')} icon={Sparkles} label="Carousel" />
                    <TabPill active={activeTab === 'other'} onClick={() => setActiveTab('other')} icon={Mail} label="Other" />
                </div>

                <div className="flex items-center gap-2">
                    {status && (
                        <span className={`text-xs font-bold ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {status.message}
                        </span>
                    )}
                    <button
                        onClick={handleReset}
                        disabled={!hasChanges || saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors text-xs font-bold disabled:opacity-30"
                    >
                        <RotateCcw className="h-3 w-3" /> Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors text-xs font-bold disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* ═══════════════ GALLERY TAB ═══════════════ */}
            {activeTab === 'gallery' && (
                <div className="space-y-4">
                    {/* Upload Button */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => galleryFileInputRef.current?.click()}
                            disabled={!!uploadingFor}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors font-bold text-sm disabled:opacity-50"
                        >
                            {uploadingFor ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                            ) : (
                                <><Plus className="h-4 w-4" /> Add Image</>
                            )}
                        </button>
                        <input
                            type="file"
                            ref={galleryFileInputRef}
                            onChange={(e) => handleFileUpload(e, (url, w, h) => addGalleryImage(url, w, h))}
                            accept="image/*"
                            className="hidden"
                        />
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                            {galleryImages.length} images • Reorder with arrows • Click edit for metadata
                        </p>
                    </div>

                    {/* Gallery Grid */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        {galleryImages.length === 0 ? (
                            <div className="p-12 text-center">
                                <ImageIcon className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium mb-2">No gallery images yet</p>
                                <p className="text-xs text-gray-400">Upload images to populate the performance gallery</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {galleryImages.map((image, index) => (
                                    <div key={image.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors group">
                                        {/* Order Controls */}
                                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                                            <button onClick={() => moveGalleryImage(image.id, 'up')} disabled={index === 0}
                                                className="p-1 text-gray-300 hover:text-navy-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors" title="Move up">
                                                <ChevronUp className="h-4 w-4" />
                                            </button>
                                            <div className="text-[10px] font-bold text-gray-300 text-center tabular-nums">{index + 1}</div>
                                            <button onClick={() => moveGalleryImage(image.id, 'down')} disabled={index === galleryImages.length - 1}
                                                className="p-1 text-gray-300 hover:text-navy-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors" title="Move down">
                                                <ChevronDown className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Thumbnail */}
                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-50">
                                            <Image src={image.src} alt={image.alt} fill className="object-cover" sizes="80px" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {editingGalleryId === image.id ? (
                                                <div className="space-y-2">
                                                    <input type="text" value={editAlt} onChange={(e) => setEditAlt(e.target.value)}
                                                        placeholder="Alt text (accessibility)" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500" />
                                                    <input type="text" value={editCaption} onChange={(e) => setEditCaption(e.target.value)}
                                                        placeholder="Caption (optional)" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500" />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => saveGalleryEdit(image.id)}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors">
                                                            <Check className="h-3 w-3" /> Save
                                                        </button>
                                                        <button onClick={() => setEditingGalleryId(null)}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                                                            <X className="h-3 w-3" /> Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-sm font-bold text-navy-900 truncate">{image.alt || 'No alt text'}</p>
                                                    {image.caption && <p className="text-xs text-gray-500 truncate mt-0.5">{image.caption}</p>}
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{image.width}×{image.height}</span>
                                                        <span className="text-[10px] text-gray-300 truncate max-w-[200px]">{image.src}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {editingGalleryId !== image.id && (
                                            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEditingGallery(image)} className="p-2 text-gray-400 hover:text-navy-600 transition-colors rounded-lg hover:bg-gray-100" title="Edit metadata">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => removeGalleryImage(image.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50" title="Remove">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════ HERO & BRAND TAB ═══════════════ */}
            {activeTab === 'hero' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
                    <h3 className="text-lg font-serif font-bold text-navy-900">Hero & Branding</h3>

                    {/* Hero Background */}
                    <ImageField
                        label="Hero Background"
                        value={config.home?.heroBackground || ''}
                        onChange={(v) => setConfig({ ...config, home: { ...config.home, heroBackground: v } })}
                        preview
                    />

                    {/* Logo */}
                    <ImageField
                        label="Site Logo"
                        value={config.artist?.logo || ''}
                        onChange={(v) => setConfig({ ...config, artist: { ...config.artist, logo: v } })}
                        preview
                    />

                    {/* Hero Background Position */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-navy-400 ml-1">Hero Background Position</label>
                        <input
                            type="text"
                            value={config.home?.heroBackgroundPosition || ''}
                            onChange={(e) => setConfig({ ...config, home: { ...config.home, heroBackgroundPosition: e.target.value } })}
                            placeholder="e.g. center 35%"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all text-sm"
                        />
                    </div>
                </div>
            )}

            {/* ═══════════════ CAROUSEL TAB ═══════════════ */}
            {activeTab === 'spotlights' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h3 className="text-lg font-serif font-bold text-navy-900">Featured Carousel</h3>
                    {config.home?.featuredCarousel?.items?.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            {item.image && (
                                <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                    <Image src={item.image} alt={item.title} fill className="object-cover" sizes="96px" />
                                </div>
                            )}
                            <div className="flex-1 space-y-2">
                                <p className="text-sm font-bold text-navy-900">{item.title}</p>
                                <ImageField
                                    label="Image Path"
                                    value={item.image || ''}
                                    onChange={(v) => {
                                        const items = [...(config.home?.featuredCarousel?.items || [])];
                                        items[idx] = { ...items[idx], image: v };
                                        setConfig({ ...config, home: { ...config.home, featuredCarousel: { ...config.home?.featuredCarousel!, items } } });
                                    }}
                                />
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Image Position</label>
                                    <input
                                        type="text"
                                        value={item.imagePosition || ''}
                                        onChange={(e) => {
                                            const items = [...(config.home?.featuredCarousel?.items || [])];
                                            items[idx] = { ...items[idx], imagePosition: e.target.value };
                                            setConfig({ ...config, home: { ...config.home, featuredCarousel: { ...config.home?.featuredCarousel!, items } } });
                                        }}
                                        placeholder="e.g. center 5%"
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════════════ OTHER TAB ═══════════════ */}
            {activeTab === 'other' && (
                <div className="space-y-4">
                    {/* Contact Image */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h3 className="text-lg font-serif font-bold text-navy-900">Contact Section</h3>
                        <ImageField
                            label="Contact Image"
                            value={config.contact?.imageUrl || ''}
                            onChange={(v) => setConfig({ ...config, contact: { ...config.contact, imageUrl: v, imageAlt: config.contact?.imageAlt || '' } })}
                            preview
                        />
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-navy-400 ml-1">Image Alt Text</label>
                            <input
                                type="text"
                                value={config.contact?.imageAlt || ''}
                                onChange={(e) => setConfig({ ...config, contact: { ...config.contact, imageUrl: config.contact?.imageUrl || '', imageAlt: e.target.value } })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* Press Article Images — only if press section is enabled */}
                    {config.sections?.Press !== false && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <h3 className="text-lg font-serif font-bold text-navy-900">Press Articles</h3>
                            {config.press?.articles?.map((article, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    {article.imageUrl && (
                                        <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                            <Image src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="80px" />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-2">
                                        <p className="text-sm font-bold text-navy-900">{article.title}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{article.publication}</p>
                                        <ImageField
                                            label="Image URL"
                                            value={article.imageUrl || ''}
                                            onChange={(v) => {
                                                const articles = [...(config.press?.articles || [])];
                                                articles[idx] = { ...articles[idx], imageUrl: v };
                                                setConfig({ ...config, press: { ...config.press, articles } });
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Reusable Components ──

function TabPill({ active, onClick, icon: Icon, label, count }: {
    active: boolean; onClick: () => void; icon: any; label: string; count?: number;
}) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
        >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-navy-700 text-navy-200' : 'bg-gray-200 text-gray-500'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function ImageField({ label, value, onChange, preview }: {
    label: string; value: string; onChange: (v: string) => void; preview?: boolean;
}) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">{label}</label>
            <div className="flex items-center gap-3">
                {preview && value && (
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 bg-gray-50">
                        <Image src={value} alt={label} fill className="object-cover" sizes="64px" />
                    </div>
                )}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="/images/..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all"
                />
            </div>
        </div>
    );
}
