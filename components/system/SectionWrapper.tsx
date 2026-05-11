'use client';

import { HTMLAttributes } from 'react';

export interface SectionWrapperProps extends HTMLAttributes<HTMLElement> {
  background?: 'white' | 'cream' | 'navy' | 'transparent';
  spacing?: 'sm' | 'base' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

/**
 * Unified section wrapper component with consistent layout and spacing
 *
 * @param background - Section background color (default: 'white')
 * @param spacing - Vertical padding (default: 'base')
 * @param fullWidth - Removes max-width constraint (default: false)
 */
export function SectionWrapper({
  background = 'white',
  spacing = 'base',
  fullWidth = false,
  className = '',
  children,
  id,
  ...props
}: SectionWrapperProps) {
  // Background styles
  const backgroundStyles = {
    white: 'bg-white',
    cream: 'bg-cream-50',
    navy: 'bg-navy-950 text-white',
    transparent: 'bg-transparent',
  };

  // Vertical padding styles
  const spacingStyles = {
    sm: 'py-6 sm:py-8 md:py-10',
    base: 'py-8 sm:py-11 md:py-14',
    lg: 'py-10 sm:py-14 md:py-18',
  };

  // Container styles
  const containerStyles = fullWidth
    ? 'w-full px-4 sm:px-6 md:px-8'
    : 'max-w-7xl mx-auto px-4 sm:px-6 md:px-8';

  return (
    <section
      id={id}
      className={`${backgroundStyles[background]} ${spacingStyles[spacing]} ${className}`.trim()}
      role="region"
      aria-label={id ? id.charAt(0).toUpperCase() + id.slice(1) : undefined}
      {...props}
    >
      <div className={containerStyles}>{children}</div>
    </section>
  );
}
