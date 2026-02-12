'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { m, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/system/Button';
import { analytics } from '@/components/GoogleAnalytics';

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'email' | 'tel' | 'select' | 'date' | 'checkbox';
    required?: boolean;
    placeholder?: string;
    options?: string[];
}

interface DynamicFormProps {
    formSlug: string;
    fields: FormField[];
    title: string;
    description?: string;
}

export default function DynamicForm({ formSlug, fields, title, description }: DynamicFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Build dynamic validation schema
    const schemaShape: Record<string, any> = {};
    fields.forEach((field) => {
        let validator: z.ZodTypeAny = z.string();

        if (field.type === 'email') {
            validator = z.string().email('Invalid email address');
        } else if (field.type === 'tel') {
            // Strict phone validation: allows digits, spaces, +, -, (, ) and requires at least 10 characters
            validator = z.string()
                .regex(/^[0-9+\-\s()]*$/, 'Only numbers and +, -, (, ) are allowed')
                .refine((val) => {
                    const digits = val.replace(/\D/g, '');
                    return digits.length >= 10 && digits.length <= 15;
                }, 'Phone number must be between 10 and 15 digits');
        }

        if (field.required) {
            if (validator instanceof z.ZodString) {
                validator = validator.min(1, `${field.label} is required`);
            }
        } else {
            // For non-required fields, allow empty string but validate if provided
            validator = (validator as z.ZodString).optional().or(z.literal(''));
        }

        schemaShape[field.name] = validator;
    });

    const dynamicSchema = z.object(schemaShape);
    type FormData = z.infer<typeof dynamicSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(dynamicSchema),
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setSubmitStatus('idle');
        setErrorMessage('');

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formSlug,
                    form_data: data,
                    // Extract core fields for backward compatibility if they exist in the dynamic form
                    name: data.name || 'Anonymous',
                    email: data.email || null,
                    phone: data.phone || null,
                    inquiryType: formSlug,
                    message: data.message || 'No message provided',
                }),
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Failed to send message');

            analytics.contactFormSubmit(true, undefined, formSlug);
            setSubmitStatus('success');
            reset();

            setTimeout(() => setSubmitStatus('idle'), 5000);
        } catch (error) {
            console.error('Form submission error:', error);
            setSubmitStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
            analytics.contactFormSubmit(false, errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-premium border border-slate-100">
            {description && (
                <div className="mb-6">
                    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {fields.map((field) => (
                    <div key={field.name}>
                        <label htmlFor={`${formSlug}-${field.name}`} className="block text-xs font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>

                        {field.type === 'textarea' ? (
                            <textarea
                                id={`${formSlug}-${field.name}`}
                                {...register(field.name)}
                                rows={4}
                                placeholder={field.placeholder}
                                className={`w-full px-4 py-3 rounded-xl border transition-all text-sm focus:ring-2 focus:ring-navy-500/10 focus:border-navy-500 outline-none ${errors[field.name] ? 'border-red-500 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                disabled={isSubmitting}
                            />
                        ) : field.type === 'select' ? (
                            <select
                                id={`${formSlug}-${field.name}`}
                                {...register(field.name)}
                                className={`w-full px-4 py-3 rounded-xl border transition-all text-sm focus:ring-2 focus:ring-navy-500/10 focus:border-navy-500 outline-none appearance-none bg-no-repeat bg-[length:16px_16px] bg-[right_1rem_center] cursor-pointer ${errors[field.name] ? 'border-red-500 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                                disabled={isSubmitting}
                            >
                                <option value="">Select an option</option>
                                {field.options?.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                id={`${formSlug}-${field.name}`}
                                type={field.type}
                                {...register(field.name)}
                                placeholder={field.placeholder}
                                inputMode={field.type === 'tel' ? 'tel' : undefined}
                                className={`w-full px-4 py-3 rounded-xl border transition-all text-sm focus:ring-2 focus:ring-navy-500/10 focus:border-navy-500 outline-none ${errors[field.name] ? 'border-red-500 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                disabled={isSubmitting}
                            />
                        )}

                        {errors[field.name] && (
                            <m.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-1.5 text-xs text-red-600 font-medium">
                                {errors[field.name]?.message as string}
                            </m.p>
                        )}
                    </div>
                ))}

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isSubmitting}
                    className="mt-4 py-4 rounded-xl text-base tracking-wide"
                >
                    {isSubmitting ? 'Sending...' : 'Submit Inquiry'}
                </Button>

                <AnimatePresence>
                    {submitStatus === 'success' && (
                        <m.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-800 text-sm flex items-start gap-3"
                        >
                            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <span className="font-bold">Success!</span> Your inquiry has been sent. Check your inbox for a confirmation.
                            </div>
                        </m.div>
                    )}

                    {submitStatus === 'error' && (
                        <m.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 text-sm flex items-start gap-3"
                        >
                            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <span className="font-bold">Error:</span> {errorMessage}
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>
            </form>
        </div>
    );
}
