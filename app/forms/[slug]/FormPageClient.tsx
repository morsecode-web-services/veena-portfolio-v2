'use client';

import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import DynamicForm, { FormField } from '@/components/features/DynamicForm';
import { SectionWrapper } from '@/components/system/SectionWrapper';
import { SectionTitle } from '@/components/system/SectionTitle';
import { Copy, CheckCircle2, AlertCircle, Building2, Smartphone } from 'lucide-react';
import type { SiteConfig } from '@/types';

interface FormConfig {
  form_slug: string;
  title: string;
  description: string;
  fields: FormField[];
  success_message?: string;
  requires_payment?: boolean;
  payment_type?: 'subscription' | 'one_time';
  razorpay_plan_id?: string;
  razorpay_amount?: number;
}

interface FormPageClientProps {
  slug: string;
  siteConfig: SiteConfig;
}

export default function FormPageClient({ slug, siteConfig }: FormPageClientProps) {
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank'>('upi');

  // Grab any specific standalone settings from config (like deadlines/payments)
  const formSettings = (siteConfig as any)?.standaloneForms?.[slug];
  const requiresPayment = !!formSettings?.payment;
  const isClosed = formSettings?.deadline ? new Date() > new Date(formSettings.deadline) : false;

  useEffect(() => {
    async function fetchConfig() {
      // Check for preview mode
      const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      if (isPreview) {
        const localData = localStorage.getItem(`form_preview_${slug}`);
        if (localData) {
          try {
            setConfig(JSON.parse(localData));
            setIsLoading(false);
            return;
          } catch (err) {
            console.error('Error parsing local preview config:', err);
          }
        }
      }

      try {
        const { data, error } = await supabase
          .from('form_configs')
          .select('*')
          .eq('form_slug', slug)
          .eq('is_active', true)
          .single();

        if (error) {
          console.warn(`Form config ${slug} not found:`, error);
          setConfig(null);
        } else if (data) {
          setConfig(data);
        }
      } catch (err) {
        console.error('Error fetching form:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) fetchConfig();
  }, [slug]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isClosed) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-3xl shadow-premium max-w-lg w-full text-center"
        >
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy-900 mb-4">Registration Closed</h1>
          <p className="text-navy-600 leading-relaxed mb-8">
            Thank you for your interest! Registrations for this event are currently closed. Please
            check back later for future events.
          </p>
          <a
            href="/"
            className="inline-block px-8 py-4 bg-navy-900 text-white rounded-xl font-bold tracking-wide hover:bg-navy-800 transition-colors"
          >
            Return to Homepage
          </a>
        </m.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fdfcf0]">
      {/* Animated Ambient Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <m.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-gold-200/20 blur-[120px] rounded-full"
        />
        <m.div
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, -45, 0],
            x: [0, -50, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-navy-100/30 blur-[100px] rounded-full"
        />
        <m.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 30, 0],
            y: [0, -80, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-[10%] left-[20%] w-[60%] h-[40%] bg-gold-100/20 blur-[110px] rounded-full"
        />
      </div>

      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

      <SectionWrapper
        id="standalone-form"
        background="transparent"
        spacing="base"
        className="pt-28 md:pt-36 relative z-10"
      >
        <SectionTitle title={formSettings?.title || config?.title || 'Form'} alignment="center" />

        <div
          className={`grid grid-cols-1 ${requiresPayment ? 'lg:grid-cols-12' : 'lg:grid-cols-1'} gap-12 mt-12 sm:mt-16 max-w-6xl mx-auto`}
        >
          {/* Left Column: Payment Details (Only if payment is configured) */}
          {requiresPayment && (
            <m.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-5 space-y-8"
            >
              <div className="bg-navy-900 p-8 rounded-3xl text-white shadow-premium-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/20 blur-3xl rounded-full translate-x-10 -translate-y-10" />

                <h3 className="text-2xl font-serif font-bold mb-4">Complete Payment</h3>
                <p className="text-navy-200 text-sm leading-relaxed mb-6">
                  {formSettings?.description ||
                    'Please complete your payment before filling the form.'}
                </p>

                <div className="bg-navy-800/50 rounded-2xl p-4 mb-6 backdrop-blur-sm border border-navy-700/50">
                  <div className="text-sm text-navy-300 font-medium mb-1">Fee</div>
                  <div className="text-3xl font-bold text-gold-400">
                    {formSettings?.fee || 'Rs. 0'}
                  </div>
                </div>

                {/* Payment Tabs */}
                <div className="flex bg-navy-950 p-1.5 rounded-xl mb-6">
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${paymentMethod === 'upi' ? 'bg-navy-800 text-white shadow-md' : 'text-navy-400 hover:text-navy-200'}`}
                  >
                    <Smartphone className="w-4 h-4" /> Indian (UPI)
                  </button>
                  <button
                    onClick={() => setPaymentMethod('bank')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${paymentMethod === 'bank' ? 'bg-navy-800 text-white shadow-md' : 'text-navy-400 hover:text-navy-200'}`}
                  >
                    <Building2 className="w-4 h-4" /> Int&apos;l (Bank)
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {paymentMethod === 'upi' ? (
                    <m.div
                      key="upi"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center">
                        <div className="w-40 h-40 bg-gray-100 rounded-xl flex border-2 border-dashed border-gray-300 items-center justify-center p-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${formSettings?.payment?.upiId}&pn=Aishwarya&am=${formSettings?.fee?.replace(/[^0-9.]/g, '')}&cu=INR`}
                            alt="UPI QR Code"
                            className="w-full h-full"
                          />
                        </div>
                        <p className="text-navy-400 text-xs mt-4 font-medium uppercase tracking-widest">
                          Scan to Pay
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-navy-300 mb-2 block">
                          UPI ID
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-navy-950 px-4 py-3 rounded-xl text-gold-400 text-sm font-mono border border-navy-800">
                            {formSettings?.payment?.upiId || 'example@upi'}
                          </code>
                          <button
                            onClick={() =>
                              handleCopy(formSettings?.payment?.upiId || 'example@upi')
                            }
                            className="bg-navy-800 p-3 rounded-xl hover:bg-navy-700 transition-colors text-navy-200 hover:text-white"
                          >
                            {isCopied ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </m.div>
                  ) : (
                    <m.div
                      key="bank"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-navy-950 p-6 rounded-2xl space-y-4 border border-navy-800">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-navy-400 mb-1">
                            Account Name
                          </div>
                          <div className="font-medium text-white">
                            {formSettings?.payment?.bankDetails?.accountName || 'Name'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-navy-400 mb-1">
                            Account Number
                          </div>
                          <div className="font-mono text-gold-400">
                            {formSettings?.payment?.bankDetails?.accountNumber || '123456789'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-navy-400 mb-1">
                              IFSC Code
                            </div>
                            <div className="font-mono text-white">
                              {formSettings?.payment?.bankDetails?.ifsc || 'IFSC'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-navy-400 mb-1">
                              Bank Name
                            </div>
                            <div className="font-medium text-white">
                              {formSettings?.payment?.bankDetails?.bankName || 'Bank'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </m.div>
          )}

          {/* Dynamic Form Column */}
          <m.div
            initial={{ opacity: 0, x: requiresPayment ? 30 : 0, y: requiresPayment ? 0 : 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            className={`${requiresPayment ? 'lg:col-span-7' : 'max-w-3xl mx-auto w-full'}`}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-premium border border-slate-100">
                <div className="w-12 h-12 border-4 border-navy-100 border-t-gold-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-sm text-navy-400 font-medium">Loading form...</p>
              </div>
            ) : config ? (
              <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-2xl font-serif font-bold text-navy-900">{config.title}</h2>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    {config.description}
                  </p>
                </div>
                <DynamicForm
                  formSlug={config.form_slug}
                  fields={config.fields}
                  title={config.title}
                  successMessage={config.success_message}
                  requiresPayment={config.requires_payment}
                  paymentType={config.payment_type}
                  razorpayPlanId={config.razorpay_plan_id}
                  razorpayAmount={config.razorpay_amount}
                />
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl shadow-premium border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-2">Form Not Found</h3>
                <p className="text-slate-500 text-sm">
                  The form &apos;{slug}&apos; could not be loaded. It may have been disabled or
                  deleted.
                </p>
              </div>
            )}
          </m.div>
        </div>
      </SectionWrapper>
    </div>
  );
}
