'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Search, User, Mail, Phone, ExternalLink, Copy, CheckCircle2,
    Clock, AlertCircle, Plus, X, RefreshCw, Send, Check
} from 'lucide-react';
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
    telegram_display_name?: string | null;
    amount?: number | null;
}

interface StudentResult {
    id: string;
    student_id?: string;
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
    
    // Tab State: 'pending' (default) or 'all' (search registry)
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
    
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<StudentResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Cohorts list for dropdown
    const [cohorts, setCohorts] = useState<any[]>([]);

    // Quick Stats state
    const [stats, setStats] = useState({
        activeEnrollments: 0,
        pendingTelegram: 0,
        totalInvitations: 0
    });

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
    const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

    // Fetch Cohorts for drop-down selection
    useEffect(() => {
        const fetchCohortsData = async () => {
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
        fetchCohortsData();
    }, []);

    // Fetch Live Dashboard Aggregates
    const fetchDashboardStats = useCallback(async () => {
        try {
            const { count: activeCount } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            const { count: unjoinedCount } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active')
                .eq('telegram_joined', false);

            const { count: inviteCount } = await supabase
                .from('reenrollment_invitations')
                .select('*', { count: 'exact', head: true });

            setStats({
                activeEnrollments: activeCount || 0,
                pendingTelegram: unjoinedCount || 0,
                totalInvitations: inviteCount || 0
            });
        } catch (err) {
            console.error('Stats aggregation failed:', err);
        }
    }, []);

    // Fetch Unjoined Students (Pending Telegram tab)
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

    // Fetch stats and unjoined on load
    useEffect(() => {
        fetchDashboardStats();
        fetchUnjoinedStudents();
    }, [fetchDashboardStats, fetchUnjoinedStudents]);

    // Perform Search (Registry tab)
    const performSearch = useCallback(async () => {
        if (query.length < 2) return;
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

    // Live search debounce
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
        addToast('Copied to clipboard!', 'success');
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

            // Refresh dashboards
            fetchDashboardStats();
            fetchUnjoinedStudents();
            if (query) performSearch();
        } catch (err: any) {
            setInviteError(err.message || 'Something went wrong');
            addToast(err.message || 'Failed to generate invite', 'error');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleToggleTelegramJoin = async (submissionId: string, currentJoined: boolean) => {
        setToggleLoadingId(submissionId);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            let telegramUsername = '';
            if (!currentJoined) {
                const input = prompt("Enter Telegram username/display name (optional):");
                if (input === null) return;
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
            
            fetchDashboardStats();
            fetchUnjoinedStudents();
            if (query) performSearch();
        } catch (err: any) {
            addToast(err.message || 'Failed to update join status', 'error');
        } finally {
            setToggleLoadingId(null);
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
            
            fetchDashboardStats();
            fetchUnjoinedStudents();
            if (query) performSearch();
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
            
            fetchDashboardStats();
            fetchUnjoinedStudents();
            if (query) performSearch();
        } catch (err: any) {
            addToast(err.message || 'Failed to regenerate link', 'error');
        } finally {
            setRegenerateLoadingId(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Student Support</h1>
                    <p className="text-slate-500 text-xs mt-0.5">Manage cohort access keys, reminders, and community onboarding.</p>
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
                    className="bg-slate-900 text-white hover:bg-slate-800 px-4.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                    <Plus size={14} /> Manual Invite
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Enrollments</span>
                    <span className="text-xl font-bold text-slate-800 block mt-1">{stats.activeEnrollments}</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Telegram Joins</span>
                    <span className={`text-xl font-bold block mt-1 ${stats.pendingTelegram > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                        {stats.pendingTelegram}
                    </span>
                </div>
            </div>

            {/* Tabs & Search controls */}
            <div className="flex flex-col gap-4 border-b border-slate-200">
                <div className="flex gap-6">
                    <button
                        onClick={() => {
                            setActiveTab('pending');
                            setQuery('');
                            setResults([]);
                        }}
                        className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all relative ${
                            activeTab === 'pending'
                                ? 'border-slate-900 text-slate-950'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Pending Telegram Joins
                        {stats.pendingTelegram > 0 && (
                            <span className="ml-2 bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                                {stats.pendingTelegram}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('all');
                        }}
                        className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                            activeTab === 'all'
                                ? 'border-slate-900 text-slate-950'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Student Registry
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-4">
                {activeTab === 'all' ? (
                    <div className="space-y-4">
                        {/* Registry Search */}
                        <div className="relative max-w-xl">
                            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search student registry by name or email..."
                                className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-xs focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                            {loading && (
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                    <div className="h-3.5 w-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        {/* Search Results Table */}
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            {results.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                <th className="px-5 py-3.5 w-12"></th>
                                                <th className="px-5 py-3.5">Student Details</th>
                                                <th className="px-5 py-3.5">Enrolled Cohorts</th>
                                                <th className="px-5 py-3.5 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs">
                                            {results.map((student) => (
                                                <tr key={student.email} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3">
                                                        {student.student_id ? (
                                                            <Link href={`/admin/students/${student.student_id}`} target="_blank">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer border border-slate-200">
                                                                    <User size={14} />
                                                                </div>
                                                            </Link>
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                                                <User size={14} />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="font-semibold text-slate-800">
                                                            {student.student_id ? (
                                                                <Link 
                                                                    href={`/admin/students/${student.student_id}`}
                                                                    className="hover:underline font-bold"
                                                                    target="_blank"
                                                                >
                                                                    {student.name}
                                                                </Link>
                                                            ) : (
                                                                <span>{student.name}</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                                                            <div className="flex items-center gap-1"><Mail size={10} /> {student.email}</div>
                                                            {student.phone && <div className="flex items-center gap-1"><Phone size={10} /> {student.phone}</div>}
                                                            {(() => {
                                                                const tgCohort = student.cohorts.find(c => c.telegram_username || c.telegram_display_name);
                                                                if (!tgCohort) return null;
                                                                const username = tgCohort.telegram_username ? `@${tgCohort.telegram_username.replace('@', '')}` : '';
                                                                const displayName = tgCohort.telegram_display_name || '';
                                                                const displayText = displayName && username ? `${displayName} (${username})` : displayName || username;
                                                                return (
                                                                    <div className="flex items-center gap-1 text-sky-500">
                                                                        <Send size={10} className="-ml-0.5 rotate-[-45deg] mt-0.5" />
                                                                        <span>{displayText}</span>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex flex-col gap-1.5">
                                                            {student.cohorts.map((cohort) => {
                                                                const copyId = `registry_link_${cohort.id}_${cohort.type}`;
                                                                return (
                                                                    <div key={cohort.id + cohort.type} className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="font-medium text-slate-700">{cohort.title}</span>
                                                                        <span className={`px-1.5 py-0.5 text-[8px] font-bold border rounded uppercase tracking-wider ${
                                                                            cohort.type === 'enrollment'
                                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                                                        }`}>
                                                                            {cohort.type === 'enrollment' ? 'Paid' : 'Invite'}
                                                                        </span>
                                                                        {cohort.link && (
                                                                            <button
                                                                                onClick={() => copyToClipboard(cohort.link!, copyId)}
                                                                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold border rounded transition-colors ${
                                                                                    copiedId === copyId
                                                                                        ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                                                                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                                                                }`}
                                                                                title={cohort.type === 'enrollment' ? 'Copy Telegram Invite Link' : 'Copy Razorpay Payment Link'}
                                                                            >
                                                                                {copiedId === copyId ? <Check size={8} /> : <Copy size={8} />}
                                                                                {copiedId === copyId ? 'Copied' : (cohort.type === 'enrollment' ? 'Copy Invite' : 'Copy Pay Link')}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        {student.student_id ? (
                                                            <Link 
                                                                href={`/admin/students/${student.student_id}`}
                                                                className="text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1 text-[11px]"
                                                                target="_blank"
                                                            >
                                                                View Profile →
                                                            </Link>
                                                        ) : (
                                                            <span className="text-slate-400 italic">No details</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : query.length >= 2 && !loading ? (
                                <div className="p-8 text-center text-slate-400">
                                    <AlertCircle className="h-5 w-5 mx-auto mb-2 text-slate-300" />
                                    <p className="font-semibold text-xs text-slate-800">No students found matching &quot;{query}&quot;</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Double check the spelling or filter settings.</p>
                                </div>
                            ) : (
                                <div className="p-12 text-center text-slate-400">
                                    <Search className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Type at least 2 characters to search registry</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Pending Telegram Joins Tab */
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        {unjoinedLoading ? (
                            <div className="p-16 text-center">
                                <div className="h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-2.5"></div>
                                <p className="text-xs text-slate-400">Loading pending joins...</p>
                            </div>
                        ) : unjoinedResults.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            <th className="px-5 py-3.5 w-12"></th>
                                            <th className="px-5 py-3.5">Student</th>
                                            <th className="px-5 py-3.5">Enrolled Cohort</th>
                                            <th className="px-5 py-3.5">Enrolled Date</th>
                                            <th className="px-5 py-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {unjoinedResults.map((student) => {
                                            // Since this is filtered by unjoined, there will be unjoined cohorts
                                            return student.cohorts.map((cohort) => {
                                                const copyId = `pending_link_${cohort.id}`;
                                                return (
                                                    <tr key={cohort.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-5 py-3">
                                                            {student.student_id ? (
                                                                <Link href={`/admin/students/${student.student_id}`} target="_blank">
                                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer border border-slate-200">
                                                                        <User size={14} />
                                                                    </div>
                                                                </Link>
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                                                    <User size={14} />
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <div className="font-semibold text-slate-800">
                                                                {student.student_id ? (
                                                                    <Link 
                                                                        href={`/admin/students/${student.student_id}`}
                                                                        className="hover:underline font-bold text-slate-900"
                                                                        target="_blank"
                                                                    >
                                                                        {student.name}
                                                                    </Link>
                                                                ) : (
                                                                    <span>{student.name}</span>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                                                                <div className="flex items-center gap-1"><Mail size={10} /> {student.email}</div>
                                                                {student.phone && <div className="flex items-center gap-1"><Phone size={10} /> {student.phone}</div>}
                                                                {(() => {
                                                                    const tgCohort = student.cohorts.find(c => c.telegram_username || c.telegram_display_name);
                                                                    if (!tgCohort) return null;
                                                                    const username = tgCohort.telegram_username ? `@${tgCohort.telegram_username.replace('@', '')}` : '';
                                                                    const displayName = tgCohort.telegram_display_name || '';
                                                                    const displayText = displayName && username ? `${displayName} (${username})` : displayName || username;
                                                                    return (
                                                                        <div className="flex items-center gap-1 text-sky-500">
                                                                            <Send size={10} className="-ml-0.5 rotate-[-45deg] mt-0.5" />
                                                                            <span>{displayText}</span>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className="font-semibold text-slate-700">{cohort.title}</span>
                                                            <span className="ml-2 text-[9px] bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded font-medium uppercase">Not Joined</span>
                                                        </td>
                                                        <td className="px-5 py-3 text-slate-500">
                                                            {formatDateSafe(cohort.date)}
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                {/* Copy Invite Link */}
                                                                {cohort.link ? (
                                                                    <button
                                                                        onClick={() => copyToClipboard(cohort.link!, copyId)}
                                                                        className={`px-2.5 py-1 rounded text-[10px] font-semibold border flex items-center gap-1 transition-colors ${
                                                                            copiedId === copyId
                                                                                ? 'bg-green-600 border-green-600 text-white'
                                                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-800 hover:text-slate-800'
                                                                        }`}
                                                                        title="Copy Telegram Invite Link"
                                                                    >
                                                                        {copiedId === copyId ? <Check size={10} /> : <Copy size={10} />}
                                                                        {copiedId === copyId ? 'Copied' : 'Copy link'}
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-400 italic mr-2">No link</span>
                                                                )}

                                                                {/* Remind Email */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSendReminder(cohort.id, student.email)}
                                                                    disabled={remindLoadingId === cohort.id}
                                                                    className="w-7 h-7 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors disabled:opacity-40"
                                                                    title="Send Email Reminder"
                                                                >
                                                                    {remindLoadingId === cohort.id ? (
                                                                        <div className="h-3 w-3 border-2 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
                                                                    ) : (
                                                                        <Mail size={12} />
                                                                    )}
                                                                </button>

                                                                {/* Regenerate Link */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRegenerateLink(cohort.id)}
                                                                    disabled={regenerateLoadingId === cohort.id}
                                                                    className="w-7 h-7 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors disabled:opacity-40"
                                                                    title="Regenerate Invite Link"
                                                                >
                                                                    {regenerateLoadingId === cohort.id ? (
                                                                        <div className="h-3 w-3 border-2 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
                                                                    ) : (
                                                                        <RefreshCw size={12} />
                                                                    )}
                                                                </button>

                                                                {/* Toggle Joined Status */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleTelegramJoin(cohort.id, false)}
                                                                    disabled={toggleLoadingId === cohort.id}
                                                                    className="w-7 h-7 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-emerald-700 flex items-center justify-center transition-colors"
                                                                    title="Mark Telegram as Joined"
                                                                >
                                                                    {toggleLoadingId === cohort.id ? (
                                                                        <div className="h-3 w-3 border-2 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
                                                                    ) : (
                                                                        <CheckCircle2 size={12} />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-500 bg-slate-50/50">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                                <p className="text-xs font-semibold text-slate-800">All students are in Telegram! 🎉</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Every active student has successfully joined the Telegram group for their cohort.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Manual Invite & Enrollment Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
                        {/* Modal Header */}
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Manual Invite & Enrollment</h3>
                            </div>
                            <button
                                onClick={() => setIsInviteModalOpen(false)}
                                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {inviteError && (
                                <div className="bg-red-50 text-red-700 border border-red-100 rounded p-3 flex gap-2 text-xs">
                                    <AlertCircle className="shrink-0 mt-0.5" size={14} />
                                    <p className="font-semibold">{inviteError}</p>
                                </div>
                            )}

                            {generatedLink ? (
                                <div className="space-y-4">
                                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded p-4 text-center space-y-2">
                                        <h4 className="font-bold text-xs">Telegram Link Generated!</h4>
                                        <p className="text-[10px] text-emerald-700/80">Expires in {inviteExpireHours} hours.</p>

                                        <div className="flex items-center gap-1.5 bg-white border border-emerald-100 rounded p-2 shadow-inner select-all">
                                            <span className="text-[10px] font-mono text-slate-700 truncate flex-grow text-left">{generatedLink}</span>
                                            <button
                                                onClick={() => copyToClipboard(generatedLink, 'modal_link')}
                                                className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-all ${copiedId === 'modal_link'
                                                        ? 'bg-green-600 border-green-600 text-white'
                                                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                                    }`}
                                            >
                                                {copiedId === 'modal_link' ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>

                                    {recordEnrollment && (
                                        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-slate-600 text-[10px]">
                                            <span className="font-bold text-slate-800 block">Database enrollment:</span>
                                            Registered {inviteName} under the selected cohort.
                                        </div>
                                    )}

                                    <div className="pt-1 flex gap-2">
                                        <a
                                            href={generatedLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-1.5 px-3 rounded border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 text-center flex items-center justify-center gap-1"
                                        >
                                            Open Link <ExternalLink size={12} />
                                        </a>
                                        <button
                                            onClick={() => {
                                                setGeneratedLink('');
                                                setInviteName('');
                                                setInviteEmail('');
                                                setInvitePhone('');
                                            }}
                                            className="flex-grow py-1.5 px-3 rounded bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                                        >
                                            Generate Another
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleGenerateInvite} className="space-y-4">
                                    {/* Cohort Select */}
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Cohort / Batch</label>
                                        <select
                                            value={inviteCohortId}
                                            onChange={e => setInviteCohortId(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold outline-none focus:border-slate-800"
                                            required
                                        >
                                            <option value="">Select a Cohort...</option>
                                            {cohorts.map(c => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                            ))}
                                            <option value="custom">Custom Standalone Chat ID...</option>
                                        </select>
                                    </div>

                                    {/* Custom Chat ID Input */}
                                    {inviteCohortId === 'custom' && (
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telegram Chat ID</label>
                                            <input
                                                type="text"
                                                value={inviteCustomChatId}
                                                onChange={e => setInviteCustomChatId(e.target.value)}
                                                placeholder="e.g. -1001890349357"
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800"
                                                required={inviteCohortId === 'custom'}
                                            />
                                        </div>
                                    )}

                                    {/* Expiration Select */}
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invite Validity</label>
                                        <select
                                            value={inviteExpireHours}
                                            onChange={e => setInviteExpireHours(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800"
                                        >
                                            <option value="1">1 Hour</option>
                                            <option value="12">12 Hours</option>
                                            <option value="24">24 Hours (1 Day)</option>
                                            <option value="48">48 Hours (2 Days)</option>
                                            <option value="168">168 Hours (7 Days)</option>
                                        </select>
                                    </div>

                                    {/* Student Enrollment Option */}
                                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded border border-slate-200">
                                        <input
                                            type="checkbox"
                                            id="recordEnrollment"
                                            checked={recordEnrollment}
                                            onChange={e => setRecordEnrollment(e.target.checked)}
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                        />
                                        <label htmlFor="recordEnrollment" className="text-[11px] text-slate-700 cursor-pointer select-none">
                                            <span className="font-bold block">Record as Paid Enrollment</span>
                                        </label>
                                    </div>

                                    {/* Student Details */}
                                    {recordEnrollment && (
                                        <div className="space-y-3 pt-2 border-t border-slate-200">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Name</label>
                                                    <input
                                                        type="text"
                                                        value={inviteName}
                                                        onChange={e => setInviteName(e.target.value)}
                                                        placeholder="Aditi Sharma"
                                                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800"
                                                        required={recordEnrollment}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                                                    <input
                                                        type="email"
                                                        value={inviteEmail}
                                                        onChange={e => setInviteEmail(e.target.value)}
                                                        placeholder="aditi@gmail.com"
                                                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        value={invitePhone}
                                                        onChange={e => setInvitePhone(e.target.value)}
                                                        placeholder="+91 98765 43210"
                                                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount Paid (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={inviteAmount}
                                                        onChange={e => setInviteAmount(e.target.value)}
                                                        placeholder="5000"
                                                        min="0"
                                                        step="1"
                                                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-slate-800"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsInviteModalOpen(false)}
                                            className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={inviteLoading}
                                            className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 px-3.5 py-1.5 rounded font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
                                        >
                                            {inviteLoading ? (
                                                <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <>Generate Invite</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
