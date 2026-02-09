'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect user's motion preferences
 * Returns true if user prefers reduced motion
 * @returns {boolean} shouldReduceMotion
 */
export function useReducedMotion(): boolean {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    // Check if matchMedia is supported (not available in SSR)
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setShouldReduceMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = () => {
      setShouldReduceMotion(mediaQuery.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return shouldReduceMotion;
}
