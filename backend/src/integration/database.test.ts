import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { setupDatabase } from '../tests/setup-db.js';
import { testDb } from '../test/db-real.js';
import { UserFactory, AssetFactory, SessionFactory } from '../test/factories/index.js';

describe('Real Database Integration Tests', () => {
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
  describe('Database Connection', () => {
    it('should connect to test database', async () => {
      const result = await testDb.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });

    it('should have schema tables', async () => {
      const tables = await testDb.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);

      const tableNames = tables.rows.map((row: any) => row.table_name);
      
      // Check essential tables exist
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('sessions');
      expect(tableNames).toContain('assets');
      expect(tableNames).toContain('roles');
      expect(tableNames).toContain('user_roles');
      
      // Check advanced tables exist
      expect(tableNames).toContain('folders');
      expect(tableNames).toContain('collections');
      expect(tableNames).toContain('tags');
      expect(tableNames).toContain('custom_fields');
    });
  });

  describe('Transaction Isolation', () => {
    it('should isolate data between tests', async () => {
      // Create user in this test
      const user = await UserFactory.create({ email: 'isolation-test@example.com' });
      expect(user.email).toBe('isolation-test@example.com');

      // Data should exist in current transaction
      const found = await UserFactory.findByEmail('isolation-test@example.com');
      expect(found).toBeTruthy();
    });

    it('should not see data from previous test', async () => {
      // Data from previous test should not exist (rolled back)
      const found = await UserFactory.findByEmail('isolation-test@example.com');
      expect(found).toBeNull();
    });
  });

  describe('Cross-Entity Operations', () => {
    it('should handle user-session-asset workflow', async () => {
      // Create user
      const user = await UserFactory.create({
        email: 'workflow@example.com',
        display_name: 'Workflow User'
      });

      // Create session for user
      const session = await SessionFactory.create(user.id);
      expect(session.user_id).toBe(user.id);

      // Create assets for user
      const imageAsset = await AssetFactory.createImage(user.id);
      const videoAsset = await AssetFactory.createVideo(user.id);

      expect(imageAsset.user_id).toBe(user.id);
      expect(videoAsset.user_id).toBe(user.id);

      // Query all user data with joins
      const result = await testDb.query(`
        SELECT 
          u.id as user_id,
          u.email,
          u.display_name,
          COUNT(DISTINCT s.id) as session_count,
          COUNT(DISTINCT a.id) as asset_count
        FROM users u
        LEFT JOIN sessions s ON u.id = s.user_id
        LEFT JOIN assets a ON u.id = a.user_id
        WHERE u.email = $1
        GROUP BY u.id, u.email, u.display_name
      `, ['workflow@example.com']);

      const userSummary = result.rows[0];
      expect(userSummary).toMatchObject({
        user_id: user.id,
        email: 'workflow@example.com',
        display_name: 'Workflow User',
        session_count: '1',  // PostgreSQL returns count as string
        asset_count: '2'
      });
    });

    it('should handle referential integrity', async () => {
      const user = await UserFactory.create();
      const asset = await AssetFactory.create(user.id);

      // Trying to delete user with assets should fail (or cascade)
      try {
        await testDb.query('DELETE FROM users WHERE id = $1', [user.id]);
        
        // If it succeeds, assets should be deleted too (CASCADE)
        const remainingAsset = await AssetFactory.findById(asset.id);
        expect(remainingAsset).toBeNull();
      } catch (error) {
        // If it fails, that's also valid (RESTRICT)
        expect((error as Error).message).toContain('violates foreign key constraint');
      }
    });
  });

  describe('Performance and Concurrent Access', () => {
    it('should handle concurrent user creation', async () => {
      const userPromises = Array.from({ length: 10 }, (_, i) =>
        UserFactory.create({
          email: `concurrent-${i}@example.com`,
          display_name: `Concurrent User ${i}`
        })
      );

      const users = await Promise.all(userPromises);

      expect(users).toHaveLength(10);
      
      // Verify all users have unique IDs and emails
      const ids = users.map(u => u.id);
      const emails = users.map(u => u.email);
      
      expect(new Set(ids).size).toBe(10); // All unique
      expect(new Set(emails).size).toBe(10); // All unique
    });

    it('should handle bulk operations efficiently', async () => {
      const user = await UserFactory.create();
      
      const startTime = Date.now();
      
      // Create 50 assets for the user
      const assetPromises = Array.from({ length: 50 }, (_, i) =>
        AssetFactory.create(user.id, {
          filename: `bulk-asset-${i}.mp4`
        })
      );

      const assets = await Promise.all(assetPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(assets).toHaveLength(50);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
      
      // Verify all assets exist in database
      const userAssets = await AssetFactory.findByUserId(user.id);
      expect(userAssets).toHaveLength(50);
    });
  });
});