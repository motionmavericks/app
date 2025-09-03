import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { setupDatabase } from '../tests/setup-db.js';
import { UserFactory, AssetFactory } from '../test/factories/index.js';
import { testDb } from '../test/db-real.js';

describe('Assets with Real Database', () => {
  beforeAll(async () => {
    await setupDatabase.initialize();
  });

  afterAll(async () => {
    await setupDatabase.close();
  });

  beforeEach(async () => {
    await setupDatabase.startTransaction();
  });

  afterEach(async () => {
    await setupDatabase.cleanup();
  });
  describe('Asset Operations', () => {
    it('should create asset with real data', async () => {
      const user = await UserFactory.create();
      const asset = await AssetFactory.create(user.id, {
        filename: 'test-video.mp4',
        content_type: 'video/mp4'
      });

      expect(asset).toMatchObject({
        user_id: user.id,
        filename: 'test-video.mp4',
        content_type: 'video/mp4',
        mime_type: 'video/mp4'
      });
      expect(asset.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(asset.file_size).toBeGreaterThan(0);
      expect(asset.created_at).toBeInstanceOf(Date);
    });

    it('should create different asset types', async () => {
      const user = await UserFactory.create();

      const imageAsset = await AssetFactory.createImage(user.id);
      expect(imageAsset.mime_type).toBe('image/jpeg');
      expect(imageAsset.content_type).toBe('image/jpeg');

      const videoAsset = await AssetFactory.createVideo(user.id);
      expect(videoAsset.mime_type).toBe('video/mp4');
      expect(videoAsset.content_type).toBe('video/mp4');
    });

    it('should find assets by user', async () => {
      const user1 = await UserFactory.create();
      const user2 = await UserFactory.create();

      await AssetFactory.create(user1.id);
      await AssetFactory.create(user1.id);
      await AssetFactory.create(user2.id);

      const user1Assets = await AssetFactory.findByUserId(user1.id);
      const user2Assets = await AssetFactory.findByUserId(user2.id);

      expect(user1Assets).toHaveLength(2);
      expect(user2Assets).toHaveLength(1);

      user1Assets.forEach(asset => {
        expect(asset.user_id).toBe(user1.id);
      });
    });

    it('should update asset master key', async () => {
      const user = await UserFactory.create();
      const asset = await AssetFactory.create(user.id);

      const newMasterKey = 'masters/updated-video.mp4';
      const updatedAsset = await AssetFactory.updateMasterKey(asset.id, newMasterKey);

      expect(updatedAsset.master_key).toBe(newMasterKey);
      expect(updatedAsset.id).toBe(asset.id);
      expect(new Date(updatedAsset.updated_at).getTime()).toBeGreaterThan(
        new Date(asset.updated_at).getTime()
      );
    });

    it('should handle asset metadata', async () => {
      const user = await UserFactory.create();
      const metadata = { 
        duration: 300, 
        width: 1920, 
        height: 1080, 
        codec: 'h264',
        bitrate: 5000
      };

      const asset = await AssetFactory.create(user.id, { metadata });

      expect(asset.metadata).toEqual(metadata);

      // Query metadata directly
      const result = await testDb.query(
        'SELECT metadata FROM assets WHERE id = $1',
        [asset.id]
      );
      
      expect(result.rows[0].metadata).toEqual(metadata);
    });

    it('should delete assets', async () => {
      const user = await UserFactory.create();
      const asset = await AssetFactory.create(user.id);

      await AssetFactory.delete(asset.id);

      const deletedAsset = await AssetFactory.findById(asset.id);
      expect(deletedAsset).toBeNull();
    });
  });

  describe('Complex Asset Queries', () => {
    it('should query assets with user details', async () => {
      const user = await UserFactory.create({ email: 'owner@example.com' });
      const asset = await AssetFactory.create(user.id);

      const result = await testDb.query(`
        SELECT a.*, u.email as owner_email, u.display_name as owner_name
        FROM assets a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = $1
      `, [asset.id]);

      expect(result.rows).toHaveLength(1);
      const assetWithOwner = result.rows[0];

      expect(assetWithOwner).toMatchObject({
        id: asset.id,
        user_id: user.id,
        owner_email: 'owner@example.com',
        owner_name: user.display_name
      });
    });

    it('should filter assets by content type', async () => {
      const user = await UserFactory.create();

      await AssetFactory.createImage(user.id);
      await AssetFactory.createImage(user.id);
      await AssetFactory.createVideo(user.id);

      const imageAssets = await testDb.query(`
        SELECT * FROM assets 
        WHERE user_id = $1 AND content_type LIKE 'image/%'
        ORDER BY created_at DESC
      `, [user.id]);

      const videoAssets = await testDb.query(`
        SELECT * FROM assets 
        WHERE user_id = $1 AND content_type LIKE 'video/%'
        ORDER BY created_at DESC
      `, [user.id]);

      expect(imageAssets.rows).toHaveLength(2);
      expect(videoAssets.rows).toHaveLength(1);

      imageAssets.rows.forEach((asset: any) => {
        expect(asset.content_type).toMatch(/^image\//);
      });

      videoAssets.rows.forEach((asset: any) => {
        expect(asset.content_type).toMatch(/^video\//);
      });
    });

    it('should handle concurrent asset operations', async () => {
      const user = await UserFactory.create();

      // Create multiple assets concurrently
      const assetPromises = Array.from({ length: 5 }, (_, i) =>
        AssetFactory.create(user.id, { filename: `concurrent-${i}.mp4` })
      );

      const assets = await Promise.all(assetPromises);

      expect(assets).toHaveLength(5);
      assets.forEach((asset, i) => {
        expect(asset.filename).toBe(`concurrent-${i}.mp4`);
        expect(asset.user_id).toBe(user.id);
      });

      const userAssets = await AssetFactory.findByUserId(user.id);
      expect(userAssets).toHaveLength(5);
    });
  });
});