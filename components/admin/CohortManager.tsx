'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Trash2, Plus, Edit2, Check, RefreshCw, Star, 
    Info, ImageIcon, DollarSign, Layout, List, 
    MessageSquare, Image as ImageIcon2, X, Save,
    ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { CloudinaryUpload } from './CloudinaryUpload';
import Image from 'next/image';

interface Cohort {
    id: string;
    title: string;
    description: string;
    month_name: string;
    price: number;
    original_price?: number;
    razorpay_plan_id: string;
    status: 'active' | 'coming_soon' | 'completed';
    telegram_chat_id: string;
    order_index: number;
    is_highlighted: boolean;
    image_url: string;
    learning_outcomes: string[];
    curriculum_highlights: string[];
    success_message?: string;
    registration_count?: number;
}

export function CohortManager() {
    const { addToast } = useToast();
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({
        title: '',
        description: '',
        month_name: '',
        price: 0,
        original_price: 0,
        status: 'coming_soon',
        is_highlighted: false,
        image_url: '',
        learning_outcomes_raw: '',
        curriculum_highlights_raw: '',
        success_message: 'Welcome aboard! Your enrollment is successful.'
    });

    useEffect(() => {
        fetchCohorts();
    }, []);

    const fetchCohorts = async () => {
        setLoading(true);
        
        // 1. Fetch Cohorts
        const { data: cohortData } = await supabase
            .from('cohorts')
            .select('*')
            .order('order_index', { ascending: true });

        // 2. Fetch Registration Counts
        const { data: subs } = await supabase.from('form_submissions').select('cohort_id').not('cohort_id', 'is', null);
        const { data: leads } = await supabase.from('leads').select('cohort_id').not('cohort_id', 'is', null);
        
        const counts = [...(subs || []), ...(leads || [])].reduce((acc: any, curr: any) => {
            acc[curr.cohort_id] = (acc[curr.cohort_id] || 0) + 1;
            return acc;
        }, {});

        if (cohortData) {
            setCohorts(cohortData.map(c => ({
                ...c,
                registration_count: counts[c.id] || 0
            })));
        }
        setLoading(false);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            month_name: '',
            price: 0,
            original_price: 0,
            status: 'coming_soon',
            is_highlighted: false,
            image_url: '',
            learning_outcomes: [],
            curriculum_highlights: [],
            success_message: 'Welcome aboard! Your enrollment is successful.'
        });
        setIsCreating(false);
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                ...formData,
                learning_outcomes: formData.learning_outcomes_raw.split('\n').filter((s: string) => s.trim()),
                curriculum_highlights: formData.curriculum_highlights_raw.split('\n').filter((s: string) => s.trim())
            };
            delete payload.learning_outcomes_raw;
            delete payload.curriculum_highlights_raw;

            if (editingId) {
                const { error } = await supabase
                    .from('cohorts')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
                addToast('Cohort updated successfully', 'success');
            } else {
                const { error } = await supabase
                    .from('cohorts')
                    .insert([{ ...payload, order_index: cohorts.length }]);
                if (error) throw error;
                addToast('Cohort created successfully', 'success');
            }
            resetForm();
            fetchCohorts();
        } catch (error: any) {
            addToast(error.message || 'Failed to save cohort', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will permanently delete the cohort.')) return;
        const { error } = await supabase.from('cohorts').delete().eq('id', id);
        if (!error) {
            fetchCohorts();
            addToast('Cohort deleted', 'success');
        }
    };

    const startEditing = (cohort: Cohort) => {
        setFormData({
            ...cohort,
            learning_outcomes_raw: cohort.learning_outcomes?.join('\n') || '',
            curriculum_highlights_raw: cohort.curriculum_highlights?.join('\n') || ''
        });
        setEditingId(cohort.id);
        setIsCreating(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin mb-4" />
            <span className="text-xs font-black uppercase tracking-widest">Loading Cohorts...</span>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-navy-900">Cohort Management</h1>
                    <p className="text-sm text-slate-500">Manage your monthly learning batches and pricing.</p>
                </div>
                {!isCreating && !editingId && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="bg-navy-900 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-gold-500 hover:text-navy-900 transition-all shadow-premium"
                    >
                        <Plus size={16} /> Create New Batch
                    </button>
                )}
            </div>

            {/* Form Section (Unified Create/Edit) */}
            {(isCreating || editingId) && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-premium-lg overflow-hidden mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-black text-navy-900 uppercase tracking-widest flex items-center gap-2">
                            {editingId ? <Edit2 size={16} className="text-gold-500" /> : <Plus size={16} className="text-gold-500" />}
                            {editingId ? 'Edit Cohort' : 'Create New Cohort'}
                        </h2>
                        <button onClick={resetForm} className="text-slate-400 hover:text-red-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Left Column: Basic Info & Pricing */}
                            <div className="lg:col-span-2 space-y-8">
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Layout size={16} className="text-navy-300" />
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Basic Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">COHORT TITLE</label>
                                            <input 
                                                value={formData.title} 
                                                onChange={e => setFormData({...formData, title: e.target.value})}
                                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-500 transition-all outline-none text-sm font-bold"
                                                placeholder="e.g. June 2026 Advanced Batch"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">MONTH NAME</label>
                                            <input 
                                                value={formData.month_name} 
                                                onChange={e => setFormData({...formData, month_name: e.target.value})}
                                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-500 transition-all outline-none text-sm"
                                                placeholder="June"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">DISPLAY STATUS</label>
                                            <select 
                                                value={formData.status} 
                                                onChange={e => setFormData({...formData, status: e.target.value as any})}
                                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-500 transition-all outline-none text-sm"
                                            >
                                                <option value="active">Active (Enrollment Open)</option>
                                                <option value="coming_soon">Coming Soon</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">SHORT DESCRIPTION (Shows on card & modal)</label>
                                            <textarea 
                                                value={formData.description} 
                                                onChange={e => setFormData({...formData, description: e.target.value})}
                                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-500 transition-all outline-none text-sm min-h-[80px]"
                                                placeholder="A brief summary of what this cohort is about..."
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">SUCCESS MESSAGE (Shown after payment)</label>
                                            <input 
                                                value={formData.success_message || ''} 
                                                onChange={e => setFormData({...formData, success_message: e.target.value})}
                                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-500 transition-all outline-none text-sm font-medium text-green-700"
                                                placeholder="Welcome aboard! Your enrollment is successful."
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <DollarSign size={16} className="text-navy-300" />
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pricing & Logistics</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">CURRENT PRICE (₹)</label>
                                            <input 
                                                type="number"
                                                value={(formData.price || 0) / 100} 
                                                onChange={e => setFormData({...formData, price: Math.round(parseFloat(e.target.value) * 100) || 0})}
                                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-500 transition-all outline-none text-sm font-bold text-navy-900"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">ORIGINAL PRICE (Strikethrough ₹)</label>
                                            <input 
                                                type="number"
                                                value={(formData.original_price || 0) / 100} 
                                                onChange={e => setFormData({...formData, original_price: Math.round(parseFloat(e.target.value) * 100) || 0})}
                                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-500 transition-all outline-none text-sm text-slate-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">RAZORPAY PLAN ID</label>
                                            <input 
                                                value={formData.razorpay_plan_id || ''} 
                                                onChange={e => setFormData({...formData, razorpay_plan_id: e.target.value})}
                                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-500 transition-all outline-none text-sm font-mono"
                                                placeholder="plan_xxxxxxx"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">TELEGRAM CHAT ID</label>
                                            <input 
                                                value={formData.telegram_chat_id || ''} 
                                                onChange={e => setFormData({...formData, telegram_chat_id: e.target.value})}
                                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-500 transition-all outline-none text-sm font-mono"
                                                placeholder="-100xxxxxxx"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Content & Media */}
                            <div className="space-y-8">
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <ImageIcon2 size={16} className="text-navy-300" />
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thumbnail</h3>
                                    </div>
                                    <CloudinaryUpload 
                                        value={formData.image_url} 
                                        onChange={url => setFormData({...formData, image_url: url})}
                                        folder="cohorts"
                                    />
                                </section>

                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <List size={16} className="text-navy-300" />
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Course Content</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">LEARNING OUTCOMES (One per line)</label>
                                            <textarea 
                                                value={formData.learning_outcomes_raw} 
                                                onChange={e => setFormData({...formData, learning_outcomes_raw: e.target.value})}
                                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-500 transition-all outline-none text-xs min-h-[120px]"
                                                placeholder="Master basic fingering..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">COURSE FEATURES (One per line)</label>
                                            <textarea 
                                                value={formData.curriculum_highlights_raw} 
                                                onChange={e => setFormData({...formData, curriculum_highlights_raw: e.target.value})}
                                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-500 transition-all outline-none text-xs min-h-[120px]"
                                                placeholder="10+ Live Sessions..."
                                            />
                                        </div>
                                    </div>
                                </section>

                                <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Tag</span>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({...formData, is_highlighted: !formData.is_highlighted})}
                                            className={`w-10 h-6 rounded-full transition-all relative ${formData.is_highlighted ? 'bg-gold-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_highlighted ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort Order</span>
                                        <input 
                                            type="number"
                                            value={formData.order_index}
                                            onChange={e => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
                                            className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-center font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end gap-4">
                            <button 
                                type="button" 
                                onClick={resetForm}
                                className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-navy-900 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="bg-navy-900 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gold-500 hover:text-navy-900 transition-all shadow-premium active:scale-95 flex items-center gap-2"
                            >
                                <Save size={16} /> {editingId ? 'Update Cohort' : 'Create Cohort'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-premium overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest">Active Cohorts ({cohorts.length})</h3>
                    <button onClick={fetchCohorts} className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100 shadow-sm">
                        <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                <th className="px-8 py-5">Preview</th>
                                <th className="px-8 py-5">Title & Month</th>
                                <th className="px-8 py-5">Pricing</th>
                                <th className="px-8 py-5">Students</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {cohorts.map((cohort) => (
                                <tr key={cohort.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="relative w-16 aspect-video rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                                            {cohort.image_url ? (
                                                <Image src={cohort.image_url} alt={cohort.title} fill className="object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-slate-200">
                                                    <ImageIcon2 size={16} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-serif font-bold text-navy-900">{cohort.title}</span>
                                            {cohort.is_highlighted && <Star size={12} className="text-gold-500 fill-current" />}
                                        </div>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{cohort.month_name}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-navy-900">₹{(cohort.price / 100).toFixed(0)}</span>
                                            {cohort.original_price && (
                                                <span className="text-[10px] text-slate-300 line-through italic">₹{(cohort.original_price / 100).toFixed(0)}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-bold text-navy-900">{cohort.registration_count || 0}</span>
                                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Enrolled</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm ${
                                            cohort.status === 'active' ? 'bg-green-100 text-green-700' :
                                            cohort.status === 'coming_soon' ? 'bg-slate-100 text-slate-500' :
                                            'bg-red-50 text-red-400'
                                        }`}>
                                            {cohort.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button 
                                                onClick={() => startEditing(cohort)}
                                                className="p-2 text-slate-400 hover:text-navy-900 hover:bg-white rounded-lg transition-all hover:shadow-sm"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(cohort.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all hover:shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
