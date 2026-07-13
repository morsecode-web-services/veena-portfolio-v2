import { describe, it, expect } from 'vitest';
import { validateEmailTypo } from './utils';

describe('validateEmailTypo', () => {
  it('should pass valid email addresses', () => {
    expect(validateEmailTypo('test@gmail.com')).toEqual({ isValid: true });
    expect(validateEmailTypo('user.name+label@yahoo.co.in')).toEqual({ isValid: true });
    expect(validateEmailTypo('someone@subdomain.outlook.com')).toEqual({ isValid: true });
    expect(validateEmailTypo('admin@example.org')).toEqual({ isValid: true });
    expect(validateEmailTypo('')).toEqual({ isValid: true });
  });

  it('should detect TLD-level typos', () => {
    const resCon = validateEmailTypo('test@gmail.con');
    expect(resCon.isValid).toBe(false);
    expect(resCon.suggestion).toBe('test@gmail.com');
    expect(resCon.error).toBe('Did you mean gmail.com?');

    const resCmo = validateEmailTypo('test@gmail.cmo');
    expect(resCmo.isValid).toBe(false);
    expect(resCmo.suggestion).toBe('test@gmail.com');
    expect(resCmo.error).toBe('Did you mean gmail.com?');

    const resCoom = validateEmailTypo('test@gmail.coom');
    expect(resCoom.isValid).toBe(false);
    expect(resCoom.suggestion).toBe('test@gmail.com');
    expect(resCoom.error).toBe('Did you mean gmail.com?');
  });

  it('should detect domain-level typos', () => {
    const resGamil = validateEmailTypo('test@gamil.com');
    expect(resGamil.isValid).toBe(false);
    expect(resGamil.suggestion).toBe('test@gmail.com');
    expect(resGamil.error).toBe('Did you mean gmail.com?');

    const resGmial = validateEmailTypo('test@gmial.com');
    expect(resGmial.isValid).toBe(false);
    expect(resGmial.suggestion).toBe('test@gmail.com');
    expect(resGmial.error).toBe('Did you mean gmail.com?');

    const resGmaill = validateEmailTypo('test@gmaill.com');
    expect(resGmaill.isValid).toBe(false);
    expect(resGmaill.suggestion).toBe('test@gmail.com');
    expect(resGmaill.error).toBe('Did you mean gmail.com?');

    const resYaho = validateEmailTypo('test@yaho.com');
    expect(resYaho.isValid).toBe(false);
    expect(resYaho.suggestion).toBe('test@yahoo.com');
    expect(resYaho.error).toBe('Did you mean yahoo.com?');

    const resHotmai = validateEmailTypo('test@hotmai.com');
    expect(resHotmai.isValid).toBe(false);
    expect(resHotmai.suggestion).toBe('test@hotmail.com');
    expect(resHotmai.error).toBe('Did you mean hotmail.com?');
  });

  it('should handle composite domain and TLD typos', () => {
    const resBoth = validateEmailTypo('test@gamil.con');
    expect(resBoth.isValid).toBe(false);
    expect(resBoth.suggestion).toBe('test@gmail.com');
    expect(resBoth.error).toBe('Did you mean gmail.com?');
  });
});
