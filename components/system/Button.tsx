'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { m } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'sm' | 'base' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

/**
 * Unified Button component with consistent styling across the site
 *
 * @param variant - Button style variant (default: 'primary')
 * @param size - Button size (default: 'base')
 * @param isLoading - Shows loading spinner (default: false)
 * @param fullWidth - Makes button full width (default: false)
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'base',
      isLoading = false,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();

    // Base styles - common to all variants
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-300 touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

    // Size styles
    const sizeStyles = {
      sm: 'h-9 px-3 text-xs rounded-lg min-h-[36px]', // Slightly below 44px for compact UIs, still usable
      base: 'h-11 px-5 text-sm rounded-lg min-h-[44px]', // 44px minimum for touch
      lg: 'h-12 px-6 text-base rounded-lg min-h-[48px]', // Extra comfortable
    };

    // Variant styles
    const variantStyles = {
      primary:
        'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 shadow-premium hover:shadow-premium-lg focus:ring-navy-500',
      secondary:
        'bg-gold-500 text-navy-900 hover:bg-gold-600 active:bg-gold-700 shadow-premium hover:shadow-premium-lg focus:ring-gold-500',
      tertiary:
        'bg-cream-100 text-navy-900 hover:bg-cream-200 active:bg-cream-300 border border-cream-200 hover:border-cream-300 focus:ring-cream-500',
      ghost:
        'bg-transparent text-navy-900 hover:bg-navy-50 active:bg-navy-100 focus:ring-navy-500',
    };

    // Loading state overrides
    const loadingStyles = isLoading
      ? 'cursor-wait pointer-events-none opacity-75'
      : '';

    // Width styles
    const widthStyles = fullWidth ? 'w-full' : '';

    const combinedStyles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${loadingStyles} ${widthStyles} ${className}`.trim();

    const { onDrag, onDragStart, onDragEnd, ...buttonProps } = props as any;

    return (
      <m.button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedStyles}
        whileHover={
          !disabled && !isLoading && !shouldReduceMotion
            ? { scale: 1.02, y: -2 }
            : {}
        }
        whileTap={
          !disabled && !isLoading && !shouldReduceMotion ? { scale: 0.98 } : {}
        }
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...buttonProps}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </m.button>
    );
  }
);

Button.displayName = 'Button';
