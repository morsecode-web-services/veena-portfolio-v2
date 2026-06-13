'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    User, Mail, Phone, Calendar, ArrowLeft, RefreshCw, 
    CheckCircle2, Clock, AlertCircle, Copy, ExternalLink, 
    CreditCard, Award, MessageSquare, History, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

interface StudentProfile {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    created_at: string;
}

interface Enrollment {
    id: string;
    cohort_id: string;
    status: 'active' | 'completed' | 'cancelled';
    telegram_joined: boolean;
    telegram_username: string | null;
    telegram_invite_link: string | null;
    created_at: string;
    cohorts: {
        title: string;
        price: number;
        month_name: string;
    } | null;
}

interface Payment {
    id: string;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    razorpay_payment_link_id: string | null;
    razorpay_subscription_id: string | null;
    amount: number;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    created_at: string;
    enrollments: {
        cohorts: {
            title: string;
        } | null;
    } | null;
}

interface ReenrollmentInvitation {
    id: string;
    payment_link_url: string | null;
    status: 'pending' | 'sent' | 'failed' | 'paid';
    error_message: string | null;
    created_at: string;
    cohorts: {
        title: string;
    } | null;
}

interface TelegramLog {
    id: string;
    action: string;
    invite_link: string | null;
    telegram_username: string | null;
    created_by: string;
    payload: any;
    created_at: string;
    enrollments: {
        cohorts: {
            title: string;
        } | null;
    } | null;
}

const formatDateSafe = (dateStr: string | null | undefined, includeTime = false) => {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'N/A';
        return format(d, includeTime ? 'MMM d, yyyy h:mm a' : 'MMM d, yyyy');
    } catch {
        return 'N/A';
    }
};

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { addToast } = useToast();
    const studentId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [invitations, setInvitations] = useState<ReenrollmentInvitation[]>([]);
    const [logs, setLogs] = useState<TelegramLog[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            if (studentError || !studentData) throw new Error('Student not found');
            setStudent(studentData);

            const { data: enrollmentsData } = await supabase
                .from('enrollments')
                .select('*, cohorts(title, price, month_name)')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });
            const fetchedEnrollments = enrollmentsData || [];
            setEnrollments(fetchedEnrollments);

            const { data: paymentsData } = await supabase
                .from('payments')
                .select('*, enrollments(cohorts(title))')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });
            setPayments(paymentsData || []);

            const { data: invitationsData } = await supabase
                .from('reenrollment_invitations')
                .select('*, cohorts:target_cohort_id(title)')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });
            setInvitations(invitationsData || []);

            if (fetchedEnrollments.length > 0) {
                const enrollmentIds = fetchedEnrollments.map(e => e.id);
                const { data: logsData } = await supabase
                    .from('telegram_invite_logs')
                    .select('*, enrollments(cohorts(title))')
                    .in('enrollment_id', enrollmentIds)
                    .order('created_at', { ascending: false });
                setLogs(logsData || []);
            } else {
                setLogs([]);
            }
        } catch (err: any) {
            addToast(err.message || 'Failed to load student profile', 'error');
            router.push('/admin/students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentId) fetchData();
    }, [studentId]);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        addToast('Copied to clipboard!', 'success');
    };

    const handleToggleTelegramJoin = async (enrollmentId: string, currentJoined: boolean) => {
        setActionLoadingId(enrollmentId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let telegramUsername = '';
            if (!currentJoined) {
                const input = prompt('Enter Telegram username (optional):');
                if (input === null) return;
                telegramUsername = input.trim();
            }
            const res = await fetch('/api/admin/telegram/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
                body: JSON.stringify({ submissionId: enrollmentId, telegramJoined: !currentJoined, telegramUsername: telegramUsername || null })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update status');
            addToast(currentJoined ? 'Marked Telegram as Left.' : 'Marked Telegram as Joined!', 'success');
            fetchData();
        } catch (err: any) {
            addToast(err.message || 'Failed to update status', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleSendReminder = async (enrollmentId: string) => {
        setActionLoadingId(enrollmentId + '_remind');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/telegram/remind', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
                body: JSON.stringify({ submissionId: enrollmentId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send reminder email');
            addToast('Reminder email successfully sent!', 'success');
            fetchData();
        } catch (err: any) {
            addToast(err.message || 'Failed to send reminder email', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRegenerateLink = async (enrollmentId: string) => {
        setActionLoadingId(enrollmentId + '_regen');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/telegram/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
                body: JSON.stringify({ submissionId: enrollmentId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to regenerate link');
            addToast('Telegram invite link regenerated successfully!', 'success');
            fetchData();
        } catch (err: any) {
            addToast(err.message || 'Failed to regenerate link', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    const getStatusStyles = (status: string) => {
        if (status === 'paid' || status === 'active' || status === 'success')
            return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (status === 'sent' || status === 'pending')
            return 'bg-blue-50 text-blue-700 border-blue-100';
        if (status === 'failed' || status === 'cancelled')
            return 'bg-red-50 text-red-700 border-red-100';
        return 'bg-slate-100 text-slate-600 border-slate-200';
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin mb-3" />
            <span className="text-xs font-bold uppercase tracking-wider">Loading student profile...</span>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Back link */}
            <div>
                <Link
                    href="/admin/students"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft size={14} /> Back to Student Registry
                </Link>
            </div>

            {/* Student Header */}
            {student && (
                <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded flex items-center justify-center text-sm font-bold">
                            {student.name[0].toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900">{student.name}</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">ID: {student.id}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 w-full md:w-auto">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded">
                            <Mail size={13} className="text-slate-400 shrink-0" />
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Email</div>
                                <div className="text-xs font-semibold text-slate-800">{student.email}</div>
                            </div>
                        </div>
                        {student.phone && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded">
                                <Phone size={13} className="text-slate-400 shrink-0" />
                                <div>
                                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Phone</div>
                                    <div className="text-xs font-semibold text-slate-800">{student.phone}</div>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded">
                            <Calendar size={13} className="text-slate-400 shrink-0" />
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Enrolled Since</div>
                                <div className="text-xs font-semibold text-slate-800">{formatDateSafe(student.created_at)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Enrollments + Payments */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Enrollments */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Award size={13} className="text-slate-400" /> Enrollments &amp; Access
                            </h3>
                            <span className="bg-slate-900 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                                {enrollments.length} total
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {enrollments.length === 0 ? (
                                <p className="text-xs text-slate-400 italic p-8 text-center">No enrollments found for this student.</p>
                            ) : (
                                enrollments.map((enrollment) => (
                                    <div key={enrollment.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-slate-800 text-sm">{enrollment.cohorts?.title || 'Unknown Cohort'}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getStatusStyles(enrollment.status)}`}>
                                                        {enrollment.status}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-medium">
                                                    <span className="flex items-center gap-1"><Clock size={10} /> {formatDateSafe(enrollment.created_at)}</span>
                                                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight">
                                                        {enrollment.cohorts?.month_name || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Telegram Controls */}
                                            <div className="flex flex-wrap items-center gap-1.5 self-start">
                                                <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                                                    enrollment.telegram_joined
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                    {enrollment.telegram_joined ? (
                                                        <><CheckCircle2 size={10} /> Joined{enrollment.telegram_username ? ` (${enrollment.telegram_username})` : ''}</>
                                                    ) : (
                                                        <><AlertCircle size={10} /> Not Joined</>
                                                    )}
                                                </span>

                                                <div className="flex items-center gap-0.5 bg-slate-50 border border-slate-200 rounded p-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleTelegramJoin(enrollment.id, enrollment.telegram_joined)}
                                                        disabled={actionLoadingId !== null}
                                                        className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                                                            enrollment.telegram_joined
                                                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                                : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                                                        }`}
                                                        title={enrollment.telegram_joined ? 'Mark as Left' : 'Mark as Joined'}
                                                    >
                                                        {actionLoadingId === enrollment.id ? (
                                                            <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 size={13} />
                                                        )}
                                                    </button>

                                                    {!enrollment.telegram_joined && enrollment.telegram_invite_link && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(enrollment.telegram_invite_link!, 'link_' + enrollment.id)}
                                                                className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                                                                    copiedId === 'link_' + enrollment.id ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                                                                }`}
                                                                title="Copy Telegram Link"
                                                            >
                                                                {copiedId === 'link_' + enrollment.id ? <Check size={13} /> : <Copy size={13} />}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleSendReminder(enrollment.id)}
                                                                disabled={actionLoadingId !== null}
                                                                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-all"
                                                                title="Email Invite Link"
                                                            >
                                                                {actionLoadingId === enrollment.id + '_remind' ? (
                                                                    <div className="h-3 w-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <Mail size={13} />
                                                                )}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleRegenerateLink(enrollment.id)}
                                                                disabled={actionLoadingId !== null}
                                                                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                                                                title="Regenerate Invite Link"
                                                            >
                                                                {actionLoadingId === enrollment.id + '_regen' ? (
                                                                    <div className="h-3 w-3 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <RefreshCw size={13} />
                                                                )}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Invite Link bar */}
                                        {!enrollment.telegram_joined && enrollment.telegram_invite_link && (
                                            <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between gap-3">
                                                <span className="text-[10px] font-mono text-slate-400 truncate">{enrollment.telegram_invite_link}</span>
                                                <a
                                                    href={enrollment.telegram_invite_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors shrink-0"
                                                >
                                                    Open <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Payments */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center gap-1.5">
                            <CreditCard size={13} className="text-slate-400" />
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Payment Ledger</h3>
                        </div>
                        {payments.length === 0 ? (
                            <p className="text-xs text-slate-400 italic p-8 text-center">No payment records found for this student.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="px-5 py-3">Transaction / Date</th>
                                            <th className="px-5 py-3">Cohort</th>
                                            <th className="px-5 py-3">Amount</th>
                                            <th className="px-5 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3 space-y-0.5">
                                                    <div className="font-bold text-slate-800 truncate max-w-[160px] font-mono text-[10px]" title={payment.razorpay_payment_id || ''}>
                                                        {payment.razorpay_payment_id || 'Direct / Manual'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                                        <Clock size={9} /> {formatDateSafe(payment.created_at, true)}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-slate-500">
                                                    {payment.enrollments?.cohorts?.title || '—'}
                                                </td>
                                                <td className="px-5 py-3 font-bold text-slate-800">
                                                    ₹{((payment.amount || 0) / 100).toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getStatusStyles(payment.status)}`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Re-enrollment Invitations */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center gap-1.5">
                            <Mail size={13} className="text-slate-400" />
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Re-enrollment Invites</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            {invitations.length === 0 ? (
                                <p className="text-xs text-slate-400 italic text-center py-3">No re-enrollment invitations sent yet.</p>
                            ) : (
                                invitations.map((invite) => (
                                    <div key={invite.id} className="pb-3 last:pb-0 border-b border-slate-100 last:border-b-0 space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-slate-800 truncate">{invite.cohorts?.title}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${getStatusStyles(invite.status)}`}>
                                                {invite.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                                            <span>Sent: {formatDateSafe(invite.created_at)}</span>
                                            {invite.payment_link_url && (
                                                <button
                                                    onClick={() => copyToClipboard(invite.payment_link_url!, 'invite_' + invite.id)}
                                                    className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 font-bold uppercase tracking-tight"
                                                >
                                                    Copy Link <Copy size={9} />
                                                </button>
                                            )}
                                        </div>
                                        {invite.error_message && (
                                            <p className="text-[9px] text-red-500 italic bg-red-50 border border-red-100 rounded p-1.5">
                                                Error: {invite.error_message}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Support Timeline */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center gap-1.5">
                            <History size={13} className="text-slate-400" />
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Activity Timeline</h3>
                        </div>
                        <div className="p-4">
                            {logs.length === 0 ? (
                                <p className="text-xs text-slate-400 italic text-center py-3">No activity logs available.</p>
                            ) : (
                                <div className="relative pl-4 border-l-2 border-slate-100 space-y-5 ml-1">
                                    {logs.map((log) => {
                                        let actionLabel = log.action;
                                        let dotColor = 'border-slate-300 bg-slate-50';

                                        if (log.action === 'created') { actionLabel = 'Invite Created'; dotColor = 'border-blue-400 bg-blue-50'; }
                                        else if (log.action === 'regenerated') { actionLabel = 'Invite Regenerated'; dotColor = 'border-amber-400 bg-amber-50'; }
                                        else if (log.action === 'reminded') { actionLabel = 'Reminder Sent'; dotColor = 'border-violet-400 bg-violet-50'; }
                                        else if (log.action === 'joined') { actionLabel = 'Telegram Joined'; dotColor = 'border-emerald-400 bg-emerald-50'; }
                                        else if (log.action === 'left') { actionLabel = 'Telegram Left'; dotColor = 'border-red-400 bg-red-50'; }

                                        return (
                                            <div key={log.id} className="relative space-y-0.5">
                                                <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 bg-white ${dotColor}`} />
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold text-slate-800">{actionLabel}</span>
                                                    <span className="text-[9px] text-slate-400">{formatDateSafe(log.created_at, true)}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 leading-snug">
                                                    {log.payload?.info || `For cohort: ${log.enrollments?.cohorts?.title}`}
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                    By: {log.created_by}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
