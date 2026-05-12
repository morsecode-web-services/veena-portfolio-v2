'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Lock, Users, Calendar, ArrowRight, X, Star } from 'lucide-react';
import { Button } from '@/components/system/Button';
import DynamicForm, { FormField } from '@/components/features/DynamicForm';
import Image from 'next/image';
import { analytics, trackEvent } from '@/components/GoogleAnalytics';

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

export default function CohortClient({ initialCohorts }: CohortClientProps) {
    const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const enrollmentFields: FormField[] = [
        { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name' },
        { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
        { name: 'phone', label: 'WhatsApp Number', type: 'tel', required: true, placeholder: 'Your WhatsApp number' },
    ];

    const handleEnroll = (cohort: Cohort) => {
        if (cohort.status !== 'active') return;
        setSelectedCohort(cohort);
        setIsModalOpen(true);

        // GA4 Funnel: Track interest and checkout start
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
                        {/* Thumbnail */}
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

                            {/* Overlay Badges */}
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

                        {/* Content */}
                        <div className="p-5 flex flex-col">
                            <div className="flex-grow">
                                <h3 className="text-lg font-serif font-bold text-navy-900 leading-snug group-hover:text-gold-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                                    {cohort.title}
                                </h3>

                                <p className="text-xs text-slate-500 mt-1 mb-3">
                                    By Aishwarya Manikarnike
                                </p>

                                {/* Subtle Student Count */}
                                <div className="flex items-center gap-1.5 mb-4 text-slate-500">
                                    <Users size={12} className="text-slate-400" />
                                    <span className="text-xs font-medium">
                                        {cohort.registration_count && cohort.registration_count > 0 
                                            ? `${cohort.registration_count} ${cohort.registration_count === 1 ? 'student' : 'students'} enrolled`
                                            : 'Be the first to join'}
                                    </span>
                                </div>


                                {/* Bottom Section */}
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

                        {/* Coming Soon Overlay */}
                        {cohort.status === 'coming_soon' && (
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] pointer-events-none" />
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Enrollment Modal */}
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
                            className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-6 right-8 text-slate-300 hover:text-navy-900 transition-all z-20 p-2 hover:bg-slate-50 rounded-full"
                            >
                                <X size={24} />
                            </button>

                            {/* Minimal Left Side: Quick Context */}
                            <div className="md:w-[35%] p-8 lg:p-12 bg-slate-50/50 border-r border-slate-100 overflow-y-auto">
                                <div className="mb-10">
                                    <h2 className="text-2xl font-serif font-bold text-navy-900 mb-3 tracking-tight">
                                        {selectedCohort.title}
                                    </h2>
                                    <p className="text-slate-500 text-sm leading-relaxed italic font-serif">
                                        &ldquo;{selectedCohort.description}&rdquo;
                                    </p>
                                </div>

                                <div className="space-y-8">
                                    {selectedCohort.learning_outcomes && selectedCohort.learning_outcomes.length > 0 && (
                                        <div>
                                            <h3 className="text-[10px] font-black text-navy-900 uppercase tracking-[0.2em] mb-4">You&apos;ll Master:</h3>
                                            <div className="space-y-3">
                                                {selectedCohort.learning_outcomes.slice(0, 5).map((outcome, i) => (
                                                    <div key={i} className="flex items-start gap-2.5">
                                                        <Check size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                                        <span className="text-xs text-slate-600 leading-tight">{outcome}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedCohort.curriculum_highlights && selectedCohort.curriculum_highlights.length > 0 && (
                                        <div>
                                            <h3 className="text-[10px] font-black text-navy-900 uppercase tracking-[0.2em] mb-4">Highlights:</h3>
                                            <div className="space-y-3">
                                                {selectedCohort.curriculum_highlights.map((highlight, i) => (
                                                    <div key={i} className="flex items-center gap-2.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gold-400"></div>
                                                        <span className="text-xs font-medium text-navy-800">{highlight}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Priority Right Side: Enrollment Form */}
                            <div className="flex-1 p-8 lg:p-14 bg-white overflow-y-auto">
                                <div className="max-w-md mx-auto">
                                    <div className="mb-10 text-center md:text-left">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-600 mb-2">Enrollment Fee</p>
                                        <div className="flex items-baseline justify-center md:justify-start gap-3">
                                            <span className="text-5xl font-bold text-navy-900 tracking-tighter">{formatCurrency(selectedCohort.price)}</span>
                                            {selectedCohort.original_price && (
                                                <span className="text-xl text-slate-300 line-through font-medium">{formatCurrency(selectedCohort.original_price)}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="text-center md:text-left">
                                            <h4 className="text-lg font-bold text-navy-900 mb-1">Confirm Your Spot</h4>
                                            <p className="text-sm text-slate-400">Enter your details to proceed to payment.</p>
                                        </div>

                                        <DynamicForm
                                            formSlug="cohort_enrollment"
                                            title={selectedCohort.title}
                                            fields={enrollmentFields}
                                            requiresPayment={true}
                                            paymentType={selectedCohort.razorpay_plan_id ? 'subscription' : 'one_time'}
                                            cohortId={selectedCohort.id}
                                            submitLabel="Pay & Enroll"
                                            successMessage={selectedCohort.success_message || "Welcome aboard! Your payment was successful."}
                                        />

                                        <div className="pt-8 border-t border-slate-50 flex flex-col gap-4">
                                            <div className="flex items-center justify-center md:justify-start gap-3 opacity-50">
                                                <Lock size={12} className="text-navy-900" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-navy-900">Secure 256-bit SSL Payment</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-relaxed text-center md:text-left">
                                                By proceeding with the enrollment, you agree to our terms of service. Since these are digital cohorts, payments are generally non-refundable once the batch begins.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
