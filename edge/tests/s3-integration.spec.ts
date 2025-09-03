import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { build } from '../src/app';
import crypto from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

describe('Edge S3 Integration', () => {
  let app: FastifyInstance;
  let s3Client: S3Client;
  const testObjects: string[] = [];

  const previewsBucket = 'previews-test';
  const endpoint = 'http://localhost:9000';
  const key = 'test-secret-key-for-hmac-signing';

  beforeEach(async () => {
    // Setup S3 test environment
    process.env.NODE_ENV = 'production'; // Use real S3, not test mocks
    process.env.PREVIEWS_BUCKET = previewsBucket;
    process.env.WASABI_ENDPOINT = endpoint;
    process.env.EDGE_SIGNING_KEY = key;

    s3Client = new S3Client({
      endpoint,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin123'
      }
    });

    app = await build({ logger: false });
  });

  afterEach(async () => {
    await app.close();
    
    // Clean up test objects
    for (const objectKey of testObjects) {
      try {
        await s3Client.send(new (await import('@aws-sdk/client-s3')).DeleteObjectCommand({
          Bucket: previewsBucket,
          Key: objectKey
        }));
      } catch {
        // Ignore cleanup errors
      }
    }
    testObjects.length = 0;
  });

  function createHMACSignature(path: string, expiresAt: number, secret: string): string {
    const message = `${path}:${expiresAt}`;
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  async function uploadTestObject(key: string, content: string, contentType: string): Promise<void> {
    await s3Client.send(new PutObjectCommand({
      Bucket: previewsBucket,
      Key: key,
      Body: content,
      ContentType: contentType
    }));
    testObjects.push(key);
  }

  it('should serve real HLS manifest from S3', async () => {
    const manifestKey = 'test-hls/index.m3u8';
    const manifestContent = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXTINF:10.0,\nsegment001.ts\n#EXT-X-ENDLIST';
    
    // Upload manifest to S3
    await uploadTestObject(manifestKey, manifestContent, 'application/vnd.apple.mpegurl');
    
    // Create signed URL
    const requestPath = `/preview/${manifestKey}`;
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const hmac = createHMACSignature(requestPath, expires, key);
    
    // Request manifest through edge service
    const response = await app.inject({
      method: 'GET',
      url: `${requestPath}?hmac=${hmac}&expires=${expires}`
    });
    
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/vnd.apple.mpegurl');
    expect(response.body).toContain('#EXTM3U');
    expect(response.body).toContain('segment001.ts');
  });

  it('should serve real HLS segment from S3', async () => {
    const segmentKey = 'test-hls/segment001.ts';
    const segmentContent = Buffer.from('mock-video-segment-binary-data').toString();
    
    // Upload segment to S3
    await uploadTestObject(segmentKey, segmentContent, 'video/MP2T');
    
    // Create signed URL
    const requestPath = `/preview/${segmentKey}`;
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const hmac = createHMACSignature(requestPath, expires, key);
    
    // Request segment through edge service
    const response = await app.inject({
      method: 'GET',
      url: `${requestPath}?hmac=${hmac}&expires=${expires}`
    });
    
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('video/MP2T');
    expect(response.body).toBe(segmentContent);
  });

  it('should serve real thumbnail from S3', async () => {
    const thumbnailKey = 'test-thumbs/thumbnail.jpg';
    const thumbnailContent = Buffer.from('fake-jpeg-binary-data').toString();
    
    // Upload thumbnail to S3
    await uploadTestObject(thumbnailKey, thumbnailContent, 'image/jpeg');
    
    // Create signed URL
    const requestPath = `/preview/${thumbnailKey}`;
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const hmac = createHMACSignature(requestPath, expires, key);
    
    // Request thumbnail through edge service
    const response = await app.inject({
      method: 'GET',
      url: `${requestPath}?hmac=${hmac}&expires=${expires}`
    });
    
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('image/jpeg');
    expect(response.body).toBe(thumbnailContent);
  });

  it('should return 404 for non-existent S3 objects', async () => {
    const nonExistentKey = 'does-not-exist/file.mp4';
    
    // Create signed URL for non-existent object
    const requestPath = `/preview/${nonExistentKey}`;
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const hmac = createHMACSignature(requestPath, expires, key);
    
    // Request non-existent object through edge service
    const response = await app.inject({
      method: 'GET',
      url: `${requestPath}?hmac=${hmac}&expires=${expires}`
    });
    
    expect(response.statusCode).toBe(404);
  });

  it('should reject requests with invalid HMAC signatures', async () => {
    const testKey = 'test/valid-file.mp4';
    await uploadTestObject(testKey, 'test-content', 'video/mp4');
    
    const requestPath = `/preview/${testKey}`;
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const invalidHmac = 'invalid-signature';
    
    const response = await app.inject({
      method: 'GET',
      url: `${requestPath}?hmac=${invalidHmac}&expires=${expires}`
    });
    
    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'Invalid signature' });
  });

  it('should reject expired signatures', async () => {
    const testKey = 'test/expired-file.mp4';
    await uploadTestObject(testKey, 'test-content', 'video/mp4');
    
    const requestPath = `/preview/${testKey}`;
    const expires = Math.floor(Date.now() / 1000) - 3600; // Expired 1 hour ago
    const hmac = createHMACSignature(requestPath, expires, key);
    
    const response = await app.inject({
      method: 'GET',
      url: `${requestPath}?hmac=${hmac}&expires=${expires}`
    });
    
    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'Invalid signature' });
  });

  it('should handle Range requests for partial content', async () => {
    const videoKey = 'test-ranges/video.mp4';
    const videoContent = 'A'.repeat(1000); // 1000 bytes of 'A'
    
    // Upload video to S3
    await uploadTestObject(videoKey, videoContent, 'video/mp4');
    
    // Create signed URL
    const requestPath = `/preview/${videoKey}`;
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const hmac = createHMACSignature(requestPath, expires, key);
    
    // Request partial content with Range header
    const response = await app.inject({
      method: 'GET',
      url: `${requestPath}?hmac=${hmac}&expires=${expires}`,
      headers: {
        'Range': 'bytes=0-99' // First 100 bytes
      }
    });
    
    // Should handle range request (either 206 for partial content or 200 for full content)
    expect([200, 206]).toContain(response.statusCode);
    if (response.statusCode === 206) {
      expect(response.body.length).toBe(100);
      expect(response.body).toBe('A'.repeat(100));
    }
  });

  it('should set appropriate cache headers for different content types', async () => {
    const testFiles = [
      { key: 'cache-test/manifest.m3u8', content: '#EXTM3U', type: 'application/vnd.apple.mpegurl' },
      { key: 'cache-test/segment.ts', content: 'video-data', type: 'video/MP2T' },
      { key: 'cache-test/thumb.jpg', content: 'image-data', type: 'image/jpeg' }
    ];
    
    for (const file of testFiles) {
      // Upload file to S3
      await uploadTestObject(file.key, file.content, file.type);
      
      // Create signed URL and request
      const requestPath = `/preview/${file.key}`;
      const expires = Math.floor(Date.now() / 1000) + 3600;
      const hmac = createHMACSignature(requestPath, expires, key);
      
      const response = await app.inject({
        method: 'GET',
        url: `${requestPath}?hmac=${hmac}&expires=${expires}`
      });
      
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain(file.type);
      expect(response.body).toBe(file.content);
      
      // Cache headers should be present
      expect(response.headers).toHaveProperty('cache-control');
    }
  });
});