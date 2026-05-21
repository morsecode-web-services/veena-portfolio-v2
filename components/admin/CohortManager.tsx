'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Trash2, Plus, Edit2, Check, RefreshCw, Star, 
    Info, ImageIcon, DollarSign, Layout, List, 
    MessageSquare, Image as ImageIcon2, X, Save,
    ChevronDown, ChevronUp, MailPlus, Send, ListTree, AlertCircle, Search, Filter, Copy, ExternalLink, TrendingUp
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

    const [isReenrolling, setIsReenrolling] = useState(false);
    const [reenrollSourceId, setReenrollSourceId] = useState('');
    const [reenrollTargetId, setReenrollTargetId] = useState<string | null>(null);
    const [reenrollLoading, setReenrollLoading] = useState(false);
    const [reenrollProgress, setReenrollProgress] = useState({ current: 0, total: 0, success: 0, failed: 0, skipped: 0 });

    const [isViewingLogs, setIsViewingLogs] = useState(false);
    const [viewingLogsCohortId, setViewingLogsCohortId] = useState<string | null>(null);
    const [invitationLogs, setInvitationLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logSearchQuery, setLogSearchQuery] = useState('');
    const [logStatusFilter, setLogStatusFilter] = useState('all');

    const filteredLogs = invitationLogs.filter(log => {
        const matchesSearch = log.student_name.toLowerCase().includes(logSearchQuery.toLowerCase()) || 
                             log.student_email.toLowerCase().includes(logSearchQuery.toLowerCase());
        const matchesStatus = logStatusFilter === 'all' || log.status === logStatusFilter;
        return matchesSearch && matchesStatus;
    });

    const logStats = {
        total: invitationLogs.length,
        paid: invitationLogs.filter(l => l.status === 'paid').length,
        failed: invitationLogs.filter(l => l.status === 'failed').length,
        sent: invitationLogs.filter(l => l.status === 'sent').length,
    };

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

    const handleReenrollBatch = async () => {
        if (!reenrollSourceId || !reenrollTargetId) {
            addToast('Please select a source cohort', 'error');
            return;
        }

        setReenrollLoading(true);
        try {
            // 1. Fetch ALL successful students from source cohort(s)
            // Note: If we want to support multiple source cohorts in future, we can loop here.
            // For now, let's stick to one but implement de-duplication.
            const { data: students, error } = await supabase
                .from('form_submissions')
                .select('user_name, user_email, form_data')
                .eq('cohort_id', reenrollSourceId)
                .eq('payment_status', 'paid');

            if (error || !students) throw new Error('Failed to fetch source students');

            // 2. De-duplicate by Email
            const uniqueStudentsMap = new Map();
            students.forEach(s => {
                if (s.user_email) {
                    uniqueStudentsMap.set(s.user_email.toLowerCase(), {
                        name: s.user_name,
                        email: s.user_email,
                        phone: s.form_data?.phone
                    });
                }
            });

            const uniqueStudents = Array.from(uniqueStudentsMap.values());
            const total = uniqueStudents.length;
            
            if (total === 0) {
                addToast('No eligible paid students found in the source cohort.', 'error');
                setReenrollLoading(false);
                return;
            }

            setReenrollProgress({ current: 0, total, success: 0, failed: 0, skipped: 0 });

            // 3. Batch Process
            const BATCH_SIZE = 10;
            const { data: { session } } = await supabase.auth.getSession();
            
            let totalSuccess = 0;
            let totalFailed = 0;
            let totalSkipped = 0;

            for (let i = 0; i < uniqueStudents.length; i += BATCH_SIZE) {
                const batch = uniqueStudents.slice(i, i + BATCH_SIZE);
                
                const response = await fetch('/api/admin/cohorts/reenroll', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify({
                        targetCohortId: reenrollTargetId,
                        students: batch
                    })
                });

                const result = await response.json();
                
                if (response.ok) {
                    totalSuccess += result.sent;
                    totalFailed += result.failed;
                    totalSkipped += result.skipped;
                    
                    setReenrollProgress(prev => ({
                        ...prev,
                        current: Math.min(i + BATCH_SIZE, total),
                        success: totalSuccess,
                        failed: totalFailed,
                        skipped: totalSkipped
                    }));
                } else {
                    console.error('Batch failed:', result.error);
                    totalFailed += batch.length;
                }
            }

            addToast(`Finished processing ${total} invitations.`, 'success');
            setTimeout(() => {
                setIsReenrolling(false);
                setReenrollSourceId('');
                setReenrollTargetId(null);
            }, 3000);
        } catch (error: any) {
            addToast(error.message || 'An error occurred during batch processing', 'error');
        } finally {
            setReenrollLoading(false);
        }
    };

    const fetchInvitationLogs = async (cohortId: string) => {
        setLogsLoading(true);
        setViewingLogsCohortId(cohortId);
        setIsViewingLogs(true);
        
        try {
            const { data, error } = await supabase
                .from('reenrollment_logs')
                .select('*')
                .eq('target_cohort_id', cohortId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInvitationLogs(data || []);
        } catch (error) {
            addToast('Failed to fetch invitation logs', 'error');
        } finally {
            setLogsLoading(false);
        }
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
            learning_outcomes_raw: '',
            curriculum_highlights_raw: '',
            success_message: 'Welcome aboard! Your enrollment is successful.'
        });
        setIsCreating(false);
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Clean payload: only include valid DB columns
            const payload = {
                title: formData.title,
                description: formData.description || '',
                month_name: formData.month_name,
                price: formData.price,
                original_price: formData.original_price,
                razorpay_plan_id: formData.razorpay_plan_id,
                status: formData.status,
                telegram_chat_id: formData.telegram_chat_id,
                is_highlighted: formData.is_highlighted,
                image_url: formData.image_url,
                success_message: formData.success_message,
                learning_outcomes: (formData.learning_outcomes_raw || '').split('\n').filter((s: string) => s.trim()),
                curriculum_highlights: (formData.curriculum_highlights_raw || '').split('\n').filter((s: string) => s.trim())
            };

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
                                                value={formData.description || ''} 
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
                                                value={formData.learning_outcomes_raw || ''} 
                                                onChange={e => setFormData({...formData, learning_outcomes_raw: e.target.value})}
                                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-navy-500 transition-all outline-none text-xs min-h-[120px]"
                                                placeholder="Master basic fingering..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">COURSE FEATURES (One per line)</label>
                                            <textarea 
                                                value={formData.curriculum_highlights_raw || ''} 
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
                                                onClick={() => fetchInvitationLogs(cohort.id)}
                                                className="p-2 text-slate-400 hover:text-navy-900 hover:bg-white rounded-lg transition-all hover:shadow-sm"
                                                title="View Invite Logs"
                                            >
                                                <List size={16} />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setReenrollTargetId(cohort.id);
                                                    setIsReenrolling(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-gold-600 hover:bg-white rounded-lg transition-all hover:shadow-sm"
                                                title="Invite Previous Batch"
                                            >
                                                <MailPlus size={16} />
                                            </button>
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

            {/* Re-enrollment Modal */}
            {isReenrolling && (
                <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gold-100 text-gold-600 rounded-2xl">
                                    <MailPlus size={24} />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-navy-900 text-xl leading-tight">Invite Returning</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Automated Re-enrollment</p>
                                </div>
                            </div>
                            <button onClick={() => setIsReenrolling(false)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-navy-900 transition-all hover:bg-white rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Target: <span className="text-navy-900">{cohorts.find(c => c.id === reenrollTargetId)?.title}</span></label>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-navy-900 mb-2">Invite Students From</label>
                                <select 
                                    value={reenrollSourceId}
                                    onChange={(e) => setReenrollSourceId(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-gold-400 outline-none transition-all text-sm font-medium text-navy-900"
                                >
                                    <option value="">Select a previous batch...</option>
                                    {cohorts.filter(c => c.id !== reenrollTargetId).map(c => (
                                        <option key={c.id} value={c.id}>{c.month_name} - {c.title}</option>
                                    ))}
                                </select>
                                <p className="mt-3 text-[11px] text-slate-400 leading-relaxed italic">
                                    We will find all successful enrollees from the selected batch and generate unique payment links for them.
                                </p>
                            </div>

                            <div className="bg-navy-50/50 rounded-2xl p-5 flex items-start gap-3 border border-navy-100/20">
                                <Info size={16} className="text-navy-400 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] text-navy-800 leading-relaxed">
                                    Students will receive an email with their <strong>pre-filled 1-click payment link</strong>. No fresh form filling required.
                                </p>
                            </div>

                            {reenrollLoading && (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-navy-900">Progress: {reenrollProgress.current} / {reenrollProgress.total}</span>
                                        <span className="text-gold-600">{Math.round((reenrollProgress.current / reenrollProgress.total) * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gold-500 transition-all duration-500" 
                                            style={{ width: `${(reenrollProgress.current / reenrollProgress.total) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        <span>Sent: <span className="text-green-600">{reenrollProgress.success}</span></span>
                                        <span>Skipped: <span className="text-navy-700">{reenrollProgress.skipped}</span></span>
                                        <span>Failed: <span className="text-red-500">{reenrollProgress.failed}</span></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                            <button 
                                onClick={() => setIsReenrolling(false)}
                                className="flex-1 px-6 py-4 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleReenrollBatch}
                                disabled={reenrollLoading || !reenrollSourceId}
                                className="flex-1 px-6 py-4 rounded-xl text-sm font-bold bg-navy-900 text-white hover:bg-navy-800 shadow-premium hover:shadow-premium-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                            >
                                {reenrollLoading ? (
                                    <RefreshCw size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Send Invitations
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invitation Logs Modal */}
            {isViewingLogs && (
                <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-navy-900 text-white rounded-2xl">
                                    <ListTree size={24} />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-navy-900 text-xl leading-tight">Invitation Logs</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                                        Target: {cohorts.find(c => c.id === viewingLogsCohortId)?.title}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsViewingLogs(false)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-navy-900 transition-all hover:bg-white rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Stats Dashboard */}
                        {!logsLoading && invitationLogs.length > 0 && (
                            <div className="px-8 py-4 bg-white border-b border-slate-50 grid grid-cols-2 gap-4">
                                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Conversion Rate</p>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={14} className="text-gold-500" />
                                        <p className="text-lg font-serif font-bold text-navy-900">
                                            {Math.round((logStats.paid / (logStats.total || 1)) * 100)}%
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivery Status</p>
                                    <div className="flex gap-4 items-center h-full">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-green-600">{logStats.paid}</span>
                                            <span className="text-[8px] font-black uppercase text-slate-400">Paid</span>
                                        </div>
                                        <div className="w-px h-6 bg-slate-100"></div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-navy-900">{logStats.sent}</span>
                                            <span className="text-[8px] font-black uppercase text-slate-400">Sent</span>
                                        </div>
                                        <div className="w-px h-6 bg-slate-100"></div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-red-400">{logStats.failed}</span>
                                            <span className="text-[8px] font-black uppercase text-slate-400">Failed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Search & Filter Bar */}
                        {!logsLoading && invitationLogs.length > 0 && (
                            <div className="px-8 py-4 bg-slate-50/30 flex items-center gap-4 border-b border-slate-50">
                                <div className="relative flex-grow">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text"
                                        placeholder="Search name or email..."
                                        value={logSearchQuery}
                                        onChange={(e) => setLogSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-navy-500/10 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter size={14} className="text-slate-400" />
                                    <select 
                                        value={logStatusFilter}
                                        onChange={(e) => setLogStatusFilter(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-navy-500/10"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="sent">Sent</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-0">
                            {logsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <RefreshCw size={32} className="animate-spin text-gold-500" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Audit Trail...</p>
                                </div>
                            ) : filteredLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 px-8 text-center">
                                    <div className="p-4 bg-slate-50 rounded-full text-slate-200">
                                        <MailPlus size={48} />
                                    </div>
                                    <div>
                                        <p className="text-navy-900 font-bold">No Records Found</p>
                                        <p className="text-sm text-slate-400 max-w-xs mt-1">Try adjusting your search or filters.</p>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-white z-10">
                                        <tr className="bg-slate-50/80 backdrop-blur-md text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <th className="px-8 py-4">Student</th>
                                            <th className="px-8 py-4">Status</th>
                                            <th className="px-8 py-4">Link Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-8 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-navy-900">{log.student_name}</span>
                                                        <span className="text-[10px] text-slate-400">{log.student_email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${
                                                        log.status === 'sent' ? 'bg-green-50 text-green-600' :
                                                        log.status === 'paid' ? 'bg-gold-50 text-gold-600' :
                                                        'bg-red-50 text-red-500'
                                                    }`}>
                                                        {log.status === 'failed' && <AlertCircle size={10} />}
                                                        {log.status}
                                                    </span>
                                                    {log.status === 'failed' && (
                                                        <p className="text-[8px] text-red-400 mt-1 max-w-[120px] line-clamp-1 italic" title={log.error_message}>
                                                            {log.error_message}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {log.payment_link_url && (
                                                            <>
                                                                <button 
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(log.payment_link_url);
                                                                        addToast('Link copied!', 'success');
                                                                    }}
                                                                    className="p-1.5 bg-slate-50 text-slate-400 hover:text-navy-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all shadow-sm"
                                                                    title="Copy Link"
                                                                >
                                                                    <Copy size={12} />
                                                                </button>
                                                                <a 
                                                                    href={log.payment_link_url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="p-1.5 bg-slate-50 text-slate-400 hover:text-navy-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all shadow-sm"
                                                                    title="View Link"
                                                                >
                                                                    <ExternalLink size={12} />
                                                                </a>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Records: <span className="text-navy-900">{filteredLogs.length}</span>
                            </p>
                            <button 
                                onClick={() => setIsViewingLogs(false)}
                                className="px-6 py-3 rounded-xl text-sm font-bold bg-white border border-slate-200 text-navy-900 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
