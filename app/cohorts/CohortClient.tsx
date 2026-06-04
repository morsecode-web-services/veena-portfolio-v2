'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Lock, Calendar, ArrowRight, X, Star, PartyPopper, Mail, CreditCard } from 'lucide-react';
import { Button } from '@/components/system/Button';
import type { FormField } from '@/components/features/DynamicForm';
import Image from 'next/image';
import { analytics, trackEvent } from '@/components/GoogleAnalytics';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DynamicForm = dynamic(() => import('@/components/features/DynamicForm'), {
    ssr: false,
    loading: () => (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 flex flex-col items-center justify-center min-h-[320px] animate-pulse">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-navy-900 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium text-slate-500">Loading enrollment form...</p>
        </div>
    )
});

const QRCode = dynamic(() => import('react-qr-code'), {
    ssr: false,
    loading: () => (
        <div className="w-[140px] h-[140px] bg-slate-100 rounded-xl flex items-center justify-center animate-pulse border border-slate-200">
            <span className="text-[10px] text-slate-400">Loading QR Code...</span>
        </div>
    )
});

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
    success_message?: string;
    pricing_type?: 'fixed' | 'pay_as_you_wish';
}

interface CohortClientProps {
    initialCohorts: Cohort[];
}

function CohortContent({ initialCohorts }: CohortClientProps) {
    const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [pollingTimedOut, setPollingTimedOut] = useState(false);
    const [prefillData, setPrefillData] = useState<{name?: string, email?: string, phone?: string} | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();

    const closeCelebration = useCallback(() => {
        setShowCelebration(false);
        setInviteLink(null);
        setIsPolling(false);
        setPollingTimedOut(false);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('success');
        params.delete('payment_id');
        const query = params.toString();
        router.replace(`/cohorts${query ? `?${query}` : ''}`, { scroll: false });
    }, [searchParams, router]);

    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            setShowCelebration(true);
            trackEvent('purchase_complete', { status: 'success' });
            
            const paymentId = searchParams.get('payment_id');
            
            if (paymentId) {
                setIsPolling(true);
                let attempts = 0;
                const maxAttempts = 30; // Poll for 60 seconds (30 * 2s) — covers slow webhook delivery
                
                const pollInterval = setInterval(async () => {
                    attempts++;
                    try {
                        const res = await fetch(`/api/cohorts/invite-link?paymentId=${paymentId}`);
                        const data = await res.json();
                        
                        if (data.status === 'success' && data.link) {
                            setInviteLink(data.link);
                            setIsPolling(false);
                            clearInterval(pollInterval);
                        } else if (data.status === 'failed') {
                            // Webhook processed but Telegram link wasn't generated — show email/WA fallback
                            setIsPolling(false);
                            setPollingTimedOut(false); // confirmed failure, not a timeout
                            clearInterval(pollInterval);
                        } else if (attempts >= maxAttempts) {
                            // Timed out — webhook still processing or very slow
                            setIsPolling(false);
                            setPollingTimedOut(true);
                            clearInterval(pollInterval);
                        }
                    } catch (err) {
                        console.error('Polling error:', err);
                        if (attempts >= maxAttempts) {
                            setIsPolling(false);
                            setPollingTimedOut(true);
                            clearInterval(pollInterval);
                        }
                    }
                }, 2000);
                
                return () => clearInterval(pollInterval);
            } else {
                // Auto-dismiss after 12 seconds if no payment ID to poll for
                const timer = setTimeout(() => {
                    closeCelebration();
                }, 12000);
                return () => clearTimeout(timer);
            }
        }
    }, [searchParams, closeCelebration]);

    useEffect(() => {
        const enrollId = searchParams.get('enroll');
        if (enrollId) {
            const cohort = initialCohorts.find(c => c.id === enrollId);
            if (cohort && cohort.status === 'active') {
                setSelectedCohort(cohort);
                setIsModalOpen(true);
                
                const name = searchParams.get('name') || undefined;
                const email = searchParams.get('email') || undefined;
                const phone = searchParams.get('phone') || undefined;
                setPrefillData({ name, email, phone });
                
                // Clean the URL parameters silently without reloading
                if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('enroll');
                    url.searchParams.delete('name');
                    url.searchParams.delete('email');
                    url.searchParams.delete('phone');
                    window.history.replaceState({}, '', url.pathname + url.search);
                }
            }
        }
    }, [searchParams, initialCohorts]);

    const baseFields: FormField[] = [
        { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name' },
        { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
        { name: 'phone', label: 'WhatsApp Number', type: 'tel', required: true, placeholder: 'Your WhatsApp number' },
    ];

    const enrollmentFields: FormField[] = selectedCohort?.pricing_type === 'pay_as_you_wish'
        ? [
            ...baseFields,
            {
                name: 'custom_amount',
                label: 'Your Contribution / Pay as you wish (₹)',
                type: 'text',
                required: true,
                placeholder: selectedCohort.price > 0 
                    ? `Suggested: ₹${(selectedCohort.price / 100).toFixed(0)}`
                    : 'Enter contribution amount'
            }
        ]
        : baseFields;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {initialCohorts.map((cohort, index) => (
                    <motion.button
                        key={cohort.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => cohort.status === 'active' && handleEnroll(cohort)}
                        disabled={cohort.status !== 'active'}
                        className={`group relative bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all duration-500 text-left w-full outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-4 ${cohort.status === 'active' ? 'cursor-pointer hover:shadow-premium-xl hover:-translate-y-2' : 'opacity-75 cursor-not-allowed'
                            }`}
                    >
                        <div className="relative aspect-video overflow-hidden bg-slate-100">
                            {cohort.image_url ? (
                                <Image
                                    src={cohort.image_url}
                                    alt={cohort.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-navy-50/50">
                                    <div className="text-navy-200 font-serif italic text-xl">
                                        {cohort.month_name}
                                    </div>
                                </div>
                            )}

                            {cohort.is_highlighted && (
                                <div className="absolute top-3 left-3">
                                    <div className="bg-gold-400 text-navy-950 text-[10px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-wider">
                                        Recommended
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 flex flex-col">
                            <div className="flex-grow">
                                <h3 className="text-lg font-serif font-bold text-navy-900 leading-snug group-hover:text-gold-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                                    {cohort.title}
                                </h3>

                                {/* Short description instead of features checklist */}
                                <div className="mb-4 min-h-[4rem]">
                                    {cohort.description && (
                                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                                            {cohort.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        {cohort.pricing_type === 'pay_as_you_wish' ? (
                                            <>
                                                <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded w-max mb-1">Pay as you wish</span>
                                                {cohort.price > 0 && (
                                                    <span className="text-sm font-bold text-navy-900 tracking-tight">Suggested: {formatCurrency(cohort.price)}</span>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {cohort.original_price && (
                                                    <span className="text-[10px] text-slate-400 line-through leading-none decoration-red-200 italic">{formatCurrency(cohort.original_price)}</span>
                                                )}
                                                <span className="text-xl font-bold text-navy-900 tracking-tight">{formatCurrency(cohort.price)}</span>
                                            </>
                                        )}
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
                                                <h3 className="text-sm font-bold text-slate-900 mb-4">How it Works</h3>
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
                                        
                                        {selectedCohort.pricing_type === 'pay_as_you_wish' ? (
                                            <>
                                                {selectedCohort.price > 0 && (
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <span className="text-lg font-bold text-slate-500">Suggested:</span>
                                                        <span className="text-2xl font-bold text-navy-900 tracking-tight">{formatCurrency(selectedCohort.price)}</span>
                                                    </div>
                                                )}
                                                <p className="text-xs text-slate-500 italic">Voluntary Contribution / Pay as you wish (min ₹1)</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-4 mb-2">
                                                    <span className="text-3xl font-bold text-slate-900 tracking-tight">{formatCurrency(selectedCohort.price)}</span>
                                                    {selectedCohort.original_price && (
                                                        <span className="text-lg text-slate-400 line-through font-normal">{formatCurrency(selectedCohort.original_price)}</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 italic">One-time payment for full cohort access</p>
                                            </>
                                        )}
                                        <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2.5">
                                            <Clock size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                                Kindly note this registration is for the 1st month of the 3 month program.
                                                {selectedCohort.pricing_type === 'pay_as_you_wish' && (
                                                    <span> The remaining 2 months will also be Pay as you wish.</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                        <DynamicForm
                                            key={selectedCohort.id}
                                            formSlug="cohort_enrollment"
                                            title={selectedCohort.title}
                                            fields={enrollmentFields}
                                            requiresPayment={true}
                                            paymentType={selectedCohort.razorpay_plan_id ? 'subscription' : 'one_time'}
                                            cohortId={selectedCohort.id}
                                            submitLabel="Complete Checkout"
                                            successMessage={selectedCohort.success_message || "Welcome aboard! Your payment was successful."}
                                            prefillData={prefillData}
                                        />

                                        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                                            <CreditCard size={15} className="text-slate-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                                Those outside India may please make a card payment on the next page. International card payments are accepted.
                                            </p>
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

                            <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                Welcome to the batch! We are processing your enrollment. Your secure Telegram access link will be sent to your registered contact channels shortly.
                            </p>

                            {isPolling ? (
                                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 flex flex-col items-center justify-center min-h-[160px]">
                                    <div className="w-8 h-8 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mb-4"></div>
                                    <p className="text-sm font-bold text-navy-900">Generating secure invite link...</p>
                                    <p className="text-xs text-slate-500 mt-1">This can take up to a minute</p>
                                </div>
                            ) : inviteLink ? (
                                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                                    <p className="text-sm font-bold text-navy-900 mb-4">Scan or click to join the group instantly:</p>
                                    <div className="bg-white p-4 rounded-xl shadow-sm inline-block mb-4 border border-slate-200">
                                        <QRCode value={inviteLink} size={140} />
                                    </div>
                                    <a 
                                        href={inviteLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 py-3 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        Join Telegram Group <ArrowRight size={16} />
                                    </a>
                                </div>
                            ) : pollingTimedOut ? (
                                // Webhook is still processing — invite link is on its way
                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl text-left">
                                        <Clock className="text-blue-500 w-5 h-5 flex-shrink-0" />
                                        <span className="text-xs font-medium text-blue-900">Your invite link is still being prepared — it will arrive on your Email and WhatsApp within the next few minutes</span>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-xl text-left">
                                        <Mail className="text-amber-500 w-5 h-5 flex-shrink-0" />
                                        <span className="text-xs font-medium text-amber-800">Check your spam or promotions folder if you don&apos;t see it in your inbox</span>
                                    </div>
                                </div>
                            ) : (
                                // Confirmed: webhook processed but Telegram link wasn't generated — email/WA is the fallback
                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl text-left">
                                        <Mail className="text-navy-400 w-5 h-5 flex-shrink-0" />
                                        <span className="text-xs font-medium text-navy-900">Your Telegram invite link has been sent to your Email and WhatsApp</span>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-xl text-left">
                                        <Clock className="text-amber-500 w-5 h-5 flex-shrink-0" />
                                        <span className="text-xs font-medium text-amber-800">Check your spam or promotions folder if you don&apos;t see it in your inbox</span>
                                    </div>
                                </div>
                            )}

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
