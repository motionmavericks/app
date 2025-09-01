import crypto from 'node:crypto';

export function signEdgeUrl(edgeBase: string, previewPrefix: string, playlist: string, exp: number, key: string): string {
  const path = `/s/${previewPrefix.replace(/^\//,'')}/${playlist}`;
  const h = crypto.createHmac('sha256', key);
  h.update(`${path}?exp=${exp}`);
  const sig = h.digest('hex');
  return `${edgeBase.replace(/\/$/,'')}${path}?exp=${exp}&sig=${sig}`;
}

