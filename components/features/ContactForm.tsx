'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendContactEmail } from '@/lib/email-service';
import { motion } from 'framer-motion';

// Zod validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  phone: z.string().min(10, 'Please enter a valid phone number').regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address'),
  purpose: z.string().min(10, 'Please provide more details (at least 10 characters)').max(1000, 'Message is too long'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ContactFormData) => {
    // Rate limiting: prevent submissions within 30 seconds
    const now = Date.now();
    if (now - lastSubmitTime < 30000) {
      setSubmitStatus('error');
      setErrorMessage('Please wait 30 seconds before submitting another message.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      await sendContactEmail(
        {
          ...data,
          timestamp: new Date(),
        },
        {
          timeout: 10000,
          retries: 2,
        }
      );

      setSubmitStatus('success');
      setLastSubmitTime(now);
      reset();

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');

      // Set user-friendly error message based on error type
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          setErrorMessage('The request timed out. Please check your internet connection and try again.');
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          setErrorMessage('Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('validation')) {
          setErrorMessage('Please check that all fields are filled correctly.');
        } else {
          setErrorMessage('Unable to send your message. Please try again later or contact directly via social media.');
        }
      } else {
        setErrorMessage('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-2">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5" aria-label="Contact form">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1.5">
            Name *
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all text-xs sm:text-sm ${errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Your full name"
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <motion.p
              id="name-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {errors.name.message}
            </motion.p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1.5">
            Phone Number *
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all text-xs sm:text-sm ${errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="+91 9876543210"
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={errors.phone ? 'true' : 'false'}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <motion.p
              id="phone-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {errors.phone.message}
            </motion.p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1.5">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all text-xs sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="your.email@example.com"
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <motion.p
              id="email-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {errors.email.message}
            </motion.p>
          )}
        </div>

        {/* Purpose Field */}
        <div>
          <label htmlFor="purpose" className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1.5">
            Purpose of Contact *
          </label>
          <textarea
            id="purpose"
            {...register('purpose')}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all resize-none text-xs sm:text-sm ${errors.purpose ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Please describe your inquiry, booking request, or collaboration opportunity..."
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={errors.purpose ? 'true' : 'false'}
            aria-describedby={errors.purpose ? 'purpose-error' : undefined}
          />
          {errors.purpose && (
            <motion.p
              id="purpose-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {errors.purpose.message}
            </motion.p>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={!isSubmitting ? { scale: 1.02, y: -2 } : {}}
            whileTap={!isSubmitting ? { scale: 0.98 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className={`w-full py-2.5 sm:py-3 px-4 sm:px-5 rounded-lg font-medium text-white transition-all duration-300 text-xs sm:text-sm touch-manipulation shadow-premium-md ${isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-navy-900 hover:bg-navy-800 active:bg-navy-950 hover:shadow-premium-lg'
              }`}
            style={!isSubmitting ? { backgroundColor: '#14213d', color: '#ffffff' } : { backgroundColor: '#9ca3af', color: '#ffffff' }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send Message'
            )}
          </motion.button>
        </div>

        {/* Success Message */}
        {submitStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">Message sent successfully!</h3>
                <p className="mt-1 text-sm text-green-700">
                  Thank you for reaching out. I will respond to your inquiry as soon as possible.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {submitStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Unable to send message</h3>
                <p className="mt-1 text-sm text-red-700">
                  {errorMessage || 'There was an error submitting your message. Please try again later or contact directly via social media.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
