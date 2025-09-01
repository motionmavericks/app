import crypto from 'node:crypto';

export function computeSignature(path: string, key: string, exp: number): string {
  const h = crypto.createHmac('sha256', key);
  h.update(`${path}?exp=${exp}`);
  return h.digest('hex');
}

export function validSig(path: string, exp: number, sig: string, key: string): boolean {
  if (!key) return false;
  if (Date.now() / 1000 >= exp) return false;
  const hex = computeSignature(path, key, exp);
  const a = Buffer.from(hex);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
