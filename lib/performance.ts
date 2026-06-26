/**
 * Performance monitoring utilities
 * Helps track and optimize application performance
 */

/**
 * Report Web Vitals to console in development
 * Can be extended to send to analytics in production
 */
export function reportWebVitals(metric: {
  id: string;
  name: string;
  label: string;
  value: number;
}) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}:`, metric.value);
  }

  // In production, you could send to analytics service
  // Example: sendToAnalytics(metric);
}

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string, callback: () => void) {
  const startTime = performance.now();
  callback();
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (process.env.NODE_ENV === 'development' && duration > 16) {
    // Warn if render takes longer than one frame (16ms at 60fps)
    console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms (>16ms)`);
  }
}

/**
 * Debounce function for scroll and resize handlers
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for high-frequency events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Preload critical resources
 */
export function preloadResource(url: string, type: 'image' | 'video' | 'script' | 'style') {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = type;
  document.head.appendChild(link);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
