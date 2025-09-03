import { testDb } from '../db-real.js';
import crypto from 'crypto';

export interface TestAsset {
  id: string;
  user_id: string;
  staging_key: string;
  master_key?: string;
  filename: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  mime_type: string;
  metadata: any;
  folder_id?: string;
  created_at: Date;
  updated_at: Date;
}

export class AssetFactory {
  static async create(userId: string, overrides: Partial<TestAsset> = {}): Promise<TestAsset> {
    const assetId = crypto.randomUUID();
    const randomSuffix = crypto.randomBytes(4).toString('hex');

    const assetData = {
      id: assetId,
      user_id: userId,
      staging_key: `staging/test-${randomSuffix}.mp4`,
      master_key: `masters/test-${randomSuffix}.mp4`,
      filename: `test-video-${randomSuffix}.mp4`,
      original_filename: `original-video-${randomSuffix}.mp4`,
      file_size: 1024 * 1024 * 10, // 10MB
      content_type: 'video/mp4',
      mime_type: 'video/mp4',
      metadata: { duration: 120, width: 1920, height: 1080 },
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };

    // Insert asset into database
    const result = await testDb.query(`
      INSERT INTO assets (
        id, user_id, staging_key, master_key, filename, original_filename,
        file_size, content_type, mime_type, metadata, folder_id, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      assetData.id,
      assetData.user_id,
      assetData.staging_key,
      assetData.master_key,
      assetData.filename,
      assetData.original_filename,
      assetData.file_size,
      assetData.content_type,
      assetData.mime_type,
      JSON.stringify(assetData.metadata),
      assetData.folder_id,
      assetData.created_at,
      assetData.updated_at
    ]);

    return result.rows[0];
  }

  static async createImage(userId: string, overrides: Partial<TestAsset> = {}): Promise<TestAsset> {
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    return this.create(userId, {
      ...overrides,
      staging_key: `staging/test-image-${randomSuffix}.jpg`,
      master_key: `masters/test-image-${randomSuffix}.jpg`,
      filename: `test-image-${randomSuffix}.jpg`,
      original_filename: `original-image-${randomSuffix}.jpg`,
      content_type: 'image/jpeg',
      mime_type: 'image/jpeg',
      file_size: 1024 * 500, // 500KB
      metadata: { width: 1920, height: 1080, format: 'JPEG' }
    });
  }

  static async createVideo(userId: string, overrides: Partial<TestAsset> = {}): Promise<TestAsset> {
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    return this.create(userId, {
      ...overrides,
      staging_key: `staging/test-video-${randomSuffix}.mp4`,
      master_key: `masters/test-video-${randomSuffix}.mp4`,
      filename: `test-video-${randomSuffix}.mp4`,
      original_filename: `original-video-${randomSuffix}.mp4`,
      content_type: 'video/mp4',
      mime_type: 'video/mp4',
      file_size: 1024 * 1024 * 50, // 50MB
      metadata: { duration: 300, width: 1920, height: 1080, codec: 'h264' }
    });
  }

  static async createInFolder(userId: string, folderId: string, overrides: Partial<TestAsset> = {}): Promise<TestAsset> {
    return this.create(userId, {
      ...overrides,
      folder_id: folderId
    });
  }

  static async findById(id: string): Promise<TestAsset | null> {
    const result = await testDb.query('SELECT * FROM assets WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByUserId(userId: string): Promise<TestAsset[]> {
    const result = await testDb.query('SELECT * FROM assets WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  }

  static async updateMasterKey(assetId: string, masterKey: string): Promise<TestAsset> {
    const result = await testDb.query(`
      UPDATE assets 
      SET master_key = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `, [masterKey, assetId]);
    return result.rows[0];
  }

  static async delete(assetId: string): Promise<void> {
    await testDb.query('DELETE FROM assets WHERE id = $1', [assetId]);
  }

  static async cleanup(): Promise<void> {
    // This will be handled by transaction rollback in test cleanup
    // No explicit cleanup needed for real data
  }
}