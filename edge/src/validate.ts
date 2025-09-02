import crypto from 'crypto';

export function validateSignature(path: string, exp: number, sig: string, secret: string): boolean {
  if (!secret) return false;
  if (isExpired(exp)) return false;
  
  const message = `${path}|${exp}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(message).digest('hex');
  
  const a = Buffer.from(expectedSig);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  
  return crypto.timingSafeEqual(a, b);
}

export function isExpired(exp: number, toleranceSeconds?: number): boolean {
  const now = Date.now() / 1000;
  const tolerance = toleranceSeconds || 0;
  return now >= (exp + tolerance);
}
