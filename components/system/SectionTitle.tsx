'use client';

import { m } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  description?: string;
  alignment?: 'left' | 'center';
  showUnderline?: boolean;
  className?: string;
}

/**
 * Unified section title component with consistent heading pattern
 *
 * @param title - Main heading text
 * @param subtitle - Optional small uppercase subtitle (appears above title)
 * @param description - Optional description text (appears below title)
 * @param alignment - Text alignment (default: 'center')
 * @param showUnderline - Shows decorative underline (default: true)
 */
export function SectionTitle({
  title,
  subtitle,
  description,
  alignment = 'center',
  showUnderline = true,
  className = '',
}: SectionTitleProps) {
  const shouldReduceMotion = useReducedMotion();

  const alignmentStyles = {
    left: 'text-left',
    center: 'text-center',
  };

  const underlineAlignment = {
    left: '',
    center: 'mx-auto',
  };

  return (
    <m.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
      className={`mb-8 sm:mb-10 md:mb-12 ${alignmentStyles[alignment]} ${className}`.trim()}
    >
      {subtitle && (
        <p className="text-xs font-bold text-navy-400 uppercase tracking-[0.3em] mb-3">
          {subtitle}
        </p>
      )}

      <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-navy-900 mb-3 px-4">
        {title}
      </h2>

      {showUnderline && (
        <div
          className={`w-20 sm:w-24 h-1 bg-gradient-gold rounded-full ${underlineAlignment[alignment]}`}
        />
      )}

      {description && (
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mt-4 px-4 leading-relaxed mx-auto">
          {description}
        </p>
      )}
    </m.div>
  );
}
