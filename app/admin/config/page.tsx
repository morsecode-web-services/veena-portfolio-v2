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
    Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SiteConfig } from '@/types';
import { Button } from '@/components/system/Button';

export default function ConfigPage() {
    const [activeTab, setActiveTab] = useState<'artist' | 'home' | 'layout'>('artist');
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [originalConfig, setOriginalConfig] = useState<SiteConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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
                setStatus({ type: 'success', message: 'Configuration saved successfully!' });
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save configuration');
            }
        } catch (error: any) {
            console.error('Save error:', error);
            setStatus({ type: 'error', message: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (originalConfig) {
            setConfig(JSON.parse(JSON.stringify(originalConfig)));
            setStatus(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-navy-900 mb-4" />
                <p className="text-navy-600 font-medium italic">Loading Architect's Desk...</p>
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

            <AnimatePresence>
                {status && (
                    <m.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}
                    >
                        {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        <p className="text-sm font-medium">{status.message}</p>
                    </m.div>
                )}
            </AnimatePresence>

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
                            label="Hero & Home"
                            description="Visual elements & stats"
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
                                                        const newBio = config.artist.fullBio.filter((_, i) => i !== idx);
                                                        setConfig({ ...config, artist: { ...config.artist, fullBio: newBio } });
                                                    }}
                                                    onMove={(dir: 'up' | 'down') => {
                                                        const newBio = [...config.artist.fullBio];
                                                        const target = dir === 'up' ? idx - 1 : idx + 1;
                                                        if (target >= 0 && target < newBio.length) {
                                                            [newBio[idx], newBio[target]] = [newBio[target], newBio[idx]];
                                                            setConfig({ ...config, artist: { ...config.artist, fullBio: newBio } });
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
                                                    const newBio = [...config.artist.fullBio, { type: 'paragraph', content: '' }];
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
                                    <InputField
                                        label="Hero Title"
                                        value={config.home.heroTitle || ''}
                                        onChange={(v) => setConfig({ ...config, home: { ...config.home, heroTitle: v } })}
                                    />
                                    <div className="grid grid-cols-2 gap-6">
                                        <InputField
                                            label="Background Image Path"
                                            value={config.home.heroBackground || ''}
                                            onChange={(v) => setConfig({ ...config, home: { ...config.home, heroBackground: v } })}
                                        />
                                        <InputField
                                            label="Tagline"
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
