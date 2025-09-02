import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { build } from '../src/app';

describe('Assets Integration Tests', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let testUserId: string;
  let testAssetId: string;

  beforeAll(async () => {
    app = await build({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Create and authenticate a test user
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'assets.test@example.com',
        displayName: 'Assets Test User',
        password: 'TestPass123!'
      }
    });

    const userData = JSON.parse(registerResponse.body);
    testUserId = userData.user.id;

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'assets.test@example.com',
        password: 'TestPass123!'
      }
    });

    const loginData = JSON.parse(loginResponse.body);
    accessToken = loginData.accessToken;
  });

  afterEach(async () => {
    // Cleanup test data
    await cleanupTestData();
  });

  async function cleanupTestData() {
    try {
      await app.inject({
        method: 'DELETE',
        url: '/api/test/cleanup',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  describe('Asset Presign URLs', () => {
    it('should generate presign URL for upload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/presign',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          filename: 'test-video.mp4',
          contentType: 'video/mp4',
          size: 1024000
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('uploadUrl');
      expect(data).toHaveProperty('stagingKey');
      expect(data).toHaveProperty('fields');
      expect(data.uploadUrl).toContain('amazonaws.com');
      expect(data.stagingKey).toMatch(/^staging\//);
    });

    it('should reject presign request without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/presign',
        payload: {
          filename: 'test-video.mp4',
          contentType: 'video/mp4',
          size: 1024000
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject presign request with invalid file type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/presign',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          filename: 'test-file.exe',
          contentType: 'application/x-executable',
          size: 1024000
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('file type');
    });

    it('should reject presign request with oversized file', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/presign',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          filename: 'huge-file.mp4',
          contentType: 'video/mp4',
          size: 50 * 1024 * 1024 * 1024 // 50GB
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('size');
    });
  });

  describe('Asset Promotion', () => {
    let stagingKey: string;

    beforeEach(async () => {
      // First get a presign URL to create a staging asset
      const presignResponse = await app.inject({
        method: 'POST',
        url: '/api/presign',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          filename: 'test-promotion.mp4',
          contentType: 'video/mp4',
          size: 1024000
        }
      });

      const presignData = JSON.parse(presignResponse.body);
      stagingKey = presignData.stagingKey;
    });

    it('should promote staging asset to masters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/promote',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          stagingKey: stagingKey,
          title: 'Test Promoted Asset',
          description: 'A test asset for promotion testing'
        }
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.asset).toHaveProperty('id');
      expect(data.asset).toHaveProperty('title', 'Test Promoted Asset');
      expect(data.asset).toHaveProperty('stagingKey', stagingKey);
      expect(data.asset).toHaveProperty('masterKey');
      expect(data.asset.masterKey).toMatch(/^masters\//);
      
      testAssetId = data.asset.id;
    });

    it('should reject promotion without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/promote',
        payload: {
          stagingKey: stagingKey,
          title: 'Test Asset'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject promotion with non-existent staging key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/promote',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          stagingKey: 'staging/non-existent-key',
          title: 'Test Asset'
        }
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('not found');
    });
  });

  describe('Asset Management', () => {
    beforeEach(async () => {
      // Create a test asset for management tests
      const presignResponse = await app.inject({
        method: 'POST',
        url: '/api/presign',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          filename: 'test-management.mp4',
          contentType: 'video/mp4',
          size: 1024000
        }
      });

      const presignData = JSON.parse(presignResponse.body);

      const promoteResponse = await app.inject({
        method: 'POST',
        url: '/api/promote',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          stagingKey: presignData.stagingKey,
          title: 'Test Management Asset',
          description: 'Asset for management testing'
        }
      });

      const promoteData = JSON.parse(promoteResponse.body);
      testAssetId = promoteData.asset.id;
    });

    it('should list user assets', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/assets',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('items');
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThan(0);
      expect(data.items[0]).toHaveProperty('id');
      expect(data.items[0]).toHaveProperty('title');
      expect(data.items[0]).not.toHaveProperty('password_hash');
    });

    it('should get specific asset by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/assets/${testAssetId}`,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('id', testAssetId);
      expect(data).toHaveProperty('title', 'Test Management Asset');
      expect(data).toHaveProperty('description', 'Asset for management testing');
      expect(data).toHaveProperty('owner_id', testUserId);
    });

    it('should update asset metadata', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/assets/${testAssetId}`,
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          title: 'Updated Asset Title',
          description: 'Updated description',
          metadata: {
            tags: ['test', 'updated'],
            category: 'testing'
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('title', 'Updated Asset Title');
      expect(data).toHaveProperty('description', 'Updated description');
      expect(data.metadata).toHaveProperty('tags');
      expect(data.metadata.tags).toContain('test');
      expect(data.metadata.tags).toContain('updated');
    });

    it('should reject asset access from unauthorized user', async () => {
      // Create another user
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'unauthorized@example.com',
          displayName: 'Unauthorized User',
          password: 'TestPass123!'
        }
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'unauthorized@example.com',
          password: 'TestPass123!'
        }
      });

      const loginData = JSON.parse(loginResponse.body);
      const unauthorizedToken = loginData.accessToken;

      const response = await app.inject({
        method: 'GET',
        url: `/api/assets/${testAssetId}`,
        headers: {
          authorization: `Bearer ${unauthorizedToken}`
        }
      });

      expect(response.statusCode).toBe(403);
    });

    it('should delete asset', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/assets/${testAssetId}`,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(200);

      // Verify asset is deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/assets/${testAssetId}`,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(getResponse.statusCode).toBe(404);
    });
  });

  describe('Preview URLs', () => {
    beforeEach(async () => {
      // Create a test asset with preview
      const presignResponse = await app.inject({
        method: 'POST',
        url: '/api/presign',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          filename: 'test-preview.mp4',
          contentType: 'video/mp4',
          size: 1024000
        }
      });

      const presignData = JSON.parse(presignResponse.body);

      const promoteResponse = await app.inject({
        method: 'POST',
        url: '/api/promote',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          stagingKey: presignData.stagingKey,
          title: 'Test Preview Asset'
        }
      });

      const promoteData = JSON.parse(promoteResponse.body);
      testAssetId = promoteData.asset.id;
    });

    it('should generate signed preview URL', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sign-preview',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          assetId: testAssetId,
          expiresIn: 3600 // 1 hour
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('signedUrl');
      expect(data).toHaveProperty('expiresAt');
      expect(data.signedUrl).toContain('hmac');
      expect(data.signedUrl).toContain('expires');
    });

    it('should reject preview URL for non-existent asset', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sign-preview',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        payload: {
          assetId: '00000000-0000-0000-0000-000000000000',
          expiresIn: 3600
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject preview URL without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sign-preview',
        payload: {
          assetId: testAssetId,
          expiresIn: 3600
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Asset Search and Filtering', () => {
    beforeEach(async () => {
      // Create multiple test assets with different properties
      const testAssets = [
        { filename: 'video1.mp4', title: 'First Video', contentType: 'video/mp4' },
        { filename: 'image1.jpg', title: 'First Image', contentType: 'image/jpeg' },
        { filename: 'audio1.mp3', title: 'First Audio', contentType: 'audio/mpeg' },
        { filename: 'video2.mp4', title: 'Second Video', contentType: 'video/mp4' }
      ];

      for (const asset of testAssets) {
        const presignResponse = await app.inject({
          method: 'POST',
          url: '/api/presign',
          headers: {
            authorization: `Bearer ${accessToken}`
          },
          payload: {
            filename: asset.filename,
            contentType: asset.contentType,
            size: 1024000
          }
        });

        const presignData = JSON.parse(presignResponse.body);

        await app.inject({
          method: 'POST',
          url: '/api/promote',
          headers: {
            authorization: `Bearer ${accessToken}`
          },
          payload: {
            stagingKey: presignData.stagingKey,
            title: asset.title,
            metadata: {
              type: asset.contentType.split('/')[0]
            }
          }
        });
      }
    });

    it('should filter assets by type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/assets?type=video',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.items.length).toBe(2);
      data.items.forEach((asset: any) => {
        expect(asset.mime).toContain('video');
      });
    });

    it('should search assets by title', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/assets?search=First',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.items.length).toBe(3);
      data.items.forEach((asset: any) => {
        expect(asset.title).toContain('First');
      });
    });

    it('should paginate assets', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/assets?limit=2&offset=0',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.items.length).toBe(2);
      expect(data).toHaveProperty('total');
      expect(data.total).toBeGreaterThanOrEqual(4);
    });

    it('should sort assets by creation date', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/assets?sort=created_at&order=desc',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.items.length).toBeGreaterThan(1);
      
      // Verify descending order
      for (let i = 1; i < data.items.length; i++) {
        const current = new Date(data.items[i].created_at);
        const previous = new Date(data.items[i - 1].created_at);
        expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
      }
    });
  });
});
