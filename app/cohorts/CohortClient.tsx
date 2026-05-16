'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Lock, Users, Calendar, ArrowRight, X, Star, PartyPopper, Mail } from 'lucide-react';
import { Button } from '@/components/system/Button';
import DynamicForm, { FormField } from '@/components/features/DynamicForm';
import Image from 'next/image';
import { analytics, trackEvent } from '@/components/GoogleAnalytics';
import { useSearchParams, useRouter } from 'next/navigation';

interface Cohort {
    id: string;
    title: string;
    description: string;
    month_name: string;
    price: number;
    razorpay_plan_id: string;
    status: 'active' | 'coming_soon' | 'completed';
    telegram_chat_id: string;
    is_highlighted: boolean;
    image_url: string;
    original_price?: number;
    learning_outcomes?: string[];
    curriculum_highlights?: string[];
    registration_count?: number;
    success_message?: string;
}

interface CohortClientProps {
    initialCohorts: Cohort[];
}

function CohortContent({ initialCohorts }: CohortClientProps) {
    const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();

    const closeCelebration = useCallback(() => {
        setShowCelebration(false);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('success');
        const query = params.toString();
        router.replace(`/cohorts${query ? `?${query}` : ''}`, { scroll: false });
    }, [searchParams, router]);

    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            setShowCelebration(true);
            trackEvent('purchase_complete', { status: 'success' });

            // Auto-dismiss after 12 seconds
            const timer = setTimeout(() => {
                closeCelebration();
            }, 12000);

            return () => clearTimeout(timer);
        }
    }, [searchParams, closeCelebration]);

    const enrollmentFields: FormField[] = [
        { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name' },
        { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
        { name: 'phone', label: 'WhatsApp Number', type: 'tel', required: true, placeholder: 'Your WhatsApp number' },
    ];

    const handleEnroll = (cohort: Cohort) => {
        if (cohort.status !== 'active') return;
        setSelectedCohort(cohort);
        setIsModalOpen(true);

        trackEvent('view_item', {
            items: [{
                item_id: cohort.id,
                item_name: cohort.title,
                item_category: 'cohort',
                price: cohort.price / 100,
                currency: 'INR'
            }]
        });

        trackEvent('begin_checkout', {
            value: cohort.price / 100,
            currency: 'INR',
            items: [{
                item_id: cohort.id,
                item_name: cohort.title,
                item_category: 'cohort'
            }]
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount / 100);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {initialCohorts.map((cohort, index) => (
                    <motion.button
                        key={cohort.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => cohort.status === 'active' && handleEnroll(cohort)}
                        disabled={cohort.status !== 'active'}
                        className={`group relative bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all duration-500 text-left w-full outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-4 ${cohort.status === 'active' ? 'cursor-pointer hover:shadow-premium-xl hover:-translate-y-1' : 'opacity-75 cursor-not-allowed'
                            }`}
                    >
                        <div className="relative aspect-video overflow-hidden bg-slate-100">
                            {cohort.image_url ? (
                                <Image
                                    src={cohort.image_url}
                                    alt={cohort.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-navy-50/50">
                                    <div className="text-navy-200 font-serif italic text-xl">
                                        {cohort.month_name}
                                    </div>
                                </div>
                            )}

                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                                {cohort.is_highlighted && (
                                    <div className="bg-gold-400 text-navy-950 text-[10px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-wider">
                                        Recommended
                                    </div>
                                )}
                                <div className={`text-[10px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-wider ${cohort.status === 'active' ? 'bg-white text-navy-900' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                    {cohort.status === 'active' ? 'Enrollment Open' : 'Coming Soon'}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 flex flex-col">
                            <div className="flex-grow">
                                <h3 className="text-lg font-serif font-bold text-navy-900 leading-snug group-hover:text-gold-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                                    {cohort.title}
                                </h3>

                                <p className="text-xs text-slate-500 mt-1 mb-3">
                                    By Aishwarya Manikarnike
                                </p>

                                <div className="flex items-center gap-1.5 mb-4 text-slate-500">
                                    <Users size={12} className="text-slate-400" />
                                    <span className="text-xs font-medium">
                                        {cohort.registration_count && cohort.registration_count > 0
                                            ? `${cohort.registration_count} ${cohort.registration_count === 1 ? 'student' : 'students'} enrolled`
                                            : 'Be the first to join'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        {cohort.original_price && (
                                            <span className="text-[10px] text-slate-400 line-through leading-none decoration-red-200 italic">{formatCurrency(cohort.original_price)}</span>
                                        )}
                                        <span className="text-xl font-bold text-navy-900 tracking-tight">{formatCurrency(cohort.price)}</span>
                                    </div>

                                    <div className={`h-10 px-5 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center transition-all duration-300 ${cohort.status === 'active'
                                        ? 'bg-navy-900 text-white group-hover:bg-gold-600'
                                        : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {cohort.status === 'active' ? 'Enroll Now' : 'Stay Tuned'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {cohort.status === 'coming_soon' && (
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] pointer-events-none" />
                        )}
                    </motion.button>
                ))}
            </div>

            <AnimatePresence>
                {isModalOpen && selectedCohort && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-premium-xl overflow-hidden flex flex-col md:flex-row"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/80 backdrop-blur shadow-sm text-slate-400 hover:text-navy-900 transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="md:w-[38%] p-8 bg-slate-50 border-r border-slate-100 overflow-y-auto">
                                <div className="space-y-10">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-3 leading-snug">
                                            {selectedCohort.title}
                                        </h2>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {selectedCohort.description}
                                        </p>
                                    </div>

                                    <div className="space-y-8">
                                        {selectedCohort.learning_outcomes && selectedCohort.learning_outcomes.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 mb-4">What you&apos;ll learn</h3>
                                                <div className="space-y-3">
                                                    {selectedCohort.learning_outcomes.slice(0, 5).map((outcome, i) => (
                                                        <div key={i} className="flex items-start gap-3">
                                                            <Check size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                                            <span className="text-sm text-slate-600 leading-snug">{outcome}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedCohort.curriculum_highlights && selectedCohort.curriculum_highlights.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 mb-4">Course includes</h3>
                                                <div className="space-y-3">
                                                    {selectedCohort.curriculum_highlights.map((highlight, i) => (
                                                        <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                                                            <Calendar size={14} className="text-slate-400" />
                                                            <span>{highlight}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-8 lg:p-12 bg-white overflow-y-auto">
                                <div className="max-w-md mx-auto">
                                    <div className="mb-8">
                                        <h3 className="text-base font-bold text-slate-900 mb-4">Finalize Enrollment</h3>
                                        
                                        <div className="flex items-center gap-4 mb-2">
                                            <span className="text-3xl font-bold text-slate-900 tracking-tight">{formatCurrency(selectedCohort.price)}</span>
                                            {selectedCohort.original_price && (
                                                <span className="text-lg text-slate-400 line-through font-normal">{formatCurrency(selectedCohort.original_price)}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 italic">One-time payment for full cohort access</p>
                                    </div>

                                    <div className="space-y-6">
                                        <DynamicForm
                                            formSlug="cohort_enrollment"
                                            title={selectedCohort.title}
                                            fields={enrollmentFields}
                                            requiresPayment={true}
                                            paymentType={selectedCohort.razorpay_plan_id ? 'subscription' : 'one_time'}
                                            cohortId={selectedCohort.id}
                                            submitLabel="Complete Checkout"
                                            successMessage={selectedCohort.success_message || "Welcome aboard! Your payment was successful."}
                                        />
                                        
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Minimal Celebration Modal */}
            <AnimatePresence>
                {showCelebration && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm"
                            onClick={closeCelebration}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-premium-xl p-10 text-center"
                        >
                            <div className="w-20 h-20 bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check size={40} strokeWidth={3} />
                            </div>

                            <h2 className="text-2xl font-serif font-bold text-navy-900 mb-3">
                                Enrollment Successful
                            </h2>

                            <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                Welcome to the batch! We&apos;ve sent your welcome kit and Telegram access link to your email.
                            </p>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl text-left">
                                    <Mail className="text-navy-400 w-5 h-5 flex-shrink-0" />
                                    <span className="text-xs font-medium text-navy-900">Check your inbox & spam folder</span>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                fullWidth
                                onClick={closeCelebration}
                                className="py-4 rounded-xl text-sm font-bold tracking-wide"
                            >
                                Continue to Cohorts
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function CohortClient(props: CohortClientProps) {
    return (
        <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center font-serif italic text-navy-400">Loading learning journey...</div>}>
            <CohortContent {...props} />
        </Suspense>
    );
}
