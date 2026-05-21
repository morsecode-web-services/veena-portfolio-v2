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
    Users
} from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface StudentCohort {
    id: string;
    title: string;
    type: 'enrollment' | 'invitation';
    status: string;
    date: string;
    link: string | null;
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
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<StudentResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

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

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-serif font-bold text-navy-950">Student Support</h1>
                <p className="text-navy-400 text-sm">Search across all batches and invitations to resolve student queries instantly.</p>
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
                                className="bg-white border border-slate-100 rounded-3xl shadow-premium overflow-hidden"
                            >
                                {/* Student Header */}
                                <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-100">
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
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                                                    copiedId === student.email ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-navy-900 hover:text-navy-900'
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
                                    {student.cohorts.map((cohort) => (
                                        <div key={cohort.id + cohort.type} className="p-6 md:px-8 hover:bg-slate-50/30 transition-colors">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2 h-2 rounded-full ${cohort.type === 'enrollment' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className="font-bold text-navy-900 truncate">{cohort.title}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(cohort.status, cohort.type)}`}>
                                                                {cohort.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDateSafe(cohort.date)}</span>
                                                            <span className="font-bold uppercase tracking-tighter text-[9px]">
                                                                {cohort.type === 'enrollment' ? 'Confirmed Student' : 'Invitation Link Sent'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 self-end md:self-center">
                                                    {cohort.link ? (
                                                        <button
                                                            onClick={() => copyToClipboard(cohort.link!, cohort.id + cohort.type)}
                                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                copiedId === (cohort.id + cohort.type)
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                                                            }`}
                                                        >
                                                            {copiedId === (cohort.id + cohort.type) ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                                                            {copiedId === (cohort.id + cohort.type) ? 'Copied' : 'Copy Payment Link'}
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                            <CheckCircle2 size={12} />
                                                            Fully Enrolled
                                                        </div>
                                                    )}
                                                    <ChevronRight size={16} className="text-slate-200 hidden md:block" />
                                                </div>
                                            </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
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
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    );
}
