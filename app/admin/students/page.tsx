'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    User,
    Mail,
    Phone,
    ExternalLink,
    Copy,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    ArrowRight,
    Users,
    Plus,
    X,
    Link as LinkIcon,
    RefreshCw,
    MoreVertical,
    History
} from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

interface StudentCohort {
    id: string;
    title: string;
    type: 'enrollment' | 'invitation';
    status: string;
    date: string;
    link: string | null;
    telegram_joined?: boolean;
    telegram_username?: string | null;
}

interface StudentResult {
    id: string;
    name: string;
    email: string;
    phone?: string;
    cohorts: StudentCohort[];
}

const formatDateSafe = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'N/A';
        return format(d, 'MMM d, yyyy');
    } catch {
        return 'N/A';
    }
};

export default function StudentSearchPage() {
    const { addToast } = useToast();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<StudentResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Cohorts list for dropdown
    const [cohorts, setCohorts] = useState<any[]>([]);

    // Manual Invite Modal State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteCohortId, setInviteCohortId] = useState('');
    const [inviteCustomChatId, setInviteCustomChatId] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitePhone, setInvitePhone] = useState('');
    const [inviteAmount, setInviteAmount] = useState('');
    const [inviteExpireHours, setInviteExpireHours] = useState(24);
    const [recordEnrollment, setRecordEnrollment] = useState(true);
    const [generatedLink, setGeneratedLink] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);

    // Unjoined Students State
    const [unjoinedResults, setUnjoinedResults] = useState<StudentResult[]>([]);
    const [unjoinedLoading, setUnjoinedLoading] = useState(false);

    // Action loading states
    const [remindLoadingId, setRemindLoadingId] = useState<string | null>(null);
    const [regenerateLoadingId, setRegenerateLoadingId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Activity logs states
    const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
    const [logsData, setLogsData] = useState<Record<string, any[]>>({});
    const [logsLoading, setLogsLoading] = useState<Record<string, boolean>>({});

    // Fetch Cohorts
    useEffect(() => {
        const fetchCohorts = async () => {
            try {
                const { data, error } = await supabase
                    .from('cohorts')
                    .select('id, title, telegram_chat_id')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setCohorts(data || []);
            } catch (err) {
                console.error('Failed to load cohorts:', err);
            }
        };
        fetchCohorts();
    }, []);

    const fetchUnjoinedStudents = useCallback(async () => {
        setUnjoinedLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/students/search?filter=unjoined', {
                headers: {
                    'Authorization': `Bearer ${session?.access_token || ''}`
                }
            });
            const data = await res.json();
            setUnjoinedResults(data.results || []);
        } catch (error) {
            console.error('Failed to load unjoined students:', error);
        } finally {
            setUnjoinedLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUnjoinedStudents();
    }, [fetchUnjoinedStudents]);

    const performSearch = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/admin/students/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token || ''}`
                }
            });
            const data = await res.json();
            setResults(data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 2) {
                performSearch();
            } else if (query.length === 0) {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, performSearch]);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getStatusStyles = (status: string, type: string) => {
        if (status === 'paid' || status === 'success') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (status === 'sent') return 'bg-blue-50 text-blue-700 border-blue-100';
        if (status === 'failed') return 'bg-red-50 text-red-700 border-red-100';
        return 'bg-slate-50 text-slate-700 border-slate-100';
    };

    const handleGenerateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteError(null);
        setGeneratedLink('');

        try {
            if (!inviteCohortId) {
                throw new Error('Please select a target cohort or custom chat ID.');
            }
            if (inviteCohortId === 'custom' && !inviteCustomChatId) {
                throw new Error('Please enter a custom Telegram Chat ID.');
            }
            if (recordEnrollment && !inviteName) {
                throw new Error('Student name is required to record enrollment.');
            }

            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/telegram/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`
                },
                body: JSON.stringify({
                    cohortId: inviteCohortId === 'custom' ? null : inviteCohortId,
                    customTelegramChatId: inviteCohortId === 'custom' ? inviteCustomChatId : null,
                    name: inviteName,
                    email: inviteEmail || null,
                    phone: invitePhone,
                    amount: inviteAmount ? Math.round(parseFloat(inviteAmount) * 100) : null,
                    expireHours: inviteExpireHours,
                    recordEnrollment
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate invite');
            }

            setGeneratedLink(data.inviteLink);
            addToast('Invite link generated successfully!', 'success');

            // Refresh search results if student's email/name matches query
            if (query && recordEnrollment) {
                performSearch();
            }
            fetchUnjoinedStudents();
        } catch (err: any) {
            setInviteError(err.message || 'Something went wrong');
            addToast(err.message || 'Failed to generate invite', 'error');
        } finally {
            setInviteLoading(false);
        }
    };
    const handleToggleTelegramJoin = async (submissionId: string, currentJoined: boolean) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            let telegramUsername = '';
            if (!currentJoined) {
                const input = prompt("Enter Telegram username/display name (optional):");
                if (input === null) return; // user cancelled prompt
                telegramUsername = input.trim();
            }

            const res = await fetch('/api/admin/telegram/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`
                },
                body: JSON.stringify({
                    submissionId,
                    telegramJoined: !currentJoined,
                    telegramUsername: telegramUsername || null
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update status');
            }

            addToast(
                currentJoined ? 'Marked student as not joined.' : 'Marked student as joined!',
                'success'
            );
            if (query) {
                performSearch();
            }
            fetchUnjoinedStudents();
        } catch (err: any) {
            addToast(err.message || 'Failed to update join status', 'error');
        }
    };

    const handleSendReminder = async (submissionId: string, email: string) => {
        setRemindLoadingId(submissionId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/telegram/remind', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`
                },
                body: JSON.stringify({ submissionId })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to send reminder email');
            }

            addToast(`Reminder email successfully sent to ${email}!`, 'success');
            if (query) {
                performSearch();
            }
            fetchUnjoinedStudents();
        } catch (err: any) {
            addToast(err.message || 'Failed to send reminder', 'error');
        } finally {
            setRemindLoadingId(null);
        }
    };

    const handleRegenerateLink = async (submissionId: string) => {
        setRegenerateLoadingId(submissionId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/telegram/regenerate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`
                },
                body: JSON.stringify({ submissionId })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to regenerate link');
            }

            addToast('Telegram invite link regenerated successfully!', 'success');
            if (query) {
                performSearch();
            }
            fetchUnjoinedStudents();
        } catch (err: any) {
            addToast(err.message || 'Failed to regenerate link', 'error');
        } finally {
            setRegenerateLoadingId(null);
        }
    };

    const toggleLogs = async (submissionId: string) => {
        if (expandedLogs[submissionId]) {
            setExpandedLogs(prev => ({ ...prev, [submissionId]: false }));
            return;
        }

        setExpandedLogs(prev => ({ ...prev, [submissionId]: true }));

        // Fetch logs if not already loaded
        if (!logsData[submissionId]) {
            setLogsLoading(prev => ({ ...prev, [submissionId]: true }));
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch(`/api/admin/telegram/logs?submissionId=${submissionId}`, {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token || ''}`
                    }
                });
                const data = await res.json();
                if (data.success) {
                    setLogsData(prev => ({ ...prev, [submissionId]: data.logs || [] }));
                } else {
                    throw new Error(data.error || 'Failed to fetch logs');
                }
            } catch (err: any) {
                addToast(err.message || 'Failed to fetch history logs', 'error');
            } finally {
                setLogsLoading(prev => ({ ...prev, [submissionId]: false }));
            }
        }
    };

    const CohortActionGroup = ({
        cohort,
        student,
        isUnjoinedSection = false
    }: {
        cohort: StudentCohort;
        student: StudentResult;
        isUnjoinedSection?: boolean;
    }) => {
        const isPaid = cohort.type === 'enrollment';
        const copyId = isUnjoinedSection ? 'unjoined_link_' + cohort.id : cohort.id + cohort.type;

        return (
            <div className="flex items-center gap-3 self-end md:self-center">
                {cohort.link ? (
                    <button
                        onClick={() => copyToClipboard(cohort.link!, copyId)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copiedId === copyId
                                ? 'bg-green-500 text-white shadow-sm'
                                : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                            }`}
                    >
                        {copiedId === copyId ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                        {copiedId === copyId ? 'Copied' : (isPaid ? 'Copy Invite Link' : 'Copy Payment Link')}
                    </button>
                ) : (
                    isPaid ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100/60 shadow-sm">
                            <CheckCircle2 size={12} />
                            Fully Enrolled
                        </div>
                    ) : null
                )}

                {isPaid && (
                    <div className="flex items-center gap-0.5 bg-slate-50/80 border border-slate-200/40 rounded-xl p-0.5 shadow-sm">
                        {/* Mark Joined / Left */}
                        <button
                            type="button"
                            onClick={() => handleToggleTelegramJoin(cohort.id, !!cohort.telegram_joined)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${cohort.telegram_joined
                                    ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                                    : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                            title={cohort.telegram_joined ? "Mark Telegram as Left" : "Mark Telegram as Joined"}
                        >
                            <CheckCircle2 size={14} />
                        </button>

                        {/* Remind Email */}
                        {!cohort.telegram_joined && (
                            <button
                                type="button"
                                onClick={() => handleSendReminder(cohort.id, student.email)}
                                disabled={remindLoadingId === cohort.id}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-40 transition-all"
                                title="Send Email Reminder"
                            >
                                {remindLoadingId === cohort.id ? (
                                    <div className="h-3.5 w-3.5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Mail size={14} />
                                )}
                            </button>
                        )}

                        {/* Regenerate Link */}
                        {!cohort.telegram_joined && (
                            <button
                                type="button"
                                onClick={() => handleRegenerateLink(cohort.id)}
                                disabled={regenerateLoadingId === cohort.id}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all"
                                title="Regenerate Invite Link"
                            >
                                {regenerateLoadingId === cohort.id ? (
                                    <div className="h-3.5 w-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <RefreshCw size={14} />
                                )}
                            </button>
                        )}

                        {/* History Logs Toggle */}
                        <button
                            type="button"
                            onClick={() => toggleLogs(cohort.id)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${expandedLogs[cohort.id]
                                    ? 'bg-gold-500 text-navy-900 shadow-sm hover:bg-gold-600'
                                    : 'text-slate-400 hover:text-navy-950 hover:bg-slate-100'
                                }`}
                            title="View Activity History"
                        >
                            <History size={14} />
                        </button>
                    </div>
                )}
                <ChevronRight size={16} className="text-slate-200 hidden md:block" />
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-serif font-bold text-navy-950">Student Support</h1>
                    <p className="text-navy-400 text-sm">Search across all batches and invitations to resolve student queries instantly.</p>
                </div>
                <button
                    onClick={() => {
                        setIsInviteModalOpen(true);
                        setInviteCohortId('');
                        setInviteCustomChatId('');
                        setInviteName('');
                        setInviteEmail('');
                        setInvitePhone('');
                        setInviteAmount('');
                        setInviteExpireHours(24);
                        setRecordEnrollment(true);
                        setGeneratedLink('');
                        setInviteError(null);
                    }}
                    className="bg-navy-900 text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gold-500 hover:text-navy-900 transition-all shadow-premium shrink-0"
                >
                    <Plus size={16} /> Manual Invite
                </button>
            </div>

            {/* Search Input */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Search className={`h-6 w-6 transition-colors ${loading ? 'text-gold-500' : 'text-slate-400 group-focus-within:text-gold-500'}`} />
                </div>
                <input
                    type="text"
                    placeholder="Search by name or email address..."
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl py-6 pl-16 pr-6 text-lg font-medium shadow-premium focus:border-gold-500 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all placeholder:text-slate-300"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
                {loading && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        <div className="h-5 w-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {results.length > 0 ? (
                        results.map((student, idx) => (
                            <m.div
                                key={student.email}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white border border-slate-100 rounded-3xl shadow-premium relative"
                            >
                                {/* Student Header */}
                                <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-100 rounded-t-[22px]">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-navy-900 text-gold-400 rounded-2xl flex items-center justify-center shadow-lg">
                                                <User size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-navy-950">{student.name}</h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1.5"><Mail size={14} className="text-slate-400" /> {student.email}</span>
                                                    {student.phone && <span className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400" /> {student.phone}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyToClipboard(student.email, student.email)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${copiedId === student.email ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-navy-900 hover:text-navy-900'
                                                    }`}
                                            >
                                                {copiedId === student.email ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                                {copiedId === student.email ? 'Copied' : 'Copy Email'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Cohorts List */}
                                <div className="divide-y divide-slate-50">
                                    {student.cohorts.map((cohort, cIdx) => (
                                        <div
                                            key={cohort.id + cohort.type}
                                            className={`p-6 md:px-8 hover:bg-slate-50/30 transition-colors ${cIdx === student.cohorts.length - 1 ? 'rounded-b-[22px]' : ''
                                                }`}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2 h-2 rounded-full ${cohort.type === 'enrollment' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className="font-bold text-navy-900 truncate">{cohort.title}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(cohort.status, cohort.type)}`}>
                                                                {cohort.status}
                                                            </span>
                                                            {cohort.type === 'enrollment' && (
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cohort.telegram_joined
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                                    }`}>
                                                                    {cohort.telegram_joined ? `Telegram: Joined${cohort.telegram_username ? ` (${cohort.telegram_username})` : ''}` : 'Telegram: Not Joined'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDateSafe(cohort.date)}</span>
                                                            <span className="font-bold uppercase tracking-tighter text-[9px]">
                                                                {cohort.type === 'enrollment' ? 'Confirmed Student' : 'Invitation Link Sent'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <CohortActionGroup cohort={cohort} student={student} isUnjoinedSection={false} />
                                            </div>

                                            {/* History Logs Panel */}
                                            {cohort.type === 'enrollment' && expandedLogs[cohort.id] && (
                                                <m.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-6 pt-6 border-t border-slate-100 space-y-4 overflow-hidden"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Activity History & Audit Trails</h4>
                                                        <button
                                                            onClick={() => toggleLogs(cohort.id)}
                                                            className="text-xs font-bold text-slate-400 hover:text-navy-950 transition-colors"
                                                        >
                                                            Hide Logs
                                                        </button>
                                                    </div>

                                                    {logsLoading[cohort.id] ? (
                                                        <div className="flex items-center gap-2.5 py-4 text-xs text-slate-400 font-medium">
                                                            <div className="h-4 w-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                                                            Loading timeline logs...
                                                        </div>
                                                    ) : !logsData[cohort.id] || logsData[cohort.id].length === 0 ? (
                                                        <p className="text-xs text-slate-400 italic py-2">No activity logs recorded for this student yet.</p>
                                                    ) : (
                                                        <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 py-2 ml-3">
                                                            {logsData[cohort.id].map((log) => {
                                                                let dotColor = 'border-slate-300 bg-slate-50';
                                                                let actionTitle = log.action;

                                                                if (log.action === 'created') {
                                                                    dotColor = 'border-blue-500 bg-blue-50 text-blue-600';
                                                                    actionTitle = 'Invite Link Created';
                                                                } else if (log.action === 'regenerated') {
                                                                    dotColor = 'border-amber-500 bg-amber-50 text-amber-600';
                                                                    actionTitle = 'Link Regenerated';
                                                                } else if (log.action === 'reminded') {
                                                                    dotColor = 'border-violet-500 bg-violet-50 text-violet-600';
                                                                    actionTitle = 'Reminder Sent';
                                                                } else if (log.action === 'joined') {
                                                                    dotColor = 'border-emerald-500 bg-emerald-50 text-emerald-600';
                                                                    actionTitle = 'Telegram Joined';
                                                                } else if (log.action === 'left') {
                                                                    dotColor = 'border-red-500 bg-red-50 text-red-600';
                                                                    actionTitle = 'Telegram Left / Reset';
                                                                }

                                                                return (
                                                                    <div key={log.id} className="relative group/log">
                                                                        {/* Dot */}
                                                                        <div className={`absolute -left-[32px] top-1.5 w-3 h-3 rounded-full border-2 bg-white ${dotColor} transition-transform group-hover/log:scale-110 shadow-sm`} />

                                                                        <div className="space-y-1.5">
                                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                                                <span className="text-xs font-bold text-navy-950">{actionTitle}</span>
                                                                                <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-100 font-medium">
                                                                                    by {log.created_by}
                                                                                </span>
                                                                                <span className="text-[10px] text-slate-400 font-medium ml-auto">
                                                                                    {format(new Date(log.created_at), 'MMM d, yyyy, h:mm a')}
                                                                                </span>
                                                                            </div>

                                                                            {log.invite_link && (
                                                                                <div className="flex items-center gap-2 bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 max-w-lg shadow-sm">
                                                                                    <span className="text-[11px] font-mono text-slate-600 truncate flex-1">{log.invite_link}</span>
                                                                                    <button
                                                                                        onClick={() => copyToClipboard(log.invite_link, log.id)}
                                                                                        className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all border ${copiedId === log.id
                                                                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                                                                                : 'bg-white border-slate-200 text-slate-500 hover:border-navy-900 hover:text-navy-900'
                                                                                            }`}
                                                                                    >
                                                                                        {copiedId === log.id ? 'Copied' : 'Copy Link'}
                                                                                    </button>
                                                                                </div>
                                                                            )}

                                                                            {log.payload?.old_invite_link && (
                                                                                <p className="text-[10px] text-slate-400 italic">
                                                                                    Replaced link: <span className="font-mono">{log.payload.old_invite_link}</span>
                                                                                </p>
                                                                            )}

                                                                            {log.telegram_username && (
                                                                                <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                                    Telegram: {log.telegram_username}
                                                                                </div>
                                                                            )}

                                                                            {log.payload?.info && (
                                                                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{log.payload.info}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </m.div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </m.div>
                        ))
                    ) : query.length >= 2 && !loading ? (
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white border border-dashed border-slate-200 rounded-3xl p-16 text-center"
                        >
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Users size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-navy-950 mb-2">No matches found</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">Try searching with a different name or email address.</p>
                        </m.div>
                    ) : query.length === 0 ? (
                        <div className="space-y-6">
                            {unjoinedLoading ? (
                                <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-100 rounded-3xl shadow-premium">
                                    <div className="h-8 w-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                    <p className="text-xs font-semibold text-slate-400">Loading pending joins...</p>
                                </div>
                            ) : unjoinedResults.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                                                <Users size={20} className="text-gold-600 animate-pulse" />
                                                Pending Telegram Joins ({unjoinedResults.length})
                                            </h3>
                                            <p className="text-xs text-navy-400 mt-1">Students who have paid but have not yet joined their Telegram groups.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {unjoinedResults.map((student, idx) => (
                                            <m.div
                                                key={student.email}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-white border border-slate-100 rounded-3xl shadow-premium relative"
                                            >
                                                {/* Student Header */}
                                                <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-100 rounded-t-[22px]">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-navy-900 text-gold-400 rounded-2xl flex items-center justify-center shadow-md">
                                                                <User size={24} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-bold text-navy-950">{student.name}</h3>
                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                                                                    <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {student.email}</span>
                                                                    {student.phone && <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {student.phone}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => copyToClipboard(student.email, 'unjoined_' + student.email)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-2 ${copiedId === ('unjoined_' + student.email) ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-navy-900 hover:text-navy-900'
                                                                    }`}
                                                            >
                                                                {copiedId === ('unjoined_' + student.email) ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                                                                {copiedId === ('unjoined_' + student.email) ? 'Copied' : 'Copy Email'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Cohorts List */}
                                                <div className="divide-y divide-slate-50">
                                                    {student.cohorts.map((cohort, cIdx) => (
                                                        <div
                                                            key={cohort.id + cohort.type}
                                                            className={`p-6 md:px-8 hover:bg-slate-50/30 transition-colors ${cIdx === student.cohorts.length - 1 ? 'rounded-b-[22px]' : ''
                                                                }`}
                                                        >
                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-3 mb-1">
                                                                            <span className="font-bold text-navy-900 truncate">{cohort.title}</span>
                                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-red-50 text-red-700 border-red-100">
                                                                                Not Joined
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                                                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDateSafe(cohort.date)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <CohortActionGroup cohort={cohort} student={student} isUnjoinedSection={true} />
                                                            </div>

                                                            {/* History Logs Panel */}
                                                            {cohort.type === 'enrollment' && expandedLogs[cohort.id] && (
                                                                <m.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="mt-6 pt-6 border-t border-slate-100 space-y-4 overflow-hidden"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Activity History & Audit Trails</h4>
                                                                        <button
                                                                            onClick={() => toggleLogs(cohort.id)}
                                                                            className="text-xs font-bold text-slate-400 hover:text-navy-950 transition-colors"
                                                                        >
                                                                            Hide Logs
                                                                        </button>
                                                                    </div>

                                                                    {logsLoading[cohort.id] ? (
                                                                        <div className="flex items-center gap-2.5 py-4 text-xs text-slate-400 font-medium">
                                                                            <div className="h-4 w-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                                                                            Loading timeline logs...
                                                                        </div>
                                                                    ) : !logsData[cohort.id] || logsData[cohort.id].length === 0 ? (
                                                                        <p className="text-xs text-slate-400 italic py-2">No activity logs recorded for this student yet.</p>
                                                                    ) : (
                                                                        <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 py-2 ml-3">
                                                                            {logsData[cohort.id].map((log) => {
                                                                                let dotColor = 'border-slate-300 bg-slate-50';
                                                                                let actionTitle = log.action;

                                                                                if (log.action === 'created') {
                                                                                    dotColor = 'border-blue-500 bg-blue-50 text-blue-600';
                                                                                    actionTitle = 'Invite Link Created';
                                                                                } else if (log.action === 'regenerated') {
                                                                                    dotColor = 'border-amber-500 bg-amber-50 text-amber-600';
                                                                                    actionTitle = 'Link Regenerated';
                                                                                } else if (log.action === 'reminded') {
                                                                                    dotColor = 'border-violet-500 bg-violet-50 text-violet-600';
                                                                                    actionTitle = 'Reminder Sent';
                                                                                } else if (log.action === 'joined') {
                                                                                    dotColor = 'border-emerald-500 bg-emerald-50 text-emerald-600';
                                                                                    actionTitle = 'Telegram Joined';
                                                                                } else if (log.action === 'left') {
                                                                                    dotColor = 'border-red-500 bg-red-50 text-red-600';
                                                                                    actionTitle = 'Telegram Left / Reset';
                                                                                }

                                                                                return (
                                                                                    <div key={log.id} className="relative group/log">
                                                                                        {/* Dot */}
                                                                                        <div className={`absolute -left-[32px] top-1.5 w-3 h-3 rounded-full border-2 bg-white ${dotColor} transition-transform group-hover/log:scale-110 shadow-sm`} />

                                                                                        <div className="space-y-1.5">
                                                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                                                                <span className="text-xs font-bold text-navy-950">{actionTitle}</span>
                                                                                                <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-100 font-medium">
                                                                                                    by {log.created_by}
                                                                                                </span>
                                                                                                <span className="text-[10px] text-slate-400 font-medium ml-auto">
                                                                                                    {format(new Date(log.created_at), 'MMM d, yyyy, h:mm a')}
                                                                                                </span>
                                                                                            </div>

                                                                                            {log.invite_link && (
                                                                                                <div className="flex items-center gap-2 bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 max-w-lg shadow-sm">
                                                                                                    <span className="text-[11px] font-mono text-slate-600 truncate flex-1">{log.invite_link}</span>
                                                                                                    <button
                                                                                                        onClick={() => copyToClipboard(log.invite_link, log.id)}
                                                                                                        className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all border ${copiedId === log.id
                                                                                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                                                                                                : 'bg-white border-slate-200 text-slate-500 hover:border-navy-900 hover:text-navy-900'
                                                                                                            }`}
                                                                                                    >
                                                                                                        {copiedId === log.id ? 'Copied' : 'Copy Link'}
                                                                                                    </button>
                                                                                                </div>
                                                                                            )}

                                                                                            {log.payload?.old_invite_link && (
                                                                                                <p className="text-[10px] text-slate-400 italic">
                                                                                                    Replaced link: <span className="font-mono">{log.payload.old_invite_link}</span>
                                                                                                </p>
                                                                                            )}

                                                                                            {log.telegram_username && (
                                                                                                <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                                                    Telegram: {log.telegram_username}
                                                                                                </div>
                                                                                            )}

                                                                                            {log.payload?.info && (
                                                                                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{log.payload.info}</p>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </m.div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </m.div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-3xl p-10 text-center space-y-3">
                                        <div className="w-16 h-16 bg-emerald-100/50 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-navy-950">All students are in Telegram! 🎉</h3>
                                        <p className="text-sm text-navy-700/60 max-w-md mx-auto">
                                            Every student who has paid has successfully joined their respective Telegram cohort groups. Excellent tracking!
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-8 bg-gold-50/30 border border-gold-100/50 rounded-3xl">
                                            <h4 className="font-bold text-navy-900 mb-2 flex items-center gap-2">
                                                <Clock className="text-gold-600" size={18} />
                                                Recover Links
                                            </h4>
                                            <p className="text-sm text-navy-700/70 leading-relaxed">
                                                If a student lost their invitation, search for their email to copy their unique payment link again.
                                            </p>
                                        </div>
                                        <div className="p-8 bg-navy-50/30 border border-navy-100/50 rounded-3xl">
                                            <h4 className="font-bold text-navy-900 mb-2 flex items-center gap-2">
                                                <CheckCircle2 className="text-navy-600" size={18} />
                                                Verify Enrollment
                                            </h4>
                                            <p className="text-sm text-navy-700/70 leading-relaxed">
                                                Quickly check which batch a student is enrolled in without digging through individual cohort logs.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </AnimatePresence>
            </div>

            {/* Manual Invite & Enrollment Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <m.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-navy-900 text-gold-400 rounded-xl flex items-center justify-center shadow-md">
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-navy-900 text-lg leading-tight">Manual Invite & Enrollment</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Generate Telegram Invite Link</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsInviteModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded-full transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                            {inviteError && (
                                <div className="bg-red-50 text-red-700 border border-red-100 rounded-2xl p-4 flex gap-3 text-sm">
                                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                                    <p className="font-medium">{inviteError}</p>
                                </div>
                            )}

                            {generatedLink ? (
                                <m.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl p-6 text-center space-y-4">
                                        <CheckCircle2 className="mx-auto text-emerald-600" size={40} />
                                        <div>
                                            <h4 className="font-bold text-lg">Telegram Link Generated!</h4>
                                            <p className="text-xs text-emerald-700/80 mt-1">This link is single-use and will expire in {inviteExpireHours} hours.</p>
                                        </div>

                                        <div className="flex items-center gap-2 bg-white border border-emerald-100 rounded-xl p-3 select-all">
                                            <LinkIcon size={16} className="text-emerald-500 shrink-0" />
                                            <span className="text-xs font-mono font-bold text-slate-800 truncate flex-grow text-left">{generatedLink}</span>
                                            <button
                                                onClick={() => copyToClipboard(generatedLink, 'modal_link')}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${copiedId === 'modal_link'
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                                    }`}
                                            >
                                                {copiedId === 'modal_link' ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>

                                    {recordEnrollment && (
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-slate-600 text-xs space-y-2">
                                            <p className="font-bold text-navy-900 mb-1">Database Update Status:</p>
                                            <div className="flex items-center gap-2 text-emerald-700 font-medium">
                                                <CheckCircle2 size={14} /> Recorded paid student in database
                                            </div>
                                            <p className="text-slate-400">
                                                The student ({inviteName}) is now registered for the cohort and will appear in search results under payment type <span className="font-bold">direct_payment</span>.
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-4 flex gap-3">
                                        <a
                                            href={generatedLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-navy-900 text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <ExternalLink size={14} /> Open Link
                                        </a>
                                        <button
                                            onClick={() => {
                                                setGeneratedLink('');
                                                setInviteName('');
                                                setInviteEmail('');
                                                setInvitePhone('');
                                            }}
                                            className="flex-1 py-3 px-4 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-navy-800 transition-all"
                                        >
                                            Generate Another
                                        </button>
                                    </div>
                                </m.div>
                            ) : (
                                <form onSubmit={handleGenerateInvite} className="space-y-5">
                                    {/* Cohort Select */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Cohort / Batch</label>
                                        <select
                                            value={inviteCohortId}
                                            onChange={e => setInviteCohortId(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-gold-500 rounded-xl text-sm font-semibold transition-all outline-none"
                                            required
                                        >
                                            <option value="">Select a Cohort...</option>
                                            {cohorts.map(c => (
                                                <option key={c.id} value={c.id}>{c.title} ({c.telegram_chat_id ? 'Has Chat ID' : 'Missing Chat ID'})</option>
                                            ))}
                                            <option value="custom">Custom Chat ID (Standalone Group)...</option>
                                        </select>
                                    </div>

                                    {/* Custom Chat ID Input */}
                                    {inviteCohortId === 'custom' && (
                                        <m.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-1.5"
                                        >
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telegram Chat ID (with -100 prefix)</label>
                                            <input
                                                type="text"
                                                value={inviteCustomChatId}
                                                onChange={e => setInviteCustomChatId(e.target.value)}
                                                placeholder="e.g. -1001890349357"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-gold-500 rounded-xl text-sm font-mono transition-all outline-none"
                                                required={inviteCohortId === 'custom'}
                                            />
                                        </m.div>
                                    )}

                                    {/* Expiration Select */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invite Link Validity</label>
                                        <select
                                            value={inviteExpireHours}
                                            onChange={e => setInviteExpireHours(Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-gold-500 rounded-xl text-sm transition-all outline-none"
                                        >
                                            <option value="1">1 Hour</option>
                                            <option value="12">12 Hours</option>
                                            <option value="24">24 Hours (1 Day)</option>
                                            <option value="48">48 Hours (2 Days)</option>
                                            <option value="168">168 Hours (7 Days)</option>
                                        </select>
                                    </div>

                                    {/* Student Enrollment Option */}
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <input
                                            type="checkbox"
                                            id="recordEnrollment"
                                            checked={recordEnrollment}
                                            onChange={e => setRecordEnrollment(e.target.checked)}
                                            className="h-5 w-5 rounded border-slate-300 text-gold-600 focus:ring-gold-500 cursor-pointer"
                                        />
                                        <label htmlFor="recordEnrollment" className="text-xs text-navy-900 cursor-pointer select-none">
                                            <span className="font-bold block">Record as Paid Enrollment</span>
                                            <span className="text-[10px] text-slate-400 block mt-0.5">Logs the student details and registers them in the database for tracking.</span>
                                        </label>
                                    </div>

                                    {/* Student Details */}
                                    {recordEnrollment && (
                                        <m.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="space-y-4 pt-2 border-t border-slate-100"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Name</label>
                                                    <input
                                                        type="text"
                                                        value={inviteName}
                                                        onChange={e => setInviteName(e.target.value)}
                                                        placeholder="e.g. Aditi Sharma"
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-gold-500 rounded-xl text-sm font-semibold transition-all outline-none"
                                                        required={recordEnrollment}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address <span className="text-slate-400 normal-case font-normal">(Optional)</span></label>
                                                    <input
                                                        type="email"
                                                        value={inviteEmail}
                                                        onChange={e => setInviteEmail(e.target.value)}
                                                        placeholder="e.g. aditi@gmail.com"
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-gold-500 rounded-xl text-sm transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone Number <span className="text-slate-400 normal-case font-normal">(Optional)</span></label>
                                                    <input
                                                        type="tel"
                                                        value={invitePhone}
                                                        onChange={e => setInvitePhone(e.target.value)}
                                                        placeholder="e.g. +91 98765 43210"
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-gold-500 rounded-xl text-sm transition-all outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount Paid (₹) <span className="text-slate-400 normal-case font-normal">(Optional)</span></label>
                                                    <input
                                                        type="number"
                                                        value={inviteAmount}
                                                        onChange={e => setInviteAmount(e.target.value)}
                                                        placeholder="e.g. 5000"
                                                        min="0"
                                                        step="1"
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-gold-500 rounded-xl text-sm transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </m.div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsInviteModalOpen(false)}
                                            className="px-5 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={inviteLoading}
                                            className="bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-50 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                                        >
                                            {inviteLoading ? (
                                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <>Generate Invite Link</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </m.div>
                </div>
            )}
        </div>
    );
}

