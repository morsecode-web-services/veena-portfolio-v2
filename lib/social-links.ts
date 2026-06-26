/**
 * Social Links Utility
 *
 * Provides device detection and platform-specific URL generation for social media links.
 * Handles deep linking into mobile apps (Instagram, etc.) with fallback to web URLs.
 */

export type DeviceType = 'ios' | 'android' | 'desktop';
export type LinkType = 'app_scheme' | 'intent' | 'https';

export interface SocialLinkConfig {
  href: string;
  target?: '_blank' | '_self';
  deviceType: DeviceType;
  linkType: LinkType;
}

/**
 * Detects the user's device type based on user agent and platform.
 * Safe for SSR - returns 'desktop' if navigator is undefined.
 *
 * @returns DeviceType - 'ios', 'android', or 'desktop'
 */
export function detectDevice(): DeviceType {
  // SSR safety: return default if navigator is undefined
  if (typeof navigator === 'undefined') {
    return 'desktop';
  }

  const userAgent = navigator.userAgent || navigator.vendor || '';
  const platform = navigator.platform || '';

  // iOS detection (iPhone, iPad, iPod)
  if (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  ) {
    return 'ios';
  }

  // Android detection
  if (/android/i.test(userAgent)) {
    return 'android';
  }

  // Default to desktop
  return 'desktop';
}

/**
 * Generates the appropriate Instagram URL based on device type.
 * Uses app deep links for mobile, HTTPS for desktop.
 *
 * @param username - Instagram username (without @)
 * @param device - Device type (ios, android, desktop)
 * @returns Instagram URL string
 */
export function getInstagramUrl(username: string, device: DeviceType): string {
  // Remove @ if present
  const cleanUsername = username.replace('@', '');

  switch (device) {
    case 'ios':
      // iOS app scheme - opens Instagram app directly to profile
      return `instagram://user?username=${cleanUsername}`;

    case 'android':
      // Android Intent URL - opens Instagram app or fallback to Play Store
      return `intent://www.instagram.com/${cleanUsername}/#Intent;package=com.instagram.android;scheme=https;end`;

    case 'desktop':
    default:
      // Standard HTTPS URL for desktop browsers
      return `https://www.instagram.com/${cleanUsername}/`;
  }
}

/**
 * Generates a complete link configuration for any social platform.
 * Provides href, target, device type, and link type for analytics.
 *
 * @param platform - Social platform name ('instagram', 'youtube', etc.)
 * @param url - The URL or username from config
 * @param device - Optional device type (auto-detected if not provided)
 * @returns SocialLinkConfig with href, target, deviceType, linkType
 */
export function getSocialLinkConfig(
  platform: string,
  url: string,
  device?: DeviceType
): SocialLinkConfig {
  const detectedDevice = device || detectDevice();

  // Special handling for Instagram
  if (platform === 'instagram') {
    // Extract username from URL or use as-is
    const username = url.includes('instagram.com/')
      ? url.split('instagram.com/')[1]?.replace('/', '') || url
      : url.replace('@', '');

    const href = getInstagramUrl(username, detectedDevice);

    // Determine link type based on device
    let linkType: LinkType;
    if (detectedDevice === 'ios') {
      linkType = 'app_scheme';
    } else if (detectedDevice === 'android') {
      linkType = 'intent';
    } else {
      linkType = 'https';
    }

    return {
      href,
      target: detectedDevice === 'desktop' ? '_self' : undefined,
      deviceType: detectedDevice,
      linkType,
    };
  }

  // Default behavior for other platforms (YouTube, Facebook, etc.)
  return {
    href: url,
    target: '_blank',
    deviceType: detectedDevice,
    linkType: 'https',
  };
}
