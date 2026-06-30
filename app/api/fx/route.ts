import { NextRequest, NextResponse } from 'next/server';
import { getTargetToINRRate, countryCurrencyMap, getFallbackRate } from '@/lib/fx';

/**
 * GET /api/fx
 *
 * Returns the exchange rate, local currency, and currency symbol.
 * If ?currency=XXX is passed in, it retrieves that specific currency config.
 * Otherwise, it detects based on the user's IP country header.
 * Rate indicates how many INR per 1 unit of local currency (e.g. 1 EUR = 90 INR).
 */
export async function GET(request: NextRequest) {
  // Check if a specific currency was requested manually
  const { searchParams } = new URL(request.url);
  const requestedCurrency = searchParams.get('currency')?.toUpperCase();

  // Geodetect based on IP country header
  const ipCountry =
    request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || 'IN';
  const resolvedCountry = ipCountry === 'XX' ? 'IN' : ipCountry;

  let targetCurrency = requestedCurrency;
  let targetSymbol = '$';

  if (targetCurrency) {
    // If it's INR, we just return INR configuration directly.
    if (targetCurrency === 'INR') {
      return NextResponse.json({
        rate: 1,
        currency: 'INR',
        symbol: '₹',
        base: 'INR',
        country: 'IN',
      });
    }
    // Find the symbol from our countryCurrencyMap
    const currencyObj = Object.values(countryCurrencyMap).find((c) => c.code === targetCurrency);
    targetSymbol = currencyObj?.symbol || '$';
  } else {
    const config = countryCurrencyMap[resolvedCountry] || countryCurrencyMap['US'];
    targetCurrency = config.code;
    targetSymbol = config.symbol;
  }

  // If the currency resolved is INR, return direct config
  if (targetCurrency === 'INR') {
    return NextResponse.json({ rate: 1, currency: 'INR', symbol: '₹', base: 'INR', country: 'IN' });
  }

  try {
    const rate = await getTargetToINRRate(targetCurrency);
    return NextResponse.json({
      rate,
      currency: targetCurrency,
      symbol: targetSymbol,
      base: 'INR',
      country: resolvedCountry,
    });
  } catch (error) {
    console.error(`[API/FX] Error fetching rate for ${targetCurrency}:`, error);
    const rate = getFallbackRate(targetCurrency);
    return NextResponse.json({
      rate,
      currency: targetCurrency,
      symbol: targetSymbol,
      base: 'INR',
      country: resolvedCountry,
    });
  }
}
