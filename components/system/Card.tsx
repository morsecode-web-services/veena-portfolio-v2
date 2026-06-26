'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { m } from 'framer-motion';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'base' | 'lg';
  hoverable?: boolean;
  children: React.ReactNode;
}

/**
 * Unified Card component with consistent styling across the site
 *
 * @param variant - Card style variant (default: 'default')
 * @param padding - Card padding (default: 'base')
 * @param hoverable - Adds hover lift effect (default: false)
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'base',
      hoverable = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'rounded-xl transition-all duration-300';

    // Variant styles
    const variantStyles = {
      default: 'bg-white shadow-premium',
      elevated: 'bg-white shadow-premium-lg',
      outlined: 'bg-white border border-navy-100',
    };

    // Padding styles
    const paddingStyles = {
      none: '',
      sm: 'p-4',
      base: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8',
    };

    // Hover styles
    const hoverStyles = hoverable
      ? 'hover:shadow-premium-lg hover:-translate-y-1 cursor-pointer'
      : '';

    const combinedStyles =
      `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`.trim();

    // Use motion.div for hoverable cards for smooth animation
    if (hoverable) {
      const { onDrag, onDragStart, onDragEnd, ...divProps } = props as any;

      return (
        <m.div
          ref={ref}
          className={combinedStyles}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          {...divProps}
        >
          {children}
        </m.div>
      );
    }

    return (
      <div ref={ref} className={combinedStyles} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
