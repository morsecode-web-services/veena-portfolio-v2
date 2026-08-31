/**
 * Security utilities for validating external requests and preventing SSRF.
 */

/**
 * Validates whether a URL is a safe, public external URL
 * to prevent Server-Side Request Forgery (SSRF).
 */
export function isSafePublicUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;

  try {
    const parsed = new URL(urlString);

    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block common internal/loopback/cloud metadata hostnames
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '169.254.169.254' || // Cloud metadata endpoint
      hostname === 'metadata.google.internal' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.localhost')
    ) {
      return false;
    }

    // Check private IPv4 ranges (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x)
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Pattern);
    if (match) {
      const a = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      if (
        a === 127 || // Loopback
        a === 10 || // 10.0.0.0/8
        (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
        (a === 192 && b === 168) || // 192.168.0.0/16
        (a === 169 && b === 254) || // 169.254.0.0/16 (link-local/metadata)
        a === 0
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
