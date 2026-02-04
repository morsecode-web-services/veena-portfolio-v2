// General utility functions
export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Debounce function to limit the rate at which a function can fire
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns Debounced function
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
 * Extracts YouTube Video ID from various URL formats
 * Supports: watch?v=, embed/, youtu.be/, live/, shorts/, etc.
 */
export function extractYoutubeId(url: string): string | null {
  if (!url) return null;

  // Pattern 1: Standard, Embed, Live, Shorts, V
  const pattern1 = /(?:youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/)|youtu\.be\/)([^?&/]+)/;
  const match1 = url.match(pattern1);
  if (match1 && match1[1]) return match1[1];

  // Pattern 2: Fallback for watch URLs with other parameters
  const pattern2 = /[?&]v=([^?&/]+)/;
  const match2 = url.match(pattern2);
  if (match2 && match2[1]) return match2[1];

  // Pattern 3: Simple youtu.be fallback
  if (url.includes('youtu.be/')) {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1].split(/[?&]/)[0];
    if (lastPart) return lastPart;
  }

  return null;
}
