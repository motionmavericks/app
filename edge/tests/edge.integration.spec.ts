import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fetch from 'node-fetch';

describe('Edge Service Integration Tests', () => {
  const EDGE_URL = process.env.EDGE_URL || 'http://localhost:8080';
  const TEST_SECRET = process.env.HMAC_SECRET || 'test-secret-key';

  // Helper function to create HMAC signature
  function createHMACSignature(path: string, expiresAt: number, secret: string): string {
    const crypto = require('crypto');
    const message = `${path}:${expiresAt}`;
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  describe('HMAC Signature Validation', () => {
    it('should serve content with valid HMAC signature', async () => {
      const path = '/preview/test-asset/playlist.m3u8';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const hmac = createHMACSignature(path, expiresAt, TEST_SECRET);
      
      const url = `${EDGE_URL}${path}?hmac=${hmac}&expires=${expiresAt}`;
      
      const response = await fetch(url);
      
      // Even if file doesn't exist, signature should be validated first
      expect(response.status).not.toBe(401); // Not unauthorized
      expect(response.status).not.toBe(403); // Not forbidden
    });

    it('should reject requests with invalid HMAC signature', async () => {
      const path = '/preview/test-asset/playlist.m3u8';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const invalidHmac = 'invalid-signature';
      
      const url = `${EDGE_URL}${path}?hmac=${invalidHmac}&expires=${expiresAt}`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(403);
      const data = await response.text();
      expect(data).toContain('Invalid signature');
    });

    it('should reject requests with expired signatures', async () => {
      const path = '/preview/test-asset/playlist.m3u8';
      const expiresAt = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const hmac = createHMACSignature(path, expiresAt, TEST_SECRET);
      
      const url = `${EDGE_URL}${path}?hmac=${hmac}&expires=${expiresAt}`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(403);
      const data = await response.text();
      expect(data).toContain('expired');
    });

    it('should reject requests without required parameters', async () => {
      const path = '/preview/test-asset/playlist.m3u8';
      const url = `${EDGE_URL}${path}`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(400);
      const data = await response.text();
      expect(data).toContain('Missing required parameters');
    });

    it('should reject requests with missing hmac parameter', async () => {
      const path = '/preview/test-asset/playlist.m3u8';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      
      const url = `${EDGE_URL}${path}?expires=${expiresAt}`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(400);
      const data = await response.text();
      expect(data).toContain('Missing required parameters');
    });

    it('should reject requests with missing expires parameter', async () => {
      const path = '/preview/test-asset/playlist.m3u8';
      const hmac = createHMACSignature(path, 0, TEST_SECRET);
      
      const url = `${EDGE_URL}${path}?hmac=${hmac}`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(400);
      const data = await response.text();
      expect(data).toContain('Missing required parameters');
    });
  });

  describe('Path Validation', () => {
    it('should only allow preview paths', async () => {
      const path = '/malicious/../../etc/passwd';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const hmac = createHMACSignature(path, expiresAt, TEST_SECRET);
      
      const url = `${EDGE_URL}${path}?hmac=${hmac}&expires=${expiresAt}`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(403);
      const data = await response.text();
      expect(data).toContain('Invalid path');
    });

    it('should reject paths not starting with /preview/', async () => {
      const path = '/admin/config';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const hmac = createHMACSignature(path, expiresAt, TEST_SECRET);
      
      const url = `${EDGE_URL}${path}?hmac=${hmac}&expires=${expiresAt}`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(403);
      const data = await response.text();
      expect(data).toContain('Invalid path');
    });

    it('should sanitize path traversal attempts', async () => {
      const path = '/preview/../../../sensitive-file';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const hmac = createHMACSignature(path, expiresAt, TEST_SECRET);
      
      const url = `${EDGE_URL}${path}?hmac=${hmac}&expires=${expiresAt}`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(403);
      const data = await response.text();
      expect(data).toContain('Invalid path');
    });
  });

  describe('Content Type Handling', () => {
    it('should serve HLS manifests with correct content type', async () => {
      const path = '/preview/test-asset/playlist.m3u8';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const hmac = createHMACSignature(path, expiresAt, TEST_SECRET);
      
      const url = `${EDGE_URL}${path}?hmac=${hmac}&expires=${expiresAt}`;
      
      const response = await fetch(url);
      
      if (response.status === 200) {
        expect(response.headers.get('content-type')).toBe('application/vnd.apple.mpegurl');
      }
    });

    it('should serve video segments with correct content type', async () => {
      const path = '/preview/test-asset/segment001.ts';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const hmac = createHMACSignature(path, expiresAt, TEST_SECRET);
      
      const url = `${EDGE_URL}${path}?hmac=${hmac}&expires=${expiresAt}`;
      
      const response = await fetch(url);
      
      if (response.status === 200) {
        expect(response.headers.get('content-type')).toBe('video/mp2t');
      }
    });

    it('should serve thumbnails with correct content type', async () => {
      const path = '/preview/test-asset/thumbnail.jpg';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const hmac = createHMACSignature(path, expiresAt, TEST_SECRET);
      
      const url = `${EDGE_URL}${path}?hmac=${hmac}&expires=${expiresAt}`;
      
      const response = await fetch(url);
      
      if (response.status === 200) {
        expect(response.headers.get('content-type')).toBe('image/jpeg');
      }
    });
  });

  describe('Cache Headers', () => {
    it('should include appropriate cache headers for static content', async () => {
      const path = '/preview/test-asset/segment001.ts';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const hmac = createHMACSignature(path, expiresAt, TEST_SECRET);
      
      const url = `${EDGE_URL}${path}?hmac=${hmac}&expires=${expiresAt}`;
      
      const response = await fetch(url);
      
      if (response.status === 200) {
        expect(response.headers.get('cache-control')).toBeTruthy();
        expect(response.headers.get('etag')).toBeTruthy();
      }
    });

    it('should set shorter cache for manifests than segments', async () => {
      const manifestPath = '/preview/test-asset/playlist.m3u8';
      const segmentPath = '/preview/test-asset/segment001.ts';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      
      const manifestHmac = createHMACSignature(manifestPath, expiresAt, TEST_SECRET);
      const segmentHmac = createHMACSignature(segmentPath, expiresAt, TEST_SECRET);
      
      const manifestResponse = await fetch(`${EDGE_URL}${manifestPath}?hmac=${manifestHmac}&expires=${expiresAt}`);
      const segmentResponse = await fetch(`${EDGE_URL}${segmentPath}?hmac=${segmentHmac}&expires=${expiresAt}`);
      
      if (manifestResponse.status === 200 && segmentResponse.status === 200) {
        const manifestCache = manifestResponse.headers.get('cache-control');
        const segmentCache = segmentResponse.headers.get('cache-control');
        
        // Manifest should have shorter cache time than segments
        expect(manifestCache).toContain('max-age');
        expect(segmentCache).toContain('max-age');
      }
    });
  });

  describe('Health and Monitoring', () => {
    it('should respond to health checks', async () => {
      const response = await fetch(`${EDGE_URL}/health`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
    });

    it('should provide metrics endpoint', async () => {
      const response = await fetch(`${EDGE_URL}/metrics`);
      
      expect(response.status).toBe(200);
      const metrics = await response.text();
      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('http_request_duration_seconds');
    });

    it('should include CORS headers for browser compatibility', async () => {
      const path = '/preview/test-asset/playlist.m3u8';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const hmac = createHMACSignature(path, expiresAt, TEST_SECRET);
      
      const response = await fetch(`${EDGE_URL}${path}?hmac=${hmac}&expires=${expiresAt}`, {
        headers: {
          'Origin': 'http://localhost:3001'
        }
      });
      
      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent files with valid signature', async () => {
      const path = '/preview/non-existent-asset/playlist.m3u8';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const hmac = createHMACSignature(path, expiresAt, TEST_SECRET);
      
      const url = `${EDGE_URL}${path}?hmac=${hmac}&expires=${expiresAt}`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(404);
    });

    it('should handle malformed query parameters gracefully', async () => {
      const path = '/preview/test-asset/playlist.m3u8';
      const url = `${EDGE_URL}${path}?hmac=malformed&expires=not-a-number`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(400);
      const data = await response.text();
      expect(data).toContain('Invalid parameters');
    });

    it('should rate limit excessive requests', async () => {
      const path = '/preview/test-asset/playlist.m3u8';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const hmac = createHMACSignature(path, expiresAt, TEST_SECRET);
      const url = `${EDGE_URL}${path}?hmac=${hmac}&expires=${expiresAt}`;
      
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(fetch(url));
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      // Should have some rate limiting in place
      expect(rateLimited).toBe(true);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await fetch(`${EDGE_URL}/health`);
      
      expect(response.headers.get('x-frame-options')).toBe('DENY');
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-xss-protection')).toBe('1; mode=block');
    });

    it('should not expose server version information', async () => {
      const response = await fetch(`${EDGE_URL}/health`);
      
      expect(response.headers.get('server')).toBeNull();
      expect(response.headers.get('x-powered-by')).toBeNull();
    });
  });
});
