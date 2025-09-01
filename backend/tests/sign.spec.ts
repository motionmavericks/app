import { describe, it, expect } from 'vitest';
import { signEdgeUrl } from '../src/sign';

describe('backend edge url signing', () => {
  it('produces a valid signed url format', () => {
    const edgeBase = 'https://edge.example.com';
    const previewPrefix = 'previews/abc';
    const playlist = 'index.m3u8';
    const exp = Math.floor(Date.now()/1000) + 600;
    const key = 'y'.repeat(64);
    const url = signEdgeUrl(edgeBase, previewPrefix, playlist, exp, key);
    expect(url).toContain(edgeBase);
    expect(url).toContain(`/s/${previewPrefix}/${playlist}`);
    expect(url).toContain(`exp=${exp}`);
    expect(url).toMatch(/sig=[0-9a-f]{64}/);
  });
});

