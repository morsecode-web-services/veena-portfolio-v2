'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Button } from '@/components/system/Button';
import { 
    Search, 
    Filter, 
    Download, 
    Trash2, 
    CheckCircle2, 
    Archive, 
    Eye, 
    X,
    FileSpreadsheet,
    Clock,
    User,
    Mail,
    ChevronDown
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';

interface FormSubmission {
  id: string;
  form_slug: string;
  form_data: Record<string, any>;
  user_name: string | null;
  user_email: string | null;
  status: 'unread' | 'read' | 'archived';
  is_verified: boolean;
  created_at: string;
  payment_status?: string;
  razorpay_subscription_id?: string;
  razorpay_customer_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  cohort_id?: string | null;
}

interface FormConfig {
  form_slug: string;
  title: string;
  fields: any[];
}

export default function ResponsesPage() {
    const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);
    const [configs, setConfigs] = useState<Record<string, FormConfig>>({});
    const [cohorts, setCohorts] = useState<Record<string, { title: string }>>({});
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [slugFilter, setSlugFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('form_submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching submissions:', error);
        } else {
            setSubmissions(data || []);
        }
        setLoading(false);
    }, []);

    const fetchConfigs = useCallback(async () => {
        const { data } = await supabase.from('form_configs').select('form_slug, title, fields');
        if (data) {
            const configMap = data.reduce((acc, config) => {
                acc[config.form_slug] = config;
                return acc;
            }, {} as Record<string, FormConfig>);
            setConfigs(configMap);
        }
    }, []);

    const fetchCohorts = useCallback(async () => {
        const { data } = await supabase.from('cohorts').select('id, title');
        if (data) {
            const cohortMap = data.reduce((acc, c) => {
                acc[c.id] = { title: c.title };
                return acc;
            }, {} as Record<string, { title: string }>);
            setCohorts(cohortMap);
        }
    }, []);

    useEffect(() => {
        fetchSubmissions();
        fetchConfigs();
        fetchCohorts();

        // Add Escape key listener
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedSubmission(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [fetchSubmissions, fetchConfigs, fetchCohorts]);

    useEffect(() => {
        let filtered = [...submissions];

        if (statusFilter === 'unread') {
            filtered = filtered.filter(s => s.status === 'unread');
        } else if (statusFilter === 'verified') {
            filtered = filtered.filter(s => s.is_verified);
        }

        if (slugFilter !== 'all') {
            filtered = filtered.filter(s => s.form_slug === slugFilter);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(s => 
                s.user_name?.toLowerCase().includes(q) || 
                s.user_email?.toLowerCase().includes(q) || 
                s.form_slug.toLowerCase().includes(q) ||
                JSON.stringify(s.form_data).toLowerCase().includes(q)
            );
        }

        setFilteredSubmissions(filtered);
    }, [submissions, statusFilter, slugFilter, searchQuery]);

    const updateStatus = async (id: string, status: FormSubmission['status']) => {
        const { error } = await supabase
            .from('form_submissions')
            .update({ status })
            .eq('id', id);

        if (!error) {
            setSubmissions(submissions.map(s => s.id === id ? { ...s, status } : s));
            if (selectedSubmission?.id === id) {
                setSelectedSubmission({ ...selectedSubmission, status });
            }
        }
    };

    const toggleVerified = async (id: string, isVerified: boolean) => {
        const { error } = await supabase
            .from('form_submissions')
            .update({ is_verified: isVerified })
            .eq('id', id);

        if (!error) {
            setSubmissions(submissions.map(s => s.id === id ? { ...s, is_verified: isVerified } : s));
            if (selectedSubmission?.id === id) {
                setSelectedSubmission({ ...selectedSubmission, is_verified: isVerified });
            }
        }
    };

    const deleteSubmission = async (id: string) => {
        if (!confirm('Are you sure you want to delete this submission? This cannot be undone.')) return;
        
        const { error } = await supabase
            .from('form_submissions')
            .delete()
            .eq('id', id);

        if (!error) {
            setSubmissions(submissions.filter(s => s.id !== id));
            setSelectedSubmission(null);
        }
    };

    const exportToCSV = () => {
        if (filteredSubmissions.length === 0) return;

        // Collect all possible keys from form_data for the header
        const dataKeys = new Set<string>();
        filteredSubmissions.forEach(s => {
            Object.keys(s.form_data).forEach(key => dataKeys.add(key));
        });
        const dynamicHeaders = Array.from(dataKeys);

        const escapeCSV = (val: any) => {
            if (val === null || val === undefined) return '""';
            const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `"${s.replace(/"/g, '""')}"`;
        };

        const headers = ['Date', 'Form', 'Name', 'Email', 'Status', ...dynamicHeaders.map(h => h.toUpperCase())];
        const rows = filteredSubmissions.map(s => [
            escapeCSV(new Date(s.created_at).toLocaleString()),
            escapeCSV(s.form_slug),
            escapeCSV(s.user_name || 'N/A'),
            escapeCSV(s.user_email || 'N/A'),
            escapeCSV(s.status),
            ...dynamicHeaders.map(key => escapeCSV(s.form_data[key]))
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `form_submissions_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const markAllAsRead = async () => {
        const unreadIds = submissions
            .filter(s => s.status === 'unread')
            .map(s => s.id);
        
        if (unreadIds.length === 0) return;

        const { error } = await supabase
            .from('form_submissions')
            .update({ status: 'read' })
            .in('id', unreadIds);

        if (!error) {
            setSubmissions(submissions.map(s => 
                unreadIds.includes(s.id) ? { ...s, status: 'read' } : s
            ));
        }
    };

    const getFormTitle = (slug: string) => configs[slug]?.title || slug.replace(/-/g, ' ').toUpperCase();

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-navy-900">Form Responses</h1>
                    <p className="text-slate-500 mt-1">Manage registrations and inquiries from your dynamic forms.</p>
                </div>
                <div className="flex items-center gap-3">
                    {submissions.some(s => s.status === 'unread') && (
                        <Button 
                            variant="tertiary" 
                            onClick={markAllAsRead}
                            className="text-slate-500 hover:text-gold-600 border-none bg-transparent shadow-none"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark all as read
                        </Button>
                    )}
                    <Button 
                        variant="secondary" 
                        onClick={exportToCSV}
                        disabled={filteredSubmissions.length === 0}
                        className="bg-white shadow-sm border-slate-200"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                        Export to CSV
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-premium border border-slate-100 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search by name, email, or content..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-gold-400 text-sm transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 mr-1" />
                    <select 
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold-400 min-w-[140px]"
                        value={slugFilter}
                        onChange={(e) => setSlugFilter(e.target.value)}
                    >
                        <option value="all">All Forms</option>
                        {Object.keys(configs).map(slug => (
                            <option key={slug} value={slug}>{configs[slug].title}</option>
                        ))}
                    </select>

                    <select 
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold-400 min-w-[120px]"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="unread">Unread Only</option>
                        <option value="verified">Verified Only</option>
                    </select>
                </div>
            </div>

            {/* Submissions List */}
            <div className="bg-white rounded-2xl shadow-premium border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest">User Details</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest">Form Source</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest">Received At</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest">Payment</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6 border-b border-slate-50"><div className="h-4 bg-slate-100 rounded w-1/2"></div></td>
                                    </tr>
                                ))
                            ) : filteredSubmissions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">No submissions found matching your filters.</td>
                                </tr>
                            ) : (
                                filteredSubmissions.map((submission) => (
                                    <tr 
                                        key={submission.id}
                                        className={`group hover:bg-slate-50/50 transition-colors cursor-pointer ${submission.status === 'unread' ? 'bg-gold-50/10' : ''}`}
                                        onClick={() => {
                                            setSelectedSubmission(submission);
                                            if (submission.status === 'unread') updateStatus(submission.id, 'read');
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${submission.status === 'unread' ? 'bg-gold-100 text-gold-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {(submission.user_name || 'A')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className={`font-bold text-sm ${submission.status === 'unread' ? 'text-navy-900' : 'text-slate-700'}`}>
                                                        {submission.user_name || 'Anonymous User'}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{submission.user_email || 'No email provided'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-navy-50 text-navy-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                {getFormTitle(submission.form_slug)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-600 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                {new Date(submission.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {submission.payment_status === 'paid' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-100 uppercase tracking-tight shadow-sm">
                                                    Paid
                                                </span>
                                            ) : submission.payment_status === 'none' || !submission.payment_status ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-bold border border-slate-100 uppercase tracking-tight">
                                                    N/A
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-[10px] font-bold border border-yellow-100 uppercase tracking-tight">
                                                    {submission.payment_status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {submission.is_verified ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-100 uppercase tracking-tight shadow-sm">
                                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-bold border border-slate-100 uppercase tracking-tight">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedSubmission(submission); }}
                                                    className="p-2 text-slate-400 hover:text-navy-900 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleVerified(submission.id, !submission.is_verified); }}
                                                    className={`p-2 transition-colors ${submission.is_verified ? 'text-green-500 hover:text-green-600' : 'text-slate-400 hover:text-green-600'}`}
                                                    title={submission.is_verified ? "Revoke Verification" : "Verify Response"}
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteSubmission(submission.id); }}
                                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                                    title="Delete Submission"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Submission Detail Modal */}
            <AnimatePresence>
                {selectedSubmission && (
                    <div 
                        className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-50 flex justify-end"
                        onClick={() => setSelectedSubmission(null)}
                    >
                        <m.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="bg-white w-full max-w-xl h-full shadow-premium-xl flex flex-col overflow-hidden border-l border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header - Sticky */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-20 backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-navy-900 text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg">
                                        {(selectedSubmission.user_name || 'A')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-serif font-bold text-navy-900">{selectedSubmission.user_name || 'Anonymous User'}</h2>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{getFormTitle(selectedSubmission.form_slug)}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedSubmission(null)}
                                    className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-colors border border-slate-100"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {/* Metadata Section */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                                            <Mail className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Email</span>
                                        </div>
                                        <div className="text-sm font-semibold text-navy-900 truncate">{selectedSubmission.user_email || 'N/A'}</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Submitted</span>
                                        </div>
                                        <div className="text-sm font-semibold text-navy-900">{new Date(selectedSubmission.created_at).toLocaleString()}</div>
                                    </div>
                                    {selectedSubmission.payment_status && selectedSubmission.payment_status !== 'none' && (
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Payment Info</span>
                                                </div>
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-100 uppercase tracking-tight shadow-sm">
                                                    {selectedSubmission.payment_status}
                                                </span>
                                            </div>
                                            {selectedSubmission.razorpay_subscription_id && (
                                                <div className="text-xs text-slate-600 mb-1">
                                                    <span className="font-bold">Subscription ID:</span> <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">{selectedSubmission.razorpay_subscription_id}</code>
                                                </div>
                                            )}
                                            {selectedSubmission.razorpay_customer_id && (
                                                <div className="text-xs text-slate-600 mb-1">
                                                    <span className="font-bold">Customer ID:</span> <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">{selectedSubmission.razorpay_customer_id}</code>
                                                </div>
                                            )}
                                            {selectedSubmission.razorpay_order_id && (
                                                <div className="text-xs text-slate-600 mb-1">
                                                    <span className="font-bold">Order ID:</span> <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">{selectedSubmission.razorpay_order_id}</code>
                                                </div>
                                            )}
                                            {selectedSubmission.razorpay_payment_id && (
                                                <div className="text-xs text-slate-600">
                                                    <span className="font-bold">Payment ID:</span> <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">{selectedSubmission.razorpay_payment_id}</code>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedSubmission.cohort_id && (
                                        <div className="p-4 bg-gold-50/30 rounded-2xl border border-gold-100 col-span-2">
                                            <div className="flex items-center gap-2 mb-2 text-gold-600">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Enrolled Cohort</span>
                                            </div>
                                            <div className="text-sm font-bold text-navy-900">
                                                {cohorts[selectedSubmission.cohort_id]?.title || 'Unknown Batch'}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Form Data Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <h3 className="text-sm font-bold text-navy-900 uppercase tracking-widest">Submission Data</h3>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {Object.entries(selectedSubmission.form_data).map(([key, value]) => {
                                            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                            const isImage = typeof value === 'string' && (
                                                value.startsWith('http') && 
                                                (value.includes('cloudinary.com') || /\.(jpg|jpeg|png|webp|gif)/i.test(value))
                                            );

                                            return (
                                                <div key={key} className="group">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{label}</label>
                                                    {isImage ? (
                                                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video shadow-sm">
                                                            <Image 
                                                                src={value as string} 
                                                                alt={label} 
                                                                fill
                                                                className="object-contain"
                                                                unoptimized // External URLs from submissions
                                                            />
                                                            <a href={value as string} target="_blank" rel="noopener noreferrer" className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm hover:bg-white transition-colors border border-slate-200 z-10">View Full Size</a>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-navy-800 bg-slate-50/50 p-4 rounded-xl border border-slate-100 leading-relaxed min-h-[46px] flex items-center break-words">
                                                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || '—')}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Button 
                                        variant="tertiary" 
                                        onClick={() => setSelectedSubmission(null)}
                                        className="bg-white border-slate-200"
                                    >
                                        Close
                                    </Button>
                                    <Button 
                                        variant="tertiary" 
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2 min-w-0"
                                        onClick={() => deleteSubmission(selectedSubmission.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                <label className="flex items-center gap-3 cursor-pointer group bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm hover:border-green-300 transition-all">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={selectedSubmission.is_verified || false}
                                            onChange={(e) => toggleVerified(selectedSubmission.id, e.target.checked)}
                                        />
                                        <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                                    </div>
                                    <span className="text-xs font-bold text-navy-900 uppercase tracking-widest group-hover:text-green-600 transition-colors">
                                        {selectedSubmission.is_verified ? 'Verified' : 'Verify Response'}
                                    </span>
                                </label>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
