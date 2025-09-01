import { describe, it, expect } from 'vitest';
import { computeSignature, validSig } from '../src/sign';

describe('edge signing', () => {
  it('validates correct signature', () => {
    const path = '/s/previews/abc/index.m3u8';
    const exp = Math.floor(Date.now()/1000) + 600;
    const key = 'x'.repeat(64);
    const sig = computeSignature(path, key, exp);
    expect(validSig(path, exp, sig, key)).toBe(true);
  });
  it('rejects expired signature', () => {
    const path = '/s/previews/abc/index.m3u8';
    const exp = Math.floor(Date.now()/1000) - 10;
    const key = 'x'.repeat(64);
    const sig = computeSignature(path, key, exp);
    expect(validSig(path, exp, sig, key)).toBe(false);
  });
  it('rejects wrong signature', () => {
    const path = '/s/previews/abc/index.m3u8';
    const exp = Math.floor(Date.now()/1000) + 600;
    const key = 'x'.repeat(64);
    expect(validSig(path, exp, 'deadbeef', key)).toBe(false);
  });
});

