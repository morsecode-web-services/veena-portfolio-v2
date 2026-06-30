/**
 * FX Rate Utility
 *
 * Fetches live exchange rates from the Frankfurter API (ECB data, no API key required).
 * Rates are cached in-memory for 1 hour to avoid hammering the API on every checkout request.
 */

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const countryCurrencyMap: Record<string, { code: string; symbol: string }> = {
  IN: { code: 'INR', symbol: '₹' },
  US: { code: 'USD', symbol: '$' },
  GB: { code: 'GBP', symbol: '£' },
  AU: { code: 'AUD', symbol: 'A$' },
  CA: { code: 'CAD', symbol: 'C$' },
  SG: { code: 'SGD', symbol: 'S$' },
  CH: { code: 'CHF', symbol: 'CHF' },
  MY: { code: 'MYR', symbol: 'RM' },
  // Eurozone
  DE: { code: 'EUR', symbol: '€' },
  FR: { code: 'EUR', symbol: '€' },
  IT: { code: 'EUR', symbol: '€' },
  ES: { code: 'EUR', symbol: '€' },
  NL: { code: 'EUR', symbol: '€' },
  BE: { code: 'EUR', symbol: '€' },
  AT: { code: 'EUR', symbol: '€' },
  IE: { code: 'EUR', symbol: '€' },
  FI: { code: 'EUR', symbol: '€' },
};

interface CacheEntry {
  rate: number;
  timestamp: number;
}

// In-memory cache for multiple currencies
const rateCache: Record<string, CacheEntry> = {};

export function getFallbackRate(targetCurrency: string): number {
  const fallbacks: Record<string, number> = {
    USD: 83,
    EUR: 90,
    GBP: 106,
    AUD: 55,
    CAD: 61,
    SGD: 61,
    CHF: 93,
    MYR: 18,
  };
  return fallbacks[targetCurrency] || 83;
}

/**
 * Returns the exchange rate from a Target Currency to INR (e.g. 1 EUR = 90 INR).
 */
export async function getTargetToINRRate(targetCurrency: string): Promise<number> {
  const now = Date.now();
  const cached = rateCache[targetCurrency];

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.rate;
  }

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${targetCurrency}&to=INR`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Frankfurter API responded with ${res.status}`);

    const data = await res.json();
    const rate = data?.rates?.INR;

    if (typeof rate !== 'number' || rate <= 0) {
      throw new Error(`Invalid rate received for ${targetCurrency}`);
    }

    rateCache[targetCurrency] = { rate, timestamp: now };
    console.info(`[FX] Live rate fetched: 1 ${targetCurrency} = ₹${rate}`);
    return rate;
  } catch (err) {
    const fallbackRate = getFallbackRate(targetCurrency);
    console.warn(
      `[FX] Failed to fetch live rate for ${targetCurrency}, using fallback (${fallbackRate}):`,
      err
    );
    return fallbackRate;
  }
}

/**
 * Compatibility wrapper: returns USD → INR exchange rate
 */
export async function getUSDtoINRRate(): Promise<number> {
  return getTargetToINRRate('USD');
}

/**
 * Converts an INR amount in paise to the target currency cents using the live exchange rate.
 */
export async function paiseToTargetCents(paise: number, targetCurrency: string): Promise<number> {
  const rate = await getTargetToINRRate(targetCurrency);
  const inr = paise / 100;
  const targetVal = inr / rate;
  return Math.round(targetVal * 100); // round to nearest cent
}

/**
 * Compatibility wrapper: converts INR paise to USD cents
 */
export async function paiseToUSDCents(paise: number): Promise<number> {
  return paiseToTargetCents(paise, 'USD');
}
