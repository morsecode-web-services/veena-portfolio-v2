'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // When route changes complete, finish and reset the progress bar
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept click events on internal links and route pushes to start the progress bar immediately
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Only trigger for internal page transitions (not external or pure in-page hash links on same page)
      const isExternal =
        target.target === '_blank' ||
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:');
      const isSamePageHash = href.startsWith('#') || (href.startsWith('/#') && pathname === '/');

      if (!isExternal && !isSamePageHash && !href.startsWith('javascript:')) {
        // Only trigger if navigating to a different pathname
        const targetPath = href.split('?')[0].split('#')[0];
        if (targetPath !== pathname) {
          setIsNavigating(true);
          setProgress(25);
        }
      }
    };

    // Custom window event for programmatic navigation (like router.push)
    const handleNavigationStart = () => {
      setIsNavigating(true);
      setProgress(25);
    };

    window.addEventListener('click', handleDocumentClick, { capture: true });
    window.addEventListener('app:navigation-start', handleNavigationStart);

    return () => {
      window.removeEventListener('click', handleDocumentClick, { capture: true });
      window.removeEventListener('app:navigation-start', handleNavigationStart);
    };
  }, [pathname]);

  // Animate progress smoothly while navigating
  useEffect(() => {
    if (!isNavigating || progress >= 90) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 60) return prev + 15;
        if (prev < 85) return prev + 6;
        return prev;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isNavigating, progress]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100000] pointer-events-none h-[3px] bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-gold-500 via-gold-400 to-amber-300 transition-all duration-200 ease-out shadow-[0_0_10px_rgba(234,179,8,0.7)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition:
            progress === 100
              ? 'width 150ms ease-out, opacity 250ms ease-out 100ms'
              : 'width 200ms ease-out',
        }}
      />
    </div>
  );
}
