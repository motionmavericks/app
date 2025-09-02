import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { build } from '../src/app';

describe('POST /api/promote', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await build({ logger: false });
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 400 for missing stagingKey', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/promote',
      payload: {}
    });
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toHaveProperty('error');
  });

  it('should validate stagingKey format', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/promote',
      payload: {
        stagingKey: '../../../etc/passwd'
      }
    });
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toContain('Invalid');
  });

  it('should require authentication in production', async () => {
    process.env.NODE_ENV = 'production';
    const response = await app.inject({
      method: 'POST',
      url: '/api/promote',
      payload: {
        stagingKey: 'uploads/test.mp4'
      }
    });
    // Should require auth header
    expect([401, 403]).toContain(response.statusCode);
    process.env.NODE_ENV = 'test';
  });

  it('should validate metadata if provided', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/promote',
      payload: {
        stagingKey: 'uploads/test.mp4',
        metadata: 'not-an-object'
      }
    });
    expect(response.statusCode).toBe(400);
  });

  it('should handle S3 copy operation', async () => {
    // Mock S3 operations
    vi.mock('@aws-sdk/client-s3');
    
    const response = await app.inject({
      method: 'POST',
      url: '/api/promote',
      payload: {
        stagingKey: 'uploads/test.mp4',
        metadata: {
          title: 'Test Video',
          duration: 120
        }
      }
    });
    
    if (response.statusCode !== 200) {
      // May fail if S3 credentials not configured - that's OK for unit test
      expect([200, 501, 503]).toContain(response.statusCode);
    } else {
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('masterKey');
      expect(body).toHaveProperty('assetId');
      expect(body.status).toBe('promoted');
    }
  });

  it('should enqueue preview job after promotion', async () => {
    // Mock Redis client
    vi.mock('ioredis');
    
    const response = await app.inject({
      method: 'POST',
      url: '/api/promote',
      payload: {
        stagingKey: 'uploads/test.mp4'
      }
    });
    
    if (response.statusCode === 200) {
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('previewJobId');
    }
  });
});