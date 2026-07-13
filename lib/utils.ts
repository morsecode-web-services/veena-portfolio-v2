import emailSpellChecker, { POPULAR_DOMAINS, POPULAR_TLDS } from '@zootools/email-spell-checker';

// General utility functions
export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
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
  const pattern1 =
    /(?:youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/)|youtu\.be\/)([^?&/]+)/;
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

/**
 * Validates if an email domain contains common typos and returns a suggestion.
 */
export function validateEmailTypo(email: string): {
  isValid: boolean;
  suggestion?: string;
  error?: string;
} {
  if (!email) return { isValid: true };

  let cleanedEmail = email.trim();
  let preCorrected = false;

  // Pre-correct common TLD typos where fuzzy match might fail/suggest '.co'
  const parts = cleanedEmail.split('@');
  if (parts.length === 2) {
    const localPart = parts[0];
    let domain = parts[1].toLowerCase();
    let domainChanged = false;

    if (domain.endsWith('.con')) {
      domain = domain.slice(0, -4) + '.com';
      domainChanged = true;
    } else if (domain.endsWith('.cmo')) {
      domain = domain.slice(0, -4) + '.com';
      domainChanged = true;
    } else if (domain.endsWith('.coom')) {
      domain = domain.slice(0, -5) + '.com';
      domainChanged = true;
    }

    if (domainChanged) {
      cleanedEmail = `${localPart}@${domain}`;
      preCorrected = true;
    }
  }

  const suggestion = emailSpellChecker.run({
    email: cleanedEmail,
    domains: POPULAR_DOMAINS,
    secondLevelDomains: ['gmail', 'yahoo', 'hotmail', 'mail', 'live', 'outlook'],
    topLevelDomains: [...POPULAR_TLDS, 'co.in', 'in'],
  });

  if (suggestion) {
    return {
      isValid: false,
      suggestion: suggestion.full,
      error: `Did you mean ${suggestion.domain}?`,
    };
  }

  if (preCorrected) {
    const suggestedDomain = cleanedEmail.split('@')[1];
    return {
      isValid: false,
      suggestion: cleanedEmail,
      error: `Did you mean ${suggestedDomain}?`,
    };
  }

  return { isValid: true };
}
