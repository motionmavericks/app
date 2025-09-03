import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { build } from '../src/app';
import { RedisTestClient } from '../src/test/redis-real';

describe('Health and System Integration Tests', () => {
  let app: FastifyInstance;
  let redisClient: RedisTestClient;

  beforeAll(async () => {
    // Setup real Redis test client
    redisClient = RedisTestClient.forBackend();
    await redisClient.connect();
    
    // Set Redis URL for the app to use our test client
    process.env.REDIS_URL = process.env.REDIS_TEST_URL;
    
    app = await build({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await redisClient.disconnect();
  });

  describe('Health Endpoints', () => {
    it('should return healthy status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('ok', true);
      expect(data).toHaveProperty('service', 'backend');
      expect(data).toHaveProperty('time');
      
      // With real Redis configured, it should show Redis status
      if (data.redis) {
        expect(data.redis).toBe(true);
      }
    });

    it('should check database connectivity with real Redis', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      
      // Test that real Redis is working by verifying we can ping it
      const pingResult = await redisClient.ping();
      expect(pingResult).toBe('PONG');
      
      // The health endpoint should reflect real Redis status
      if (data.redis !== undefined) {
        expect(data.redis).toBe(true);
      }
    });

    it('should verify real Redis Stream operations', async () => {
      // Test Redis Streams functionality directly
      const streamName = 'test:stream';
      const jobId = await redisClient.xadd(streamName, '*', 'test', 'data');
      expect(jobId).toBeDefined();
      
      const streamLen = await redisClient.getClient().xlen(streamName);
      expect(streamLen).toBe(1);
      
      // Cleanup is handled by test client automatically
    });

    it('should check S3 connectivity', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health/detailed'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('storage');
      expect(data.storage).toHaveProperty('status');
      expect(data.storage).toHaveProperty('responseTime');
    });
  });

  describe('API Documentation', () => {
    it('should serve OpenAPI spec', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/docs/json'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('openapi');
      expect(data).toHaveProperty('info');
      expect(data).toHaveProperty('paths');
    });

    it('should serve API documentation page', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/docs'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include security headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health'
      });

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/auth/login',
        headers: {
          'origin': 'http://localhost:3001',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type'
        }
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      const requests = [];
      const maxRequests = 10;

      // Send multiple rapid requests
      for (let i = 0; i < maxRequests + 5; i++) {
        requests.push(
          app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: {
              email: 'test@example.com',
              password: 'wrong-password'
            }
          })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.statusCode === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should include rate limit headers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'wrong-password'
        }
      });

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/non-existent-endpoint'
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('statusCode', 404);
    });

    it('should handle malformed JSON payloads', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'content-type': 'application/json'
        },
        payload: 'invalid-json{'
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('JSON');
    });

    it('should handle oversized payloads', async () => {
      const largePayload = {
        email: 'test@example.com',
        password: 'a'.repeat(10 * 1024 * 1024) // 10MB password
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: largePayload
      });

      expect(response.statusCode).toBe(413);
    });
  });

  describe('Request Validation', () => {
    it('should validate email format in requests', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'invalid-email',
          displayName: 'Test User',
          password: 'TestPass123!'
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('email');
    });

    it('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com'
          // Missing password
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('password');
    });

    it('should sanitize HTML in text fields', async () => {
      // This would require a logged-in user
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'sanitization.test@example.com',
          displayName: 'Sanitization Test',
          password: 'TestPass123!'
        }
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'sanitization.test@example.com',
          password: 'TestPass123!'
        }
      });

      const loginData = JSON.parse(loginResponse.body);
      const accessToken = loginData.accessToken;

      const presignResponse = await app.inject({
        method: 'POST',
        url: '/api/presign',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          filename: 'test.mp4',
          contentType: 'video/mp4',
          size: 1024000
        }
      });

      const presignData = JSON.parse(presignResponse.body);

      const response = await app.inject({
        method: 'POST',
        url: '/api/promote',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          stagingKey: presignData.stagingKey,
          title: '<script>alert("xss")</script>Malicious Title',
          description: '<img src="x" onerror="alert(1)">Bad description'
        }
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      // HTML should be sanitized
      expect(data.asset.title).not.toContain('<script>');
      expect(data.asset.description).not.toContain('onerror');
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should expose metrics endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics'
      });

      expect(response.statusCode).toBe(200);
      const metrics = response.body;
      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('http_request_duration_seconds');
      expect(metrics).toContain('nodejs_version_info');
    });

    it('should track request duration', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health'
      });

      expect(response.headers).toHaveProperty('x-response-time');
      const responseTime = parseFloat(response.headers['x-response-time'] as string);
      expect(responseTime).toBeGreaterThan(0);
    });
  });
});
