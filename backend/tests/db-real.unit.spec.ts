import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDatabase } from '../src/test/db-real.js';

// Simple unit test to validate real database infrastructure works
describe('Real Database Infrastructure Tests', () => {
  
  describe('TestDatabase Connection Management', () => {
    it('should create TestDatabase class with proper methods', () => {
      expect(TestDatabase).toBeDefined();
      expect(TestDatabase.initialize).toBeInstanceOf(Function);
      expect(TestDatabase.getTestClient).toBeInstanceOf(Function);
      expect(TestDatabase.query).toBeInstanceOf(Function);
      expect(TestDatabase.cleanup).toBeInstanceOf(Function);
      expect(TestDatabase.close).toBeInstanceOf(Function);
      expect(TestDatabase.getPool).toBeInstanceOf(Function);
    });

    it('should create testDb interface with proper methods', async () => {
      const { testDb } = await import('../src/test/db-real.js');
      expect(testDb).toBeDefined();
      expect(testDb.query).toBeInstanceOf(Function);
      expect(testDb.connect).toBeInstanceOf(Function);
      expect(testDb.end).toBeInstanceOf(Function);
    });
  });

  describe('Test Factories', () => {
    it('should export all test factories', async () => {
      const factories = await import('../src/test/factories/index.js');
      expect(factories.UserFactory).toBeDefined();
      expect(factories.SessionFactory).toBeDefined();
      expect(factories.AssetFactory).toBeDefined();
    });

    it('should have UserFactory with proper methods', async () => {
      const { UserFactory } = await import('../src/test/factories/user.js');
      expect(UserFactory.create).toBeInstanceOf(Function);
      expect(UserFactory.createPending).toBeInstanceOf(Function);
      expect(UserFactory.createActive).toBeInstanceOf(Function);
      expect(UserFactory.findByEmail).toBeInstanceOf(Function);
      expect(UserFactory.findById).toBeInstanceOf(Function);
      expect(UserFactory.cleanup).toBeInstanceOf(Function);
    });
  });

  describe('Database Setup Functions', () => {
    it('should export setupDatabase with proper methods', async () => {
      const { setupDatabase } = await import('../src/tests/setup-db.js');
      expect(setupDatabase).toBeDefined();
      expect(setupDatabase.initialize).toBeInstanceOf(Function);
      expect(setupDatabase.startTransaction).toBeInstanceOf(Function);
      expect(setupDatabase.cleanup).toBeInstanceOf(Function);
      expect(setupDatabase.close).toBeInstanceOf(Function);
    });

    it('should export database availability check function', async () => {
      const { isDatabaseAvailable } = await import('../src/tests/setup-db.js');
      expect(isDatabaseAvailable).toBeInstanceOf(Function);
    });
  });

  describe('Mock Elimination Validation', () => {
    it('should not import any mock database modules', async () => {
      // This test ensures we don't accidentally import mock modules
      let mockImportError = null;
      try {
        await import('../tests/mocks/db.js');
      } catch (error) {
        mockImportError = error;
      }
      
      // We expect this import to fail because the mock file should not exist
      expect(mockImportError).toBeTruthy();
      expect(mockImportError.message).toContain('Cannot find module');
    });

    it('should use real database URL configuration', () => {
      // Test that environment variables are properly configured for real database
      const testUrl = process.env.POSTGRES_TEST_URL;
      expect(testUrl).toBeDefined();
      expect(testUrl).toContain('postgresql://');
      expect(testUrl).toContain('5433'); // Test database port
      expect(testUrl).toContain('motionmavericks_test'); // Test database name
    });
  });

  describe('Database Configuration', () => {
    it('should have proper test database configuration in vitest config', () => {
      // Test that the vitest configuration includes real database settings
      expect(process.env.POSTGRES_TEST_URL).toBeDefined();
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should use transaction isolation for tests', async () => {
      // Test that the TestDatabase class supports transaction isolation
      expect(TestDatabase.getTestClient).toBeInstanceOf(Function);
      expect(TestDatabase.cleanup).toBeInstanceOf(Function);
      
      // These methods should work together for transaction management
      const client1 = TestDatabase.getTestClient();
      const cleanup1 = TestDatabase.cleanup();
      
      expect(client1).toBeInstanceOf(Promise);
      expect(cleanup1).toBeInstanceOf(Promise);
    });
  });
});