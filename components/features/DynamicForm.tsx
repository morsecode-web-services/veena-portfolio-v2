'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { m, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/system/Button';
import { analytics } from '@/components/GoogleAnalytics';
import { CheckCircle2, AlertCircle, Loader2, UploadCloud, X } from 'lucide-react';
import PhoneInput, { getCountryCallingCode } from 'react-phone-number-input';
import Input from 'react-phone-number-input/input';
import 'react-phone-number-input/style.css';

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'email' | 'tel' | 'select' | 'date' | 'checkbox' | 'content' | 'image';
    required?: boolean;
    placeholder?: string;
    options?: string[];
    content?: string;
}

interface DynamicFormProps {
    formSlug: string;
    fields: FormField[];
    title: string;
    description?: string;
    successMessage?: string;
    requiresPayment?: boolean;
    paymentType?: 'subscription' | 'one_time';
    razorpayPlanId?: string;
    razorpayAmount?: number;
}

export default function DynamicForm({ formSlug, fields, title, description, successMessage, requiresPayment, paymentType = 'subscription', razorpayPlanId, razorpayAmount }: DynamicFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

    // Load Razorpay script if payment is required
    useEffect(() => {
        if (requiresPayment) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
            return () => {
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
            };
        }
    }, [requiresPayment]);

    // Build dynamic validation schema
    const schemaShape: Record<string, any> = {};
    fields.forEach((field) => {
        if (field.type === 'content') {
            return; // No validation for content blocks
        }

        let validator: z.ZodTypeAny = z.string();

        if (field.type === 'email') {
            validator = z.string().email('Invalid email address');
        } else if (field.type === 'tel') {
            validator = z.string()
                .regex(/^[0-9+\-\s()]*$/, 'Only numbers and +, -, (, ) are allowed')
                .refine((val) => {
                    const digits = val.replace(/\D/g, '');
                    return digits.length >= 10 && digits.length <= 15;
                }, 'Phone number must be between 10 and 15 digits');
        } else if (field.type === 'image') {
            validator = z.string().url('Invalid image URL');
        }

        if (field.required) {
            if (validator instanceof z.ZodString) {
                validator = validator.min(1, `${field.label} is required`);
            }
        } else {
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
        setValue,
        watch,
        control
    } = useForm<FormData>({
        resolver: zodResolver(dynamicSchema),
    });

    const saveFormData = async (data: FormData, paymentData: any = {}) => {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                formSlug,
                form_data: data,
                name: data.name || 'Anonymous',
                email: data.email || null,
                phone: data.phone || null,
                inquiryType: formSlug,
                message: data.message || 'No message provided',
                ...paymentData
            }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to send message');
    };

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setSubmitStatus('idle');
        setErrorMessage('');

        try {
            // 1. Payment Flow
            if (requiresPayment && razorpayPlanId) {
                const checkoutRes = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        plan_id: razorpayPlanId,
                        paymentType,
                        amount: razorpayAmount,
                        formSlug,
                        phone: data.phone,
                        email: data.email,
                        name: data.name
                    })
                });
                
                const checkoutData = await checkoutRes.json();
                if (!checkoutRes.ok) throw new Error(checkoutData.error || 'Failed to initialize checkout');

                const options = {
                    key: checkoutData.key_id,
                    subscription_id: checkoutData.type === 'subscription' ? checkoutData.subscription_id : undefined,
                    order_id: checkoutData.type === 'order' ? checkoutData.order_id : undefined,
                    name: "Aishwarya Manikarnike",
                    description: title,
                    handler: async function (response: any) {
                        try {
                            setIsSubmitting(true);
                            await saveFormData(data, {
                                payment_status: 'paid',
                                razorpay_subscription_id: response.razorpay_subscription_id || null,
                                razorpay_order_id: response.razorpay_order_id || null,
                                razorpay_payment_id: response.razorpay_payment_id || null
                            });
                            analytics.contactFormSubmit(true, undefined, formSlug);
                            setSubmitStatus('success');
                            reset();
                        } catch (err: any) {
                            setSubmitStatus('error');
                            setErrorMessage('Payment succeeded, but we failed to save your submission. Please contact support.');
                        } finally {
                            setIsSubmitting(false);
                        }
                    },
                    prefill: {
                        name: data.name || '',
                        email: data.email || '',
                        contact: data.phone || ''
                    },
                    theme: { color: "#0f172a" }
                };
                
                const rzp = new (window as any).Razorpay(options);
                rzp.on('payment.failed', function (response: any){
                    setIsSubmitting(false);
                    setSubmitStatus('error');
                    setErrorMessage(response.error.description || 'Payment failed or was cancelled.');
                });
                rzp.open();
                return; // Pause the form submission, let Razorpay handler take over
            }

            // 2. Standard Flow (No Payment)
            await saveFormData(data);
            analytics.contactFormSubmit(true, undefined, formSlug);
            setSubmitStatus('success');
            reset();
        } catch (error) {
            console.error('Form submission error:', error);
            setSubmitStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
            analytics.contactFormSubmit(false, errorMessage);
        } finally {
            if (!requiresPayment) {
                setIsSubmitting(false);
            }
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        let file = e.target.files?.[0];
        if (!file) return;

        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;

        if (!uploadPreset || !cloudName) {
            alert('Cloudinary upload preset or cloud name is missing. Please configure NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.');
            return;
        }

        setUploadingFields(prev => ({ ...prev, [fieldName]: true }));
        try {
            // Compress the image down to < 500kb before it even hits Cloudinary to save massive storage space
            const imageCompression = (await import('browser-image-compression')).default;
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1200,
                useWebWorker: true
            };
            
            try {
                file = await imageCompression(file, options);
            } catch (compressionError) {
                console.warn('Image compression failed, using original file', compressionError);
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            // Organize uploads by form slug for better management
            formData.append('folder', `forms/user-submissions/${formSlug}`);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'Failed to upload image');

            // Set the Cloudinary secure URL in the react-hook-form state
            setValue(fieldName, data.secure_url, { shouldValidate: true });
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setUploadingFields(prev => ({ ...prev, [fieldName]: false }));
            if (e.target) e.target.value = ''; // Reset input to allow re-uploading same file if deleted
        }
    };

    const CustomPhoneInput = ({ name, placeholder, control }: { name: string, placeholder?: string, control: any }) => {
        const [country, setCountry] = useState<any>('IN');

        return (
            <div className={`phone-input-wrapper ${errors[name] ? 'has-error' : ''}`}>
                <Controller
                    name={name}
                    control={control}
                    render={({ field: { onChange, value } }) => (
                        <div className={`flex items-center w-full rounded-xl border transition-all bg-white overflow-hidden ${
                            errors[name] 
                                ? 'border-red-500 bg-red-50/30' 
                                : 'border-slate-200 focus-within:ring-2 focus-within:ring-navy-500/10 focus-within:border-navy-500 hover:border-slate-300'
                        }`}>
                            {/* The Grouped Selector (Left) */}
                            <div className="flex items-center gap-2 pl-4 pr-3 py-3 border-r border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-pointer group relative">
                                <div className="flex items-center gap-2 pointer-events-none">
                                    <span className="text-xl leading-none">
                                        {country === 'IN' ? '🇮🇳' : country === 'US' ? '🇺🇸' : country === 'GB' ? '🇬🇧' : country === 'AE' ? '🇦🇪' : country === 'CA' ? '🇨🇦' : country === 'AU' ? '🇦🇺' : country === 'SG' ? '🇸🇬' : '🌐'}
                                    </span>
                                    <span className="text-sm font-bold text-navy-900">+{getCountryCallingCode(country)}</span>
                                </div>
                                <select 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    value={country}
                                    onChange={e => setCountry(e.target.value)}
                                >
                                    <option value="IN">India +91</option>
                                    <option value="US">USA +1</option>
                                    <option value="GB">UK +44</option>
                                    <option value="AE">UAE +971</option>
                                    <option value="CA">Canada +1</option>
                                    <option value="AU">Australia +61</option>
                                    <option value="SG">Singapore +65</option>
                                    <option value="DE">Germany +49</option>
                                    <option value="FR">France +33</option>
                                </select>
                            </div>

                            {/* The Input Area (Right) */}
                            <Input
                                country={country}
                                value={value}
                                onChange={onChange}
                                placeholder={placeholder || 'Enter phone number'}
                                className="flex-1 bg-transparent border-none outline-none font-medium text-navy-900 px-4 py-3 text-sm placeholder:text-slate-400"
                            />
                        </div>
                    )}
                />
                
                <style jsx global>{`
                    .phone-input-wrapper .PhoneInputInput {
                        width: 100%;
                        height: 100%;
                    }
                `}</style>
            </div>
        );
    };

    if (submitStatus === 'success') {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-premium border border-slate-100 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-2">Message Sent!</h3>
                <p className="text-slate-600 mb-6">{successMessage || 'Thank you for reaching out. Aishwarya will get back to you shortly.'}</p>
                <Button variant="ghost" onClick={() => setSubmitStatus('idle')}>Send Another Message</Button>
            </div>
        );
    }

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
                        {field.type === 'content' ? (
                            <div className="prose prose-sm md:prose-base prose-navy max-w-none my-4" dangerouslySetInnerHTML={{ __html: field.content || field.label || '' }} />
                        ) : (
                            <>
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
                        ) : field.type === 'image' ? (
                            <div className="mt-1">
                                {watch(field.name) ? (
                                    <div className="relative inline-block border border-gray-200 rounded-xl overflow-hidden group">
                                        <div className="h-32 w-48 relative">
                                            <Image 
                                                src={watch(field.name) as string} 
                                                alt="Upload preview" 
                                                fill
                                                className="object-contain bg-gray-50" 
                                                unoptimized
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setValue(field.name, '', { shouldValidate: true })}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <input type="hidden" {...register(field.name)} />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            id={`${formSlug}-${field.name}`}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, field.name)}
                                            disabled={isSubmitting || uploadingFields[field.name]}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                                        />
                                        <div className={`w-full px-4 py-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all text-center
                                            ${errors[field.name] ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gold-400 bg-gray-50'}
                                            ${uploadingFields[field.name] ? 'opacity-50' : ''}`}
                                        >
                                            {uploadingFields[field.name] ? (
                                                <>
                                                    <Loader2 className="w-6 h-6 text-gold-500 animate-spin mb-2" />
                                                    <span className="text-sm font-medium text-gray-500">Uploading...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <UploadCloud className="w-6 h-6 text-gray-400 mb-2" />
                                                    <span className="text-sm font-medium text-gray-600">Click or drag image here to upload</span>
                                                    <span className="text-xs text-gray-400 mt-1">PNG, JPG, up to 10MB</span>
                                                </>
                                            )}
                                        </div>
                                        <input type="hidden" {...register(field.name)} />
                                    </div>
                                )}
                            </div>
                        ) : field.type === 'tel' ? (
                            <CustomPhoneInput 
                                name={field.name}
                                placeholder={field.placeholder}
                                control={control}
                            />
                        ) : (
                            <input
                                id={`${formSlug}-${field.name}`}
                                type={field.type}
                                {...register(field.name)}
                                placeholder={field.placeholder}
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
                        </>
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
                    {submitStatus === 'error' && (
                        <m.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 text-sm flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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
