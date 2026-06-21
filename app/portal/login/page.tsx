'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function LoginContent() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (searchParams.get('error') === 'auth_failed') {
            setStatus('error');
            const msg = searchParams.get('msg');
            setErrorMessage(msg ? `Authentication Error: ${msg}` : 'Your login link has expired or is invalid. Please request a new one.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || status === 'loading') return;

        setStatus('loading');
        setErrorMessage('');

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setStatus('error');
            setErrorMessage(error.message || 'Failed to send login email. Please try again.');
        } else {
            setStatus('sent');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-navy-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L15.5 9H21L16.5 13.5L18.5 21L12 17.5L5.5 21L7.5 13.5L3 9H8.5L12 2Z" fill="white" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Student Portal</h1>
                    <p className="text-slate-400 text-sm mt-1">Access your enrolled courses</p>
                </div>

                <AnimatePresence mode="wait">
                    {status === 'sent' ? (
                        <motion.div
                            key="sent"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center"
                        >
                            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Check your inbox ✉️</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                We&apos;ve sent a magic login link to <span className="text-white font-medium">{email}</span>.
                                Click the link in the email to sign in. The link expires in 1 hour.
                            </p>
                            <button
                                onClick={() => { setStatus('idle'); setEmail(''); }}
                                className="mt-6 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                Use a different email
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
                                <h2 className="text-lg font-semibold text-white mb-1">Sign in</h2>
                                <p className="text-slate-400 text-sm mb-6">
                                    Enter the email address you used to enroll. We&apos;ll send you a secure login link — no password needed.
                                </p>

                                {status === 'error' && (
                                    <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-red-300 text-xs">{errorMessage}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="email"
                                            id="portal-email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            required
                                            className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading' || !email}
                                        className="w-full bg-white text-slate-900 rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {status === 'loading' ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Sending link...</>
                                        ) : (
                                            <>Send Magic Link <ArrowRight className="w-4 h-4" /></>
                                        )}
                                    </button>
                                </form>
                            </div>
                            <p className="text-center text-xs text-slate-600 mt-4">
                                Only enrolled students can access the portal.{' '}
                                <a href="/cohorts" className="text-slate-400 hover:text-white transition-colors">Browse cohorts →</a>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function PortalLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-navy-950 to-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
