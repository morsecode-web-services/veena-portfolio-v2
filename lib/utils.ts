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

/**
 * Extracts Google Drive File ID from various sharing URL formats
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;

  // Only check if it is genuinely a Google Drive URL
  const isGoogle =
    url.includes('drive.google.com') ||
    url.includes('docs.google.com') ||
    url.includes('drive.usercontent.google.com');

  if (!isGoogle) return null;

  // Pattern 1: /file/d/{id}/view, /file/d/{id}/preview, /file/d/{id}
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) return match1[1];

  // Pattern 2: ?id={id} or &id={id}
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2 && match2[1]) return match2[1];

  // Pattern 3: /d/{id}
  const match3 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match3 && match3[1]) return match3[1];

  return null;
}

/**
 * Returns Google Drive Preview iframe URL for embed
 */
export function getGoogleDriveEmbedUrl(url: string): string | null {
  const driveId = extractGoogleDriveId(url);
  if (!driveId) return null;
  return `https://drive.google.com/file/d/${driveId}/preview`;
}

/**
 * Returns Google Drive high-resolution thumbnail URL
 */
export function getGoogleDriveThumbnailUrl(url: string): string | null {
  const driveId = extractGoogleDriveId(url);
  if (!driveId) return null;
  return `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
}
