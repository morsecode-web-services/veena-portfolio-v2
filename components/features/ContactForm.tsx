'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { m } from 'framer-motion';
import { analytics } from '@/components/GoogleAnalytics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Button } from '@/components/system/Button';
import { useToast } from '@/context/ToastContext';

import { validateEmailTypo } from '@/lib/utils';

// Zod validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  phone: z
    .string()
    .min(10, 'Please enter a valid phone number')
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
      'Please enter a valid phone number'
    ),
  email: z
    .string()
    .email('Please enter a valid email address')
    .refine(
      (val) => validateEmailTypo(val).isValid,
      (val) => ({
        message: validateEmailTypo(val).error || 'Please double-check your email domain',
      })
    ),
  inquiryType: z.enum(['performance', 'classes', 'collaboration', 'general'], {
    required_error: 'Please select an inquiry type',
  }),
  purpose: z
    .string()
    .min(10, 'Please provide more details (at least 10 characters)')
    .max(1000, 'Message is too long'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const shouldReduceMotion = useReducedMotion();
  const firstErrorFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onBlur',
  });

  const emailSuggestionMatch = errors.email?.message?.match(/^Did you mean ([^?]+)\?$/);
  const emailSuggestion = emailSuggestionMatch ? emailSuggestionMatch[1] : null;

  // Focus management for validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // Find the first field with an error
      const firstErrorField = ['name', 'phone', 'email', 'inquiryType', 'purpose'].find(
        (field) => errors[field as keyof ContactFormData]
      );
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement;
        if (element) {
          element.focus();
          firstErrorFieldRef.current = element as HTMLInputElement | HTMLTextAreaElement;
        }
      }
    }
  }, [errors]);

  const onSubmit = async (data: ContactFormData) => {
    // Rate limiting: prevent submissions within 30 seconds
    const now = Date.now();
    if (now - lastSubmitTime < 30000) {
      addToast('Please wait 30 seconds before submitting another message.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call API route to handle email sending and database storage
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          inquiryType: data.inquiryType,
          message: data.purpose,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Track successful form submission
      analytics.contactFormSubmit(true, undefined, data.inquiryType);

      addToast('Message sent successfully! You will receive a confirmation email.', 'success');
      setLastSubmitTime(now);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);

      // Set user-friendly error message
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'Unable to send your message. Please try again later.';

      addToast(errorMsg, 'error');

      // Track failed form submission
      analytics.contactFormSubmit(false, errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-2">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 sm:space-y-5"
        aria-label="Contact form"
      >
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-charcoal-700 mb-1.5">
            Name *
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            onFocus={() => analytics.contactFormStart()}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all text-xs sm:text-sm ${
              errors.name ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="Your full name"
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <m.p
              id="name-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {errors.name.message}
            </m.p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-xs font-medium text-charcoal-700 mb-1.5">
            Phone Number *
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all text-xs sm:text-sm ${
              errors.phone ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="+91 9876543210"
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={errors.phone ? 'true' : 'false'}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <m.p
              id="phone-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {errors.phone.message}
            </m.p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-charcoal-700 mb-1.5">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all text-xs sm:text-sm ${
              errors.email ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="your.email@example.com"
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <m.div
              id="email-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600 leading-normal"
              role="alert"
            >
              <span>{errors.email.message}</span>
              {emailSuggestion && (
                <button
                  type="button"
                  onClick={() => {
                    const currentVal = watch('email') || '';
                    const localPart = currentVal.split('@')[0];
                    if (localPart) {
                      setValue('email', `${localPart}@${emailSuggestion}`, {
                        shouldValidate: true,
                      });
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer focus:outline-none transition-colors ml-1.5 inline-block"
                >
                  update
                </button>
              )}
            </m.div>
          )}
        </div>

        {/* Inquiry Type Field */}
        <div>
          <label
            htmlFor="inquiryType"
            className="block text-xs font-medium text-charcoal-700 mb-1.5"
          >
            I&apos;m interested in *
          </label>
          <select
            id="inquiryType"
            {...register('inquiryType')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all text-xs sm:text-sm ${
              errors.inquiryType ? 'border-red-500' : 'border-slate-300'
            }`}
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={errors.inquiryType ? 'true' : 'false'}
            aria-describedby={errors.inquiryType ? 'inquiryType-error' : undefined}
          >
            <option value="">Select an option</option>
            <option value="performance">Performance Booking</option>
            <option value="classes">Private Classes</option>
            <option value="collaboration">Collaboration Opportunity</option>
            <option value="general">General Inquiry</option>
          </select>
          {errors.inquiryType && (
            <m.p
              id="inquiryType-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {errors.inquiryType.message}
            </m.p>
          )}
        </div>

        {/* Purpose Field */}
        <div>
          <label htmlFor="purpose" className="block text-xs font-medium text-charcoal-700 mb-1.5">
            Purpose of Contact *
          </label>
          <textarea
            id="purpose"
            {...register('purpose')}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all resize-none text-xs sm:text-sm ${
              errors.purpose ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="Please describe your inquiry, booking request, or collaboration opportunity..."
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={errors.purpose ? 'true' : 'false'}
            aria-describedby={errors.purpose ? 'purpose-error' : undefined}
          />
          {errors.purpose && (
            <m.p
              id="purpose-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {errors.purpose.message}
            </m.p>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="base"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </form>
    </div>
  );
}
