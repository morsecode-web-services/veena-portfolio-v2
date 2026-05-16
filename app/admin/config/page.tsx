'use client';

import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
    Save,
    RotateCcw,
    Layout,
    User,
    Image as ImageIcon,
    ChevronRight,
    ChevronDown,
    Eye,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Grid3X3,
    Zap,
    Plus,
    Trash2,
    MoveUp,
    MoveDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SiteConfig, GalleryImage } from '@/types';
import { Button } from '@/components/system/Button';
import { CloudinaryUpload } from '@/components/admin/CloudinaryUpload';
import { useToast } from '@/context/ToastContext';

export default function ConfigPage() {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'artist' | 'home' | 'gallery' | 'layout' | 'cohorts'>('artist');
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [originalConfig, setOriginalConfig] = useState<SiteConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pendingDeletions, setPendingDeletions] = useState<Set<string>>(new Set());

    const trackDeletion = (url?: string) => {
        if (url && url.includes('cloudinary.com')) {
            setPendingDeletions(prev => new Set(prev).add(url));
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
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
    };

    const handleSave = async () => {
        if (!config) return;
        try {
            setSaving(true);

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
                
                // If there are pending deletions, call the cleanup API
                if (pendingDeletions.size > 0) {
                    try {
                        const deleteRes = await fetch('/api/admin/cloudinary/delete', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({ urls: Array.from(pendingDeletions) })
                        });
                        if (!deleteRes.ok) {
                            console.error('Failed to perform Cloudinary cleanup:', await deleteRes.json());
                        }
                    } catch (err) {
                        console.error('Cloudinary cleanup error:', err);
                    }
                }

                setConfig(result.data);
                setOriginalConfig(JSON.parse(JSON.stringify(result.data)));
                setPendingDeletions(new Set()); // Clear pending deletions on success
                addToast('Configuration saved successfully!', 'success');
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save configuration');
            }
        } catch (error: any) {
            console.error('Save error:', error);
            addToast(error.message || 'Failed to save configuration', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (originalConfig) {
            setConfig(JSON.parse(JSON.stringify(originalConfig)));
            setPendingDeletions(new Set());
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-navy-900 mb-4" />
                <p className="text-navy-600 font-medium italic">Loading Architect&apos;s Desk...</p>
            </div>
        );
    }

    if (!config) return <div>Error loading configuration.</div>;

    return (
        <div className="max-w-6xl mx-auto py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-navy-900">Site Architect</h1>
                    <p className="text-navy-600 mt-1">Configure your digital stage and stagecraft.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        disabled={saving || JSON.stringify(config) === JSON.stringify(originalConfig)}
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Changes
                    </Button>
                    <Button
                        onClick={handleSave}
                        isLoading={saving}
                        disabled={saving || JSON.stringify(config) === JSON.stringify(originalConfig)}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Status Message - Removed in favor of Toasts */}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <aside className="lg:col-span-1">
                    <nav className="flex flex-col gap-1">
                        <TabButton
                            active={activeTab === 'artist'}
                            onClick={() => setActiveTab('artist')}
                            icon={User}
                            label="Artist Profile"
                            description="Name, Title, Bios"
                        />
                        <TabButton
                            active={activeTab === 'home'}
                            onClick={() => setActiveTab('home')}
                            icon={ImageIcon}
                            label="Hero Section"
                            description="Visual entrance"
                        />
                        <TabButton
                            active={activeTab === 'gallery'}
                            onClick={() => setActiveTab('gallery')}
                            icon={Grid3X3}
                            label="Performance Gallery"
                            description="Image collection"
                        />
                        <TabButton
                            active={activeTab === 'cohorts'}
                            onClick={() => setActiveTab('cohorts')}
                            icon={Zap}
                            label="Cohorts Page"
                            description="FAQs & Settings"
                        />
                        <TabButton
                            active={activeTab === 'layout'}
                            onClick={() => setActiveTab('layout')}
                            icon={Layout}
                            label="Site Layout"
                            description="Sections & Visibility"
                        />
                    </nav>
                </aside>

                {/* Main Editor Area */}
                <main className="lg:col-span-3 bg-white rounded-xl shadow-premium border border-slate-100 overflow-hidden">
                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            {activeTab === 'artist' && (
                                <m.div
                                    key="artist"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <SectionTitle title="Artist Profile" description="Basic information about the artist." />
                                    <div className="grid grid-cols-2 gap-6">
                                        <InputField
                                            label="Artist Name"
                                            value={config.artist.name}
                                            onChange={(v) => setConfig({ ...config, artist: { ...config.artist, name: v } })}
                                        />
                                        <InputField
                                            label="Tagline"
                                            value={config.artist.tagline}
                                            onChange={(v) => setConfig({ ...config, artist: { ...config.artist, tagline: v } })}
                                        />
                                    </div>
                                    <TextAreaField
                                        label="Brief Bio"
                                        value={config.artist.briefBio}
                                        onChange={(v) => setConfig({ ...config, artist: { ...config.artist, briefBio: v } })}
                                    />

                                    <div className="space-y-4">
                                        <label className="text-xs font-bold uppercase tracking-wider text-navy-400 ml-1">Full Biography Blocks</label>
                                        <div className="space-y-3">
                                            {config.artist.fullBio.map((block, idx) => (
                                                <BioBlockEditor
                                                    key={idx}
                                                    block={block}
                                                    onUpdate={(updated: any) => {
                                                        const newBio = [...config.artist.fullBio];
                                                        newBio[idx] = updated;
                                                        setConfig({ ...config, artist: { ...config.artist, fullBio: newBio as any } });
                                                    }}
                                                    onRemove={() => {
                                                        const block = config.artist.fullBio[idx];
                                                        if (typeof block === 'object' && 'imageUrl' in block) {
                                                            trackDeletion((block as any).imageUrl);
                                                        }
                                                        const newBio = config.artist.fullBio.filter((_, i) => i !== idx);
                                                        setConfig({ ...config, artist: { ...config.artist, fullBio: newBio } });
                                                    }}
                                                    onMove={(dir: 'up' | 'down') => {
                                                        const newBio = [...config.artist.fullBio];
                                                        const target = dir === 'up' ? idx - 1 : idx + 1;
                                                        if (target >= 0 && target < newBio.length) {
                                                            [newBio[idx], newBio[target]] = [newBio[target], newBio[idx]];
                                                            setConfig({ ...config, artist: { ...config.artist, fullBio: newBio as any } });
                                                        }
                                                    }}
                                                    isFirst={idx === 0}
                                                    isLast={idx === config.artist.fullBio.length - 1}
                                                />
                                            ))}
                                            <Button
                                                variant="tertiary"
                                                fullWidth
                                                onClick={() => {
                                                    const newBio = [...config.artist.fullBio, { type: 'paragraph', content: '' }] as any;
                                                    setConfig({ ...config, artist: { ...config.artist, fullBio: newBio } });
                                                }}
                                            >
                                                + Add Bio Block
                                            </Button>
                                        </div>
                                    </div>
                                </m.div>
                            )}

                            {activeTab === 'home' && (
                                <m.div
                                    key="home"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <SectionTitle title="Hero Section" description="The grand entrance of your portfolio." />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-navy-400 ml-1">Hero Background</label>
                                            <CloudinaryUpload
                                                value={config.home.heroBackground}
                                                onChange={(url) => {
                                                    if (config.home.heroBackground && config.home.heroBackground !== url) {
                                                        trackDeletion(config.home.heroBackground);
                                                    }
                                                    setConfig({ ...config, home: { ...config.home, heroBackground: url } });
                                                }}
                                                label="Upload Hero Background"
                                            />
                                        </div>
                                        <InputField
                                            label="Hero Tagline (Top)"
                                            value={config.home.heroTagline || ''}
                                            onChange={(v) => setConfig({ ...config, home: { ...config.home, heroTagline: v } })}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-bold uppercase tracking-wider text-navy-400 ml-1">Landing Page Stats</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {config.home.heroStats?.map((stat, idx) => (
                                                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                                                    <button
                                                        onClick={() => {
                                                            const newStats = config.home.heroStats?.filter((_, i) => i !== idx);
                                                            setConfig({ ...config, home: { ...config.home, heroStats: newStats } });
                                                        }}
                                                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <RotateCcw className="h-3 w-3 rotate-45" />
                                                    </button>
                                                    <InputField
                                                        label="Label"
                                                        value={stat.label}
                                                        onChange={(v) => {
                                                            const newStats = [...(config.home.heroStats || [])];
                                                            newStats[idx] = { ...stat, label: v };
                                                            setConfig({ ...config, home: { ...config.home, heroStats: newStats } });
                                                        }}
                                                    />
                                                    <div className="mt-4">
                                                        <TextAreaField
                                                            label="Value"
                                                            value={stat.value}
                                                            onChange={(v) => {
                                                                const newStats = [...(config.home.heroStats || [])];
                                                                newStats[idx] = { ...stat, value: v };
                                                                setConfig({ ...config, home: { ...config.home, heroStats: newStats } });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold uppercase tracking-wider text-navy-400 ml-1">Hero Highlights (Carousel)</label>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enable Carousel</span>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={config.home.featuredCarousel?.enabled ?? true}
                                                        onChange={(e) => setConfig({ 
                                                            ...config, 
                                                            home: { 
                                                                ...config.home, 
                                                                featuredCarousel: { 
                                                                    ...(config.home.featuredCarousel || { enabled: true, items: [] }), 
                                                                    enabled: e.target.checked 
                                                                } 
                                                            } 
                                                        })}
                                                        className="w-4 h-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Show Upcoming Event</span>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={config.home.featuredCarousel?.showUpcomingEvent ?? true}
                                                        onChange={(e) => setConfig({ 
                                                            ...config, 
                                                            home: { 
                                                                ...config.home, 
                                                                featuredCarousel: { 
                                                                    ...(config.home.featuredCarousel || { enabled: true, items: [] }), 
                                                                    showUpcomingEvent: e.target.checked 
                                                                } 
                                                            } 
                                                        })}
                                                        className="w-4 h-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                                                    />
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary"
                                                    onClick={() => {
                                                        const newItem = {
                                                            id: `highlight-${Date.now()}`,
                                                            title: 'New Achievement',
                                                            description: 'Details about this highlight...',
                                                            subtitle: 'Featured',
                                                            image: ''
                                                        };
                                                        const currentCarousel = config.home.featuredCarousel || { enabled: true, items: [] };
                                                        setConfig({ 
                                                            ...config, 
                                                            home: { 
                                                                ...config.home, 
                                                                featuredCarousel: { 
                                                                    ...currentCarousel, 
                                                                    items: [...currentCarousel.items, newItem] 
                                                                } 
                                                            } 
                                                        });
                                                    }}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" /> Add Highlight
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {config.home.featuredCarousel?.items.map((item, idx) => (
                                                <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm group relative">
                                                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            disabled={idx === 0}
                                                            onClick={() => {
                                                                const items = [...(config.home.featuredCarousel?.items || [])];
                                                                [items[idx], items[idx - 1]] = [items[idx - 1], items[idx]];
                                                                setConfig({ ...config, home: { ...config.home, featuredCarousel: { ...(config.home.featuredCarousel!), items } } });
                                                            }}
                                                            className="p-1 hover:text-gold-600 disabled:opacity-30"
                                                        >
                                                            <MoveUp className="h-3 w-3" />
                                                        </button>
                                                        <button 
                                                            disabled={idx === (config.home.featuredCarousel?.items.length || 0) - 1}
                                                            onClick={() => {
                                                                const items = [...(config.home.featuredCarousel?.items || [])];
                                                                [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
                                                                setConfig({ ...config, home: { ...config.home, featuredCarousel: { ...(config.home.featuredCarousel!), items } } });
                                                            }}
                                                            className="p-1 hover:text-gold-600 disabled:opacity-30"
                                                        >
                                                            <MoveDown className="h-3 w-3" />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                if (item.image) trackDeletion(item.image);
                                                                const items = config.home.featuredCarousel?.items.filter((_, i) => i !== idx);
                                                                setConfig({ ...config, home: { ...config.home, featuredCarousel: { ...(config.home.featuredCarousel!), items: items || [] } } });
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-red-500 ml-1"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                        <div className="md:col-span-1">
                                                            <CloudinaryUpload
                                                                value={item.image}
                                                                onChange={(url) => {
                                                                    const items = [...(config.home.featuredCarousel?.items || [])];
                                                                    if (item.image && item.image !== url) trackDeletion(item.image);
                                                                    items[idx] = { ...item, image: url };
                                                                    setConfig({ ...config, home: { ...config.home, featuredCarousel: { ...(config.home.featuredCarousel!), items } } });
                                                                }}
                                                                label="Highlight Image"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-3 space-y-3">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <InputField
                                                                    label="Title"
                                                                    value={item.title}
                                                                    onChange={(v) => {
                                                                        const items = [...(config.home.featuredCarousel?.items || [])];
                                                                        items[idx] = { ...item, title: v };
                                                                        setConfig({ ...config, home: { ...config.home, featuredCarousel: { ...(config.home.featuredCarousel!), items } } });
                                                                    }}
                                                                />
                                                                <InputField
                                                                    label="Subtitle (Gold Label)"
                                                                    value={item.subtitle || ''}
                                                                    onChange={(v) => {
                                                                        const items = [...(config.home.featuredCarousel?.items || [])];
                                                                        items[idx] = { ...item, subtitle: v };
                                                                        setConfig({ ...config, home: { ...config.home, featuredCarousel: { ...(config.home.featuredCarousel!), items } } });
                                                                    }}
                                                                />
                                                            </div>
                                                            <TextAreaField
                                                                label="Description"
                                                                value={item.description}
                                                                onChange={(v) => {
                                                                    const items = [...(config.home.featuredCarousel?.items || [])];
                                                                    items[idx] = { ...item, description: v };
                                                                    setConfig({ ...config, home: { ...config.home, featuredCarousel: { ...(config.home.featuredCarousel!), items } } });
                                                                }}
                                                            />
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <InputField
                                                                    label="Button Link"
                                                                    value={item.link || ''}
                                                                    onChange={(v) => {
                                                                        const items = [...(config.home.featuredCarousel?.items || [])];
                                                                        items[idx] = { ...item, link: v };
                                                                        setConfig({ ...config, home: { ...config.home, featuredCarousel: { ...(config.home.featuredCarousel!), items } } });
                                                                    }}
                                                                />
                                                                <InputField
                                                                    label="Button Text"
                                                                    value={item.linkText || ''}
                                                                    onChange={(v) => {
                                                                        const items = [...(config.home.featuredCarousel?.items || [])];
                                                                        items[idx] = { ...item, linkText: v };
                                                                        setConfig({ ...config, home: { ...config.home, featuredCarousel: { ...(config.home.featuredCarousel!), items } } });
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </m.div>
                            )}

                             {activeTab === 'gallery' && (
                                <m.div
                                    key="gallery"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                        <SectionTitle title="Performance Gallery" description="Manage the images shown in your portfolio gallery." />
                                        <Button 
                                            size="sm" 
                                            variant="secondary"
                                            onClick={() => {
                                                const newImage: GalleryImage = {
                                                    id: `gallery-${Date.now()}`,
                                                    src: '',
                                                    alt: 'New Performance Image',
                                                    width: 1200,
                                                    height: 1600
                                                };
                                                setConfig({ ...config, gallery: { images: [newImage, ...(config.gallery?.images || [])] } });
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Add Image
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {config.gallery?.images.map((img, idx) => (
                                            <div key={img.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 group">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy-400">Image #{config.gallery.images.length - idx}</span>
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            disabled={idx === 0}
                                                            onClick={() => {
                                                                const newImages = [...config.gallery.images];
                                                                [newImages[idx], newImages[idx - 1]] = [newImages[idx - 1], newImages[idx]];
                                                                setConfig({ ...config, gallery: { images: newImages } });
                                                            }}
                                                            className="p-1 hover:text-gold-600 disabled:opacity-30"
                                                        >
                                                            <MoveUp className="h-3 w-3" />
                                                        </button>
                                                        <button 
                                                            disabled={idx === config.gallery.images.length - 1}
                                                            onClick={() => {
                                                                const newImages = [...config.gallery.images];
                                                                [newImages[idx], newImages[idx + 1]] = [newImages[idx + 1], newImages[idx]];
                                                                setConfig({ ...config, gallery: { images: newImages } });
                                                            }}
                                                            className="p-1 hover:text-gold-600 disabled:opacity-30"
                                                        >
                                                            <MoveDown className="h-3 w-3" />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                if (img.src) trackDeletion(img.src);
                                                                const newImages = config.gallery.images.filter((_, i) => i !== idx);
                                                                setConfig({ ...config, gallery: { images: newImages } });
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-red-500 ml-2"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <CloudinaryUpload 
                                                    value={img.src}
                                                    onChange={(url) => {
                                                        const newImages = [...config.gallery.images];
                                                        if (img.src && img.src !== url) trackDeletion(img.src);
                                                        newImages[idx] = { ...img, src: url };
                                                        setConfig({ ...config, gallery: { images: newImages } });
                                                    }}
                                                    label="Upload Gallery Image"
                                                />
                                                <InputField 
                                                    label="Alt Text / Caption"
                                                    value={img.alt}
                                                    onChange={(v) => {
                                                        const newImages = [...(config.gallery?.images || [])];
                                                        newImages[idx] = { ...img, alt: v };
                                                        setConfig({ ...config, gallery: { images: newImages } });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </m.div>
                            )}


                            {activeTab === 'cohorts' && (
                                <m.div
                                    key="cohorts"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <SectionTitle title="Cohorts Page Settings" description="Manage the learning cohorts page experience." />
                                    
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">Visibility Controls</h3>
                                                <p className="text-xs text-navy-500 mt-0.5">Control where cohorts are visible on the site.</p>
                                            </div>
                                            <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-xs font-bold text-navy-700">Show Cohorts on Coming Soon Page</span>
                                                <button
                                                    onClick={() => setConfig({ ...config, showCohortsOnComingSoon: !config.showCohortsOnComingSoon })}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.showCohortsOnComingSoon ? 'bg-gold-500' : 'bg-slate-300'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.showCohortsOnComingSoon ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider ml-1">Frequently Asked Questions</h3>
                                            <Button 
                                                size="sm" 
                                                variant="secondary"
                                                onClick={() => {
                                                    const items = [...(config.cohorts_faq?.items || [])];
                                                    items.push({ question: '', answer: '' });
                                                    setConfig({ ...config, cohorts_faq: { items } });
                                                }}
                                            >
                                                <Plus className="h-3 w-3 mr-1" /> Add Question
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {config.cohorts_faq?.items.map((faq, idx) => (
                                                <div key={idx} className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm group relative">
                                                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            disabled={idx === 0}
                                                            onClick={() => {
                                                                const items = [...(config.cohorts_faq?.items || [])];
                                                                [items[idx], items[idx - 1]] = [items[idx - 1], items[idx]];
                                                                setConfig({ ...config, cohorts_faq: { items } });
                                                            }}
                                                            className="p-1 hover:text-gold-600 disabled:opacity-30"
                                                        >
                                                            <MoveUp className="h-3 w-3" />
                                                        </button>
                                                        <button 
                                                            disabled={idx === (config.cohorts_faq?.items.length || 0) - 1}
                                                            onClick={() => {
                                                                const items = [...(config.cohorts_faq?.items || [])];
                                                                [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
                                                                setConfig({ ...config, cohorts_faq: { items } });
                                                            }}
                                                            className="p-1 hover:text-gold-600 disabled:opacity-30"
                                                        >
                                                            <MoveDown className="h-3 w-3" />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                const items = config.cohorts_faq?.items.filter((_, i) => i !== idx);
                                                                setConfig({ ...config, cohorts_faq: { items: items || [] } });
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-red-500 ml-1"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <InputField 
                                                            label={`Question #${idx + 1}`}
                                                            value={faq.question}
                                                            onChange={(v) => {
                                                                const items = [...(config.cohorts_faq?.items || [])];
                                                                items[idx] = { ...faq, question: v };
                                                                setConfig({ ...config, cohorts_faq: { items } });
                                                            }}
                                                        />
                                                        <TextAreaField 
                                                            label="Answer"
                                                            value={faq.answer}
                                                            onChange={(v) => {
                                                                const items = [...(config.cohorts_faq?.items || [])];
                                                                items[idx] = { ...faq, answer: v };
                                                                setConfig({ ...config, cohorts_faq: { items } });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {(!config.cohorts_faq?.items || config.cohorts_faq.items.length === 0) && (
                                                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                                    <p className="text-slate-400 text-sm">No FAQs configured yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </m.div>
                            )}

                            {activeTab === 'layout' && (
                                <m.div
                                    key="layout"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <SectionTitle title="Page Architect" description="Reorder and toggle visibility of landing page sections." />
                                    
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-navy-900 rounded-lg">
                                                    <Zap className="h-4 w-4 text-gold-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">Maintenance Mode Overrides</h3>
                                                    <p className="text-xs text-navy-500 mt-0.5">Force visibility of specific features when the site is not live.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-xs font-bold text-navy-700">Show Cohorts on Coming Soon</span>
                                                <button
                                                    onClick={() => setConfig({ ...config, showCohortsOnComingSoon: !config.showCohortsOnComingSoon })}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.showCohortsOnComingSoon ? 'bg-gold-500' : 'bg-slate-300'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.showCohortsOnComingSoon ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {config.layoutOrder?.map((key, idx) => {
                                            const isVisible = config.sections?.[key] !== false;
                                            return (
                                                <m.div
                                                    layout
                                                    key={key}
                                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isVisible ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'
                                                        }`}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <button
                                                            disabled={idx === 0}
                                                            onClick={() => moveSection(idx, 'up')}
                                                            className="p-1 text-slate-400 hover:text-gold-600 disabled:opacity-0"
                                                        >
                                                            <ChevronDown className="h-4 w-4 rotate-180" />
                                                        </button>
                                                        <button
                                                            disabled={idx === (config.layoutOrder?.length || 0) - 1}
                                                            onClick={() => moveSection(idx, 'down')}
                                                            className="p-1 text-slate-400 hover:text-gold-600 disabled:opacity-0"
                                                        >
                                                            <ChevronDown className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    <div className="flex-1">
                                                        <span className="font-bold text-navy-900">{key}</span>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            const newSections = { ...config.sections, [key]: !isVisible };
                                                            setConfig({ ...config, sections: newSections });
                                                        }}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isVisible ? 'bg-gold-500' : 'bg-slate-300'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isVisible ? 'translate-x-6' : 'translate-x-1'
                                                                }`}
                                                        />
                                                    </button>
                                                </m.div>
                                            );
                                        })}
                                    </div>
                                </m.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );

    function moveSection(idx: number, dir: 'up' | 'down') {
        if (!config || !config.layoutOrder) return;
        const newOrder = [...config.layoutOrder];
        const target = dir === 'up' ? idx - 1 : idx + 1;
        if (target >= 0 && target < newOrder.length) {
            [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
            setConfig({ ...config, layoutOrder: newOrder });
        }
    }
}

function BioBlockEditor({ block, onUpdate, onRemove, onMove, isFirst, isLast }: any) {
    const isString = typeof block === 'string';
    const type = isString ? 'paragraph' : block.type;
    const content = isString ? block : block.content;

    return (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl group relative">
            <div className="flex items-center gap-2 mb-3">
                <select
                    value={type}
                    onChange={(e) => {
                        const newType = e.target.value;
                        if (newType === 'list') {
                            onUpdate({ type: 'list', items: [] });
                        } else {
                            onUpdate({ type: newType, content: content || '' });
                        }
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest bg-white border border-slate-200 rounded px-2 py-1 text-navy-600 outline-none focus:border-gold-400"
                >
                    <option value="paragraph">Paragraph</option>
                    <option value="heading">Heading</option>
                    <option value="list">List Item</option>
                </select>

                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onMove('up')} disabled={isFirst} className="p-1 hover:text-gold-600 disabled:opacity-30"><ChevronDown className="h-3 w-3 rotate-180" /></button>
                    <button onClick={() => onMove('down')} disabled={isLast} className="p-1 hover:text-gold-600 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                    <button onClick={onRemove} className="p-1 hover:text-red-500 ml-2"><AlertCircle className="h-3 w-3" /></button>
                </div>
            </div>

            {type === 'list' ? (
                <div className="space-y-2">
                    {(block.items || []).map((item: string, i: number) => (
                        <div key={i} className="flex gap-2">
                            <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                    const newItems = [...(block.items || [])];
                                    newItems[i] = e.target.value;
                                    onUpdate({ ...block, items: newItems });
                                }}
                                className="flex-1 bg-white border border-slate-200 rounded px-3 py-2 text-sm text-navy-900 focus:border-gold-400 outline-none"
                            />
                            <button
                                onClick={() => {
                                    const newItems = block.items.filter((_: any, idx: number) => idx !== i);
                                    onUpdate({ ...block, items: newItems });
                                }}
                                className="p-2 text-slate-300 hover:text-red-500"
                            >
                                <AlertCircle className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => onUpdate({ ...block, items: [...(block.items || []), ''] })}
                        className="text-[10px] font-bold text-gold-600 uppercase hover:text-gold-700 transition-colors"
                    >
                        + Add Item
                    </button>
                </div>
            ) : (
                <textarea
                    value={content}
                    onChange={(e) => onUpdate(isString ? e.target.value : { ...block, content: e.target.value })}
                    rows={content?.length > 100 ? 4 : 2}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-navy-900 resize-none focus:border-gold-400 outline-none"
                />
            )}
        </div>
    );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
    return (
        <div className="pb-4 border-b border-slate-100">
            <h2 className="text-xl font-serif font-bold text-navy-900">{title}</h2>
            <p className="text-sm text-navy-500">{description}</p>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label, description }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-300 ${active
                ? 'bg-navy-900 text-white shadow-lg ring-1 ring-white/10'
                : 'bg-white text-navy-600 hover:bg-slate-50 border border-transparent'
                }`}
        >
            <div className={`p-2 rounded-lg ${active ? 'bg-navy-800' : 'bg-slate-100'}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="font-bold text-sm">{label}</p>
                <p className={`text-[11px] ${active ? 'text-navy-300' : 'text-navy-400'}`}>{description}</p>
            </div>
            {active && <m.div layoutId="activeTabMarker" className="ml-auto"><ChevronRight className="h-4 w-4" /></m.div>}
        </button>
    );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-navy-400 ml-1">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all font-sans"
            />
        </div>
    );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-navy-400 ml-1">{label}</label>
            <textarea
                value={value}
                rows={4}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all font-sans resize-none"
            />
        </div>
    );
}
