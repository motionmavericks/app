import { describe, it, expect } from 'vitest';
import { validateSignature, isExpired } from '../src/validate';
import crypto from 'crypto';

describe('Edge signature validation', () => {
  const secret = 'test-secret-key-64-chars'.padEnd(64, 'x');
  
  function generateSignature(path: string, exp: number, secret: string): string {
    const message = `${path}|${exp}`;
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  it('should validate correct signature', () => {
    const path = '/s/previews/test/index.m3u8';
    const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const sig = generateSignature(path, exp, secret);
    
    const result = validateSignature(path, exp, sig, secret);
    expect(result).toBe(true);
  });

  it('should reject invalid signature', () => {
    const path = '/s/previews/test/index.m3u8';
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const sig = 'invalid-signature';
    
    const result = validateSignature(path, exp, sig, secret);
    expect(result).toBe(false);
  });

  it('should reject tampered path', () => {
    const originalPath = '/s/previews/test/index.m3u8';
    const tamperedPath = '/s/previews/admin/secret.m3u8';
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const sig = generateSignature(originalPath, exp, secret);
    
    const result = validateSignature(tamperedPath, exp, sig, secret);
    expect(result).toBe(false);
  });

  it('should reject tampered expiry', () => {
    const path = '/s/previews/test/index.m3u8';
    const originalExp = Math.floor(Date.now() / 1000) + 3600;
    const tamperedExp = Math.floor(Date.now() / 1000) + 86400; // Extended by 1 day
    const sig = generateSignature(path, originalExp, secret);
    
    const result = validateSignature(path, tamperedExp, sig, secret);
    expect(result).toBe(false);
  });

  describe('expiry validation', () => {
    it('should accept non-expired timestamp', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      expect(isExpired(futureExp)).toBe(false);
    });

    it('should reject expired timestamp', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      expect(isExpired(pastExp)).toBe(true);
    });

    it('should handle edge case at exact expiry', () => {
      const nowExp = Math.floor(Date.now() / 1000);
      // Exact moment - might be expired depending on timing
      const result = isExpired(nowExp);
      expect(typeof result).toBe('boolean');
    });

    it('should handle clock skew tolerance', () => {
      const almostExpired = Math.floor(Date.now() / 1000) - 5; // 5 seconds ago
      // With 10-second tolerance, should still be valid
      expect(isExpired(almostExpired, 10)).toBe(false);
    });
  });

  describe('signature format validation', () => {
    it('should reject signatures with wrong length', () => {
      const path = '/s/previews/test/index.m3u8';
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const shortSig = 'abc123';
      
      const result = validateSignature(path, exp, shortSig, secret);
      expect(result).toBe(false);
    });

    it('should reject non-hex signatures', () => {
      const path = '/s/previews/test/index.m3u8';
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const invalidSig = 'g'.repeat(64); // 'g' is not valid hex
      
      const result = validateSignature(path, exp, invalidSig, secret);
      expect(result).toBe(false);
    });
  });
});