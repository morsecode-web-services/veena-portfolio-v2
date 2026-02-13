'use client';

import { useState, useEffect, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import DynamicForm, { FormField } from '@/components/features/DynamicForm';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import siteConfig from '@/public/config/site-config.json';
import { supabase } from '@/lib/supabase';

import { SectionWrapper } from '@/components/system/SectionWrapper';
import { SectionTitle } from '@/components/system/SectionTitle';

interface FormConfig {
  form_slug: string;
  title: string;
  description: string;
  fields: FormField[];
}

export default function Contact() {
  const [activeTab, setActiveTab] = useState<'classes' | 'performance'>('classes');
  const [configs, setConfigs] = useState<Record<string, FormConfig>>({});
  const [isLoading, setIsLoading] = useState(true);

  const contactImage = siteConfig?.contact?.imageUrl || '/images/contact/contact-image.jpg';
  const contactImageAlt = siteConfig?.contact?.imageAlt || 'Contact';

  const defaultConfigs: Record<string, FormConfig> = useMemo(() => ({
    classes: {
      form_slug: 'classes',
      title: 'Join a Class',
      description: 'Interested in learning Veena? Fill out the details below.',
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
        { name: 'phone', label: 'Phone Number', type: 'text', required: true, placeholder: '+91 ...' },
        { name: 'experience', label: 'Prior Experience', type: 'select', required: true, options: ['Beginner', 'Intermediate', 'Advanced'] },
        { name: 'message', label: 'Additional Notes', type: 'textarea', required: false, placeholder: 'Tell me about your musical journey...' }
      ]
    },
    performance: {
      form_slug: 'performance',
      title: 'Performance Inquiry',
      description: 'Book a performance or discuss collaboration opportunities.',
      fields: [
        { name: 'name', label: 'Full Name / Organization', type: 'text', required: true, placeholder: 'Your name or group' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
        { name: 'phone', label: 'Phone Number', type: 'text', required: true, placeholder: '+91 ...' },
        { name: 'date', label: 'Event Date', type: 'date', required: false },
        { name: 'message', label: 'Details', type: 'textarea', required: true, placeholder: 'Tell me about the event or collaboration...' }
      ]
    }
  }), []);

  useEffect(() => {
    async function fetchConfigs() {
      try {
        const { data, error } = await supabase
          .from('form_configs')
          .select('*')
          .eq('is_active', true);

        if (error) {
          console.warn('Supabase configuration not found, using local defaults:', error);
          setConfigs(defaultConfigs);
          return;
        }

        if (!data || data.length === 0) {
          console.warn('No active form configs found in Supabase, using local defaults.');
          setConfigs(defaultConfigs);
          return;
        }

        const configMap = data.reduce((acc, config) => {
          acc[config.form_slug] = config;
          return acc;
        }, {} as Record<string, FormConfig>);

        setConfigs(configMap);
      } catch (err) {
        console.warn('Network issue or exception fetching configs, using local defaults:', err);
        setConfigs(defaultConfigs);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfigs();
  }, [defaultConfigs]);

  // Generate tabs dynamically from loaded configs
  const tabs = Object.values(configs).map(config => ({
    id: config.form_slug,
    label: config.title, // Use full title
    fullTitle: config.title
  }));

  // Handle deep linking from query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const formSlug = searchParams.get('form');

    if (formSlug && Object.keys(configs).length > 0) {
      if (configs[formSlug]) {
        setActiveTab(formSlug as any);
        // Scroll to contact section
        const contactSection = document.getElementById('contact');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else if (Object.keys(configs).length > 0 && !configs[activeTab]) {
      setActiveTab(Object.keys(configs)[0] as any);
    }
  }, [configs, activeTab]);

  return (
    <SectionWrapper id="contact" background="white" spacing="base">
      <SectionTitle
        title="Start a Conversation"
        // subtitle="Inquiries"
        alignment="center"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-8 sm:mt-12">
        {/* Left - Image & Info (4 cols) */}
        <m.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-12 xl:col-span-5 space-y-8 order-last xl:order-first"
        >
          <div className="relative aspect-square sm:aspect-[16/9] lg:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-premium-xl group">
            <ImageWithFallback
              src={contactImage}
              alt={contactImageAlt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <p className="text-sm font-light opacity-90 leading-relaxed italic">
                &quot;Music should strike fire from the heart of man, and bring tears from the eyes of woman.&quot;
              </p>
            </div>
          </div>

          <div className="flex flex-row justify-center gap-8 py-2 border-y border-slate-50">
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-0.5">Location</span>
              <span className="text-xs font-semibold text-navy-900">Bangalore, India</span>
            </div>
            <div className="w-px h-8 bg-slate-100 self-center" />
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-0.5">Response</span>
              <span className="text-xs font-semibold text-navy-900">24-48 Hours</span>
            </div>
          </div>
        </m.div>

        {/* Right - Tabs & Form (7 cols) */}
        <m.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-12 xl:col-span-7 order-first xl:order-last"
        >
          {/* Tab Switcher */}
          {tabs.length > 0 && (
            <div className="flex flex-wrap p-1.5 bg-navy-50/50 rounded-2xl mb-8 max-w-lg mx-auto sm:mx-0 border border-navy-100 items-stretch gap-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-center leading-tight ${activeTab === tab.id
                    ? 'bg-white text-navy-900 shadow-premium scale-[1.02]'
                    : 'text-navy-400 hover:text-navy-600'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {isLoading ? (
              <m.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-premium border border-slate-100"
              >
                <div className="w-12 h-12 border-4 border-navy-100 border-t-gold-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-sm text-navy-400 font-medium">Preparing forms...</p>
              </m.div>
            ) : configs[activeTab] ? (
              <m.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              >
                <DynamicForm
                  formSlug={configs[activeTab].form_slug}
                  fields={configs[activeTab].fields}
                  title={configs[activeTab].title}
                  description={configs[activeTab].description}
                />
              </m.div>
            ) : (
              <m.div
                key="error"
                className="p-8 text-center bg-white rounded-2xl shadow-premium border border-slate-100"
              >
                <p className="text-navy-400">Unable to load the inquiry form. Please try again later.</p>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      </div>
    </SectionWrapper>
  );
}
