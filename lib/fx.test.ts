import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('FX Rate Utility', () => {
  let paiseToTargetCents: any;
  let getFallbackRate: any;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.resetModules();
    // Re-import after resetting modules to get a fresh internal cache
    const fx = await import('./fx');
    paiseToTargetCents = fx.paiseToTargetCents;
    getFallbackRate = fx.getFallbackRate;
  });

  it('should return correct fallback rates', () => {
    expect(getFallbackRate('USD')).toBe(83);
    expect(getFallbackRate('EUR')).toBe(90);
    expect(getFallbackRate('GBP')).toBe(106);
    expect(getFallbackRate('XYZ')).toBe(83);
  });

  it('should convert INR paise to target currency cents correctly', async () => {
    // With rate of 1 USD = 80 INR
    vi.spyOn(global, 'fetch').mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ rates: { INR: 80 } }),
      } as Response)
    );

    // ₹100.00 (10000 paise) should be $1.25 USD (125 cents) at rate of 80
    const cents = await paiseToTargetCents(10000, 'USD');
    expect(cents).toBe(125);
  });

  it('should fallback gracefully when fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    // Should use fallback rate 83 for USD
    // ₹100.00 (10000 paise) at rate 83 = 100 / 83 * 100 = 120 cents
    const cents = await paiseToTargetCents(10000, 'USD');
    expect(cents).toBe(120);
  });
});
