'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Trash2, Plus, Edit2, RefreshCw, Star, 
    Info, DollarSign, Layout, List, 
    X, Save, MailPlus, Send, ListTree, AlertCircle, Search, Filter, Copy, ExternalLink, TrendingUp,
    Image as ImageIcon
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
    pricing_type?: 'fixed' | 'pay_as_you_wish';
    invite_conversion?: { total: number; paid: number };
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
        success_message: 'Welcome aboard! Your enrollment is successful.',
        pricing_type: 'fixed'
    });

    const [isReenrolling, setIsReenrolling] = useState(false);
    const [reenrollSourceId, setReenrollSourceId] = useState('');
    const [reenrollTargetId, setReenrollTargetId] = useState<string | null>(null);
    const [reenrollLoading, setReenrollLoading] = useState(false);
    const [reenrollProgress, setReenrollProgress] = useState({ current: 0, total: 0, success: 0, failed: 0, skipped: 0 });

    const [sourceStudents, setSourceStudents] = useState<any[]>([]);
    const [sourceStudentsLoading, setSourceStudentsLoading] = useState(false);
    const [selectedStudentEmails, setSelectedStudentEmails] = useState<Set<string>>(new Set());
    const [studentSearchQuery, setStudentSearchQuery] = useState('');

    const filteredStudents = sourceStudents.filter(s => {
        const query = studentSearchQuery.toLowerCase();
        return (
            (s.name || '').toLowerCase().includes(query) ||
            (s.email || '').toLowerCase().includes(query)
        );
    });

    useEffect(() => {
        if (!reenrollSourceId) {
            setSourceStudents([]);
            setSelectedStudentEmails(new Set());
            return;
        }

        const fetchSourceStudents = async () => {
            setSourceStudentsLoading(true);
            try {
                const { data: enrollments, error } = await supabase
                    .from('enrollments')
                    .select('id, students(name, email, phone)')
                    .eq('cohort_id', reenrollSourceId)
                    .eq('status', 'active');

                if (error) throw error;

                // De-duplicate by Email
                const uniqueStudentsMap = new Map();
                enrollments?.forEach(e => {
                    const s = e.students as any;
                    if (s?.email) {
                        uniqueStudentsMap.set(s.email.toLowerCase(), {
                            name: s.name || 'Student',
                            email: s.email,
                            phone: s.phone || ''
                        });
                    }
                });

                const uniqueStudents = Array.from(uniqueStudentsMap.values());
                setSourceStudents(uniqueStudents);
                setSelectedStudentEmails(new Set(uniqueStudents.map(s => s.email.toLowerCase())));
            } catch (err: any) {
                addToast(err.message || 'Failed to fetch source students', 'error');
            } finally {
                setSourceStudentsLoading(false);
            }
        };

        fetchSourceStudents();
    }, [reenrollSourceId, addToast]);

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

        // 2. Fetch Registration Counts (Occupancy from enrollments table)
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('cohort_id')
            .eq('status', 'active');
        
        const counts = (enrollments || []).reduce((acc: any, curr: any) => {
            acc[curr.cohort_id] = (acc[curr.cohort_id] || 0) + 1;
            return acc;
        }, {});

        // 3. Fetch Re-enrollment invitation stats grouped by target_cohort_id
        const { data: inviteStatsData } = await supabase
            .from('reenrollment_invitations')
            .select('target_cohort_id, status');

        const inviteStats = (inviteStatsData || []).reduce((acc: any, curr: any) => {
            if (!acc[curr.target_cohort_id]) {
                acc[curr.target_cohort_id] = { total: 0, paid: 0 };
            }
            acc[curr.target_cohort_id].total += 1;
            if (curr.status === 'paid') {
                acc[curr.target_cohort_id].paid += 1;
            }
            return acc;
        }, {});

        if (cohortData) {
            setCohorts(cohortData.map(c => ({
                ...c,
                registration_count: counts[c.id] || 0,
                invite_conversion: inviteStats[c.id] || undefined
            })));
        }
        setLoading(false);
    };

    const handleReenrollBatch = async () => {
        if (!reenrollSourceId || !reenrollTargetId) {
            addToast('Please select a source cohort', 'error');
            return;
        }

        const uniqueStudents = sourceStudents.filter(s => 
            selectedStudentEmails.has(s.email.toLowerCase())
        );
        const total = uniqueStudents.length;

        if (total === 0) {
            addToast('Please select at least one student to invite.', 'error');
            return;
        }

        setReenrollLoading(true);
        try {
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
                    setReenrollProgress(prev => ({
                        ...prev,
                        current: Math.min(i + BATCH_SIZE, total),
                        failed: totalFailed
                    }));
                }
            }

            if (totalSuccess > 0) {
                if (totalFailed > 0) {
                    addToast(`Sent ${totalSuccess} invitations successfully, but ${totalFailed} failed.`, 'info');
                } else if (totalSkipped > 0) {
                    addToast(`Sent ${totalSuccess} invitations successfully (${totalSkipped} already invited/enrolled).`, 'success');
                } else {
                    addToast(`Successfully sent ${totalSuccess} invitations.`, 'success');
                }
            } else if (totalSkipped > 0) {
                addToast(`No invitations sent. All ${totalSkipped} students were skipped (already invited or enrolled).`, 'info');
            } else {
                addToast(`Failed to process invitations. Please check server logs.`, 'error');
            }

            setTimeout(() => {
                setIsReenrolling(false);
                setReenrollSourceId('');
                setReenrollTargetId(null);
                setSourceStudents([]);
                setSelectedStudentEmails(new Set());
                setStudentSearchQuery('');
            }, 4000);
        } catch (error: any) {
            addToast(error.message || 'An error occurred during batch processing', 'error');
        } finally {
            setReenrollLoading(false);
        }
    };

    const closeReenrollModal = () => {
        setIsReenrolling(false);
        setReenrollSourceId('');
        setReenrollTargetId(null);
        setSourceStudents([]);
        setSelectedStudentEmails(new Set());
        setStudentSearchQuery('');
    };

    const fetchInvitationLogs = async (cohortId: string) => {
        setLogsLoading(true);
        setViewingLogsCohortId(cohortId);
        setIsViewingLogs(true);
        
        try {
            const { data, error } = await supabase
                .from('reenrollment_invitations')
                .select('*, students(name, email, phone)')
                .eq('target_cohort_id', cohortId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedLogs = (data || []).map((item: any) => ({
                id: item.id,
                student_id: item.student_id,
                student_name: item.students?.name || 'Unknown',
                student_email: item.students?.email || 'Unknown',
                student_phone: item.students?.phone || '',
                source_cohort_id: item.source_cohort_id,
                target_cohort_id: item.target_cohort_id,
                payment_link_id: item.payment_link_id,
                payment_link_url: item.payment_link_url,
                status: item.status,
                error_message: item.error_message,
                created_at: item.created_at,
                updated_at: item.updated_at
            }));

            setInvitationLogs(formattedLogs);
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
            success_message: 'Welcome aboard! Your enrollment is successful.',
            pricing_type: 'fixed'
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
                curriculum_highlights: (formData.curriculum_highlights_raw || '').split('\n').filter((s: string) => s.trim()),
                pricing_type: formData.pricing_type || 'fixed'
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
            <RefreshCw className="h-6 w-6 animate-spin mb-3" />
            <span className="text-xs font-bold uppercase tracking-wider">Loading Cohorts...</span>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Cohort Management</h1>
                    <p className="text-slate-500 text-xs mt-0.5">Manage your monthly learning batches and pricing.</p>
                </div>
                {!isCreating && !editingId && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="bg-slate-900 text-white hover:bg-slate-800 px-4.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                        <Plus size={14} /> Create New Batch
                    </button>
                )}
            </div>

            {/* Form Section (Unified Create/Edit) */}
            {(isCreating || editingId) && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            {editingId ? <Edit2 size={12} className="text-slate-500" /> : <Plus size={12} className="text-slate-500" />}
                            {editingId ? 'Edit Cohort' : 'Create New Cohort'}
                        </h2>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="p-5">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Basic Info & Pricing */}
                            <div className="lg:col-span-2 space-y-6">
                                <section className="space-y-4">
                                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                        <Layout size={14} className="text-slate-400" />
                                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Basic Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">COHORT TITLE</label>
                                            <input 
                                                value={formData.title} 
                                                onChange={e => setFormData({...formData, title: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all font-semibold text-slate-800"
                                                placeholder="e.g. June 2026 Advanced Batch"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">MONTH NAME</label>
                                            <input 
                                                value={formData.month_name} 
                                                onChange={e => setFormData({...formData, month_name: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-slate-800"
                                                placeholder="June"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DISPLAY STATUS</label>
                                            <select 
                                                value={formData.status} 
                                                onChange={e => setFormData({...formData, status: e.target.value as any})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-slate-805"
                                            >
                                                <option value="active">Active (Enrollment Open)</option>
                                                <option value="coming_soon">Coming Soon</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SHORT DESCRIPTION (Shows on card & modal)</label>
                                            <textarea 
                                                value={formData.description || ''} 
                                                onChange={e => setFormData({...formData, description: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all min-h-[80px] text-slate-808"
                                                placeholder="A brief summary of what this cohort is about..."
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SUCCESS MESSAGE (Shown after payment)</label>
                                            <input 
                                                value={formData.success_message || ''} 
                                                onChange={e => setFormData({...formData, success_message: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-emerald-700"
                                                placeholder="Welcome aboard! Your enrollment is successful."
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                        <DollarSign size={14} className="text-slate-400" />
                                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pricing & Logistics</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PRICING MODEL</label>
                                            <select 
                                                value={formData.pricing_type || 'fixed'} 
                                                onChange={e => setFormData({...formData, pricing_type: e.target.value as any})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all font-semibold text-slate-808"
                                            >
                                                <option value="fixed">Fixed Price</option>
                                                <option value="pay_as_you_wish">Pay As You Wish (Guru Dakshina)</option>
                                            </select>
                                            <p className="mt-1 text-[10px] text-slate-450 italic">
                                                If set to Pay As You Wish, the suggestions price acts as template placeholder contribution at checkout, but students can contribute any custom amount (min ₹1).
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CURRENT PRICE / SUGGESTED AMOUNT (₹)</label>
                                            <input 
                                                type="number"
                                                value={(formData.price || 0) / 100} 
                                                onChange={e => setFormData({...formData, price: Math.round(parseFloat(e.target.value) * 100) || 0})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all font-bold text-slate-808"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ORIGINAL PRICE (Strikethrough ₹)</label>
                                            <input 
                                                type="number"
                                                value={(formData.original_price || 0) / 100} 
                                                onChange={e => setFormData({...formData, original_price: Math.round(parseFloat(e.target.value) * 100) || 0})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">RAZORPAY PLAN ID</label>
                                            <input 
                                                value={formData.razorpay_plan_id || ''} 
                                                onChange={e => setFormData({...formData, razorpay_plan_id: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all font-mono text-slate-808"
                                                placeholder="plan_xxxxxxx"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TELEGRAM CHAT ID</label>
                                            <input 
                                                value={formData.telegram_chat_id || ''} 
                                                onChange={e => setFormData({...formData, telegram_chat_id: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all font-mono text-slate-808"
                                                placeholder="-100xxxxxxx"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Content & Media */}
                            <div className="space-y-6">
                                <section className="space-y-4">
                                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                        <ImageIcon size={14} className="text-slate-400" />
                                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thumbnail</h3>
                                    </div>
                                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                                        <CloudinaryUpload 
                                            value={formData.image_url} 
                                            onChange={url => setFormData({...formData, image_url: url})}
                                            folder="cohorts"
                                        />
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                        <List size={14} className="text-slate-400" />
                                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course Content</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">LEARNING OUTCOMES (One per line)</label>
                                            <textarea 
                                                value={formData.learning_outcomes_raw || ''} 
                                                onChange={e => setFormData({...formData, learning_outcomes_raw: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all min-h-[100px] text-slate-800"
                                                placeholder="Master basic fingering..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">COURSE FEATURES (One per line)</label>
                                            <textarea 
                                                value={formData.curriculum_highlights_raw || ''} 
                                                onChange={e => setFormData({...formData, curriculum_highlights_raw: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all min-h-[100px] text-slate-800"
                                                placeholder="10+ Live Sessions..."
                                            />
                                        </div>
                                    </div>
                                </section>

                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recommended Tag</span>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({...formData, is_highlighted: !formData.is_highlighted})}
                                            className={`w-9 h-5 rounded-full transition-all relative ${formData.is_highlighted ? 'bg-slate-900' : 'bg-slate-300'}`}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.is_highlighted ? 'right-0.5' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort Order</span>
                                        <input 
                                            type="number"
                                            value={formData.order_index}
                                            onChange={e => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
                                            className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-center font-bold text-slate-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={resetForm}
                                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                            >
                                <Save size={14} /> {editingId ? 'Update Cohort' : 'Create Cohort'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider">Active Cohorts ({cohorts.length})</h3>
                    <button onClick={fetchCohorts} className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-colors">
                        <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-505">
                                <th className="px-5 py-3.5 w-24">Preview</th>
                                <th className="px-5 py-3.5">Title & Month</th>
                                <th className="px-5 py-3.5">Pricing</th>
                                <th className="px-5 py-3.5">Students</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {cohorts.map((cohort) => (
                                <tr key={cohort.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-5 py-3">
                                        <div className="relative w-16 aspect-video rounded overflow-hidden border border-slate-200 bg-slate-50">
                                            {cohort.image_url ? (
                                                <Image src={cohort.image_url} alt={cohort.title} fill className="object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-slate-300">
                                                    <ImageIcon size={14} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="font-bold text-slate-800">{cohort.title}</span>
                                            {cohort.is_highlighted && <Star size={10} className="text-amber-500 fill-current" />}
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{cohort.month_name}</span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex flex-col">
                                            {cohort.pricing_type === 'pay_as_you_wish' ? (
                                                <>
                                                    <span className="text-[8px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 w-max mb-0.5">Pay As You Wish</span>
                                                    <span className="text-[10px] text-slate-400">Suggested: ₹{(cohort.price / 100).toFixed(0)}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="font-bold text-slate-800">₹{(cohort.price / 100).toFixed(0)}</span>
                                                    {cohort.original_price && (
                                                        <span className="text-[9px] text-slate-300 line-through">₹{(cohort.original_price / 100).toFixed(0)}</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold text-slate-800">{cohort.registration_count || 0}</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Enrolled</span>
                                            </div>
                                            {cohort.invite_conversion && cohort.invite_conversion.total > 0 && (
                                                <div className="text-[9px] text-slate-400" title="Re-enrollment conversion: (Paid / Sent)">
                                                    Re-enroll: <span className="font-bold text-slate-700">{cohort.invite_conversion.paid}</span>/{cohort.invite_conversion.total} ({Math.round((cohort.invite_conversion.paid / cohort.invite_conversion.total) * 100)}%)
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${
                                            cohort.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            cohort.status === 'coming_soon' ? 'bg-slate-100 text-slate-505 border-slate-200' :
                                            'bg-red-50 text-red-500 border-red-100'
                                        }`}>
                                            {cohort.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-1.5">
                                            <button 
                                                onClick={() => fetchInvitationLogs(cohort.id)}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded border border-slate-200 bg-white transition-colors"
                                                title="View Invite Logs"
                                            >
                                                <List size={12} />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setReenrollTargetId(cohort.id);
                                                    setReenrollSourceId('');
                                                    setSourceStudents([]);
                                                    setSelectedStudentEmails(new Set());
                                                    setStudentSearchQuery('');
                                                    setIsReenrolling(true);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded border border-slate-200 bg-white transition-colors"
                                                title="Invite Previous Batch"
                                            >
                                                <MailPlus size={12} />
                                            </button>
                                            <button 
                                                onClick={() => startEditing(cohort)}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded border border-slate-200 bg-white transition-colors"
                                                title="Edit Cohort"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(cohort.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded border border-slate-200 bg-white transition-colors"
                                                title="Delete Cohort"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Batch Re-enrollment Modal */}
            {isReenrolling && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <MailPlus size={16} className="text-slate-500" />
                                <h3 className="font-bold text-slate-900 text-sm">Batch Re-enrollment</h3>
                            </div>
                            <button onClick={closeReenrollModal} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-all">
                                <X size={14} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Cohort</label>
                                <div className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-3 py-2 mb-3">
                                    {cohorts.find(c => c.id === reenrollTargetId)?.title}
                                </div>
                                
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invite Students From</label>
                                <select 
                                    value={reenrollSourceId}
                                    onChange={(e) => setReenrollSourceId(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-slate-800"
                                >
                                    <option value="">Select a previous batch...</option>
                                    {cohorts.filter(c => c.id !== reenrollTargetId).map(c => (
                                        <option key={c.id} value={c.id}>{c.month_name} - {c.title}</option>
                                    ))}
                                </select>
                                <p className="mt-1.5 text-[10px] text-slate-400 leading-relaxed italic">
                                    We will find all successful enrollees from the selected batch and generate unique payment links for them.
                                </p>
                            </div>

                            {/* Dynamic Student Checklist */}
                            {reenrollSourceId && (
                                <div className="space-y-3 pt-3 border-t border-slate-200">
                                    {sourceStudentsLoading ? (
                                        <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                                            <RefreshCw className="h-4 w-4 animate-spin mb-1 text-slate-500" />
                                            <span className="text-[9px] font-bold uppercase tracking-wider">Loading students...</span>
                                        </div>
                                    ) : sourceStudents.length === 0 ? (
                                        <div className="text-center py-4 text-slate-400 bg-slate-50/50 rounded border border-slate-200">
                                            <p className="text-xs font-bold">No eligible paid students found in this cohort</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                <span>Students List</span>
                                                <span className="font-bold text-slate-700">{selectedStudentEmails.size} of {sourceStudents.length} selected</span>
                                            </div>

                                            {/* Search and Select All Bar */}
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-grow">
                                                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        type="text"
                                                        placeholder="Search name or email..."
                                                        value={studentSearchQuery}
                                                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                                                        className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-slate-800"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const allSelected = filteredStudents.every(s => selectedStudentEmails.has(s.email.toLowerCase()));
                                                        const newSelected = new Set(selectedStudentEmails);
                                                        filteredStudents.forEach(s => {
                                                            if (allSelected) {
                                                                newSelected.delete(s.email.toLowerCase());
                                                            } else {
                                                                newSelected.add(s.email.toLowerCase());
                                                            }
                                                        });
                                                        setSelectedStudentEmails(newSelected);
                                                    }}
                                                    className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200 hover:bg-slate-50 transition-all text-slate-700 shrink-0"
                                                >
                                                    {filteredStudents.every(s => selectedStudentEmails.has(s.email.toLowerCase())) ? 'Deselect All' : 'Select All'}
                                                </button>
                                            </div>

                                            {/* Scrollable list */}
                                            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100 bg-white">
                                                {filteredStudents.length === 0 ? (
                                                    <div className="p-3 text-center text-xs text-slate-400 italic">No matching students</div>
                                                ) : (
                                                    filteredStudents.map(student => {
                                                        const emailKey = student.email.toLowerCase();
                                                        const isSelected = selectedStudentEmails.has(emailKey);
                                                        return (
                                                            <label 
                                                                key={student.email} 
                                                                className="flex items-center gap-2.5 p-2 hover:bg-slate-50/50 cursor-pointer transition-colors"
                                                            >
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {
                                                                        const newSelected = new Set(selectedStudentEmails);
                                                                        if (newSelected.has(emailKey)) {
                                                                            newSelected.delete(emailKey);
                                                                        } else {
                                                                            newSelected.add(emailKey);
                                                                        }
                                                                        setSelectedStudentEmails(newSelected);
                                                                    }}
                                                                    className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition-colors cursor-pointer"
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-slate-800">{student.name}</span>
                                                                    <span className="text-[10px] text-slate-400">{student.email}</span>
                                                                </div>
                                                            </label>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-start gap-2">
                                <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                <p className="text-[10px] text-slate-600 leading-normal">
                                    Students will receive an email with their <strong>pre-filled 1-click payment link</strong>. No fresh form filling required.
                                </p>
                            </div>

                            {reenrollLoading && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                        <span className="text-slate-800">Progress: {reenrollProgress.current} / {reenrollProgress.total}</span>
                                        <span className="text-slate-500">{Math.round((reenrollProgress.current / reenrollProgress.total) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-slate-900 transition-all duration-500" 
                                            style={{ width: `${(reenrollProgress.current / reenrollProgress.total) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        <span>Sent: <span className="text-green-600">{reenrollProgress.success}</span></span>
                                        <span>Skipped: <span className="text-slate-600">{reenrollProgress.skipped}</span></span>
                                        <span>Failed: <span className="text-red-500">{reenrollProgress.failed}</span></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                            <button 
                                onClick={closeReenrollModal}
                                className="flex-1 px-4 py-2 rounded border border-slate-250 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleReenrollBatch}
                                disabled={reenrollLoading || !reenrollSourceId || selectedStudentEmails.size === 0}
                                className="flex-1 px-4 py-2 rounded text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all"
                            >
                                {reenrollLoading ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                    <>
                                        <Send size={14} />
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-900 text-white rounded">
                                    <ListTree size={16} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm leading-none">Invitation Logs</h3>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                                        Target: {cohorts.find(c => c.id === viewingLogsCohortId)?.title}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsViewingLogs(false)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-all">
                                <X size={14} />
                            </button>
                        </div>

                        {/* Stats Dashboard */}
                        {!logsLoading && invitationLogs.length > 0 && (
                            <div className="px-5 py-3 bg-white border-b border-slate-200 grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Conversion Rate</p>
                                    <div className="flex items-center gap-1">
                                        <TrendingUp size={12} className="text-amber-500" />
                                        <p className="text-sm font-bold text-slate-850">
                                            {Math.round((logStats.paid / (logStats.total || 1)) * 105)}%
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Delivery Status</p>
                                    <div className="flex gap-3 items-center h-5">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-bold text-green-600">{logStats.paid}</span>
                                            <span className="text-[8px] font-bold uppercase text-slate-400">Paid</span>
                                        </div>
                                        <div className="w-px h-3 bg-slate-350"></div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-bold text-slate-700">{logStats.sent}</span>
                                            <span className="text-[8px] font-bold uppercase text-slate-400">Sent</span>
                                        </div>
                                        <div className="w-px h-3 bg-slate-350"></div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-bold text-red-500">{logStats.failed}</span>
                                            <span className="text-[8px] font-bold uppercase text-slate-400">Failed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Search & Filter Bar */}
                        {!logsLoading && invitationLogs.length > 0 && (
                            <div className="px-5 py-2.5 bg-slate-50/50 flex items-center gap-3 border-b border-slate-200">
                                <div className="relative flex-grow">
                                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text"
                                        placeholder="Search name or email..."
                                        value={logSearchQuery}
                                        onChange={(e) => setLogSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-slate-800"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Filter size={12} className="text-slate-400" />
                                    <select 
                                        value={logStatusFilter}
                                        onChange={(e) => setLogStatusFilter(e.target.value)}
                                        className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-slate-808"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="sent">Sent</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto">
                            {logsLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2">
                                    <RefreshCw size={24} className="animate-spin text-slate-500" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loading Audit Trail...</p>
                                </div>
                            ) : filteredLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2 px-5 text-center">
                                    <div className="p-3 bg-slate-50 rounded-full text-slate-300">
                                        <MailPlus size={36} />
                                    </div>
                                    <div>
                                        <p className="text-slate-800 font-bold text-xs">No Records Found</p>
                                        <p className="text-[10px] text-slate-400 max-w-xs mt-0.5">Try adjusting your search or filters.</p>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white z-10">
                                        <tr className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                                            <th className="px-5 py-2.5">Student</th>
                                            <th className="px-5 py-2.5">Status</th>
                                            <th className="px-5 py-2.5 text-right">Link Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {filteredLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-2.5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-805">{log.student_name}</span>
                                                        <span className="text-[10px] text-slate-450">{log.student_email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-2.5">
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit border ${
                                                        log.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        log.status === 'paid' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-red-50 text-red-500 border-red-100'
                                                    }`}>
                                                        {log.status === 'failed' && <AlertCircle size={8} />}
                                                        {log.status}
                                                    </span>
                                                    {log.status === 'failed' && (
                                                        <p className="text-[8px] text-red-400 mt-0.5 max-w-[120px] line-clamp-1 italic" title={log.error_message}>
                                                            {log.error_message}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-2.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {log.payment_link_url && (
                                                            <>
                                                                <button 
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(log.payment_link_url);
                                                                        addToast('Link copied!', 'success');
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 bg-white rounded transition-colors animate-fade-in"
                                                                    title="Copy Link"
                                                                >
                                                                    <Copy size={10} />
                                                                </button>
                                                                <a 
                                                                    href={log.payment_link_url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 bg-white rounded transition-colors"
                                                                    title="View Link"
                                                                >
                                                                    <ExternalLink size={10} />
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

                        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                Records: <span className="text-slate-800">{filteredLogs.length}</span>
                            </p>
                            <button 
                                onClick={() => setIsViewingLogs(false)}
                                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
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
