import { Pool, PoolClient } from 'pg';
import crypto from 'crypto';

// Real PostgreSQL test database connections
export class TestDatabase {
  private static pool: Pool;
  private static client: PoolClient | null = null;
  private static inTransaction = false;

  // Initialize test database pool
  static async initialize(): Promise<void> {
    if (this.pool) return;

    const testUrl = process.env.POSTGRES_TEST_URL || 'postgresql://postgres:postgres@localhost:5433/motionmavericks_test';
    
    this.pool = new Pool({
      connectionString: testUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Test connection
    const testClient = await this.pool.connect();
    await testClient.query('SELECT 1');
    testClient.release();
  }

  // Get dedicated test client with transaction isolation
  static async getTestClient(): Promise<PoolClient> {
    if (!this.pool) {
      await this.initialize();
    }

    if (this.client && this.inTransaction) {
      return this.client;
    }

    // Start fresh transaction for test isolation
    this.client = await this.pool.connect();
    await this.client.query('BEGIN');
    this.inTransaction = true;

    return this.client;
  }

  // Execute query with test isolation
  static async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getTestClient();
    return client.query(text, params);
  }

  // Rollback and cleanup after test
  static async cleanup(): Promise<void> {
    if (this.client && this.inTransaction) {
      try {
        await this.client.query('ROLLBACK');
      } catch (error) {
        // Ignore rollback errors
      }
      this.client.release();
      this.client = null;
      this.inTransaction = false;
    }
  }

  // Close all connections (for test suite teardown)
  static async close(): Promise<void> {
    await this.cleanup();
    if (this.pool) {
      await this.pool.end();
    }
  }

  // Get raw pool for direct access if needed
  static getPool(): Pool {
    return this.pool;
  }
}

// Real test database connection that mimics the production db.ts interface
export const testDb = {
  query: async (text: string, params?: any[]) => {
    return TestDatabase.query(text, params);
  },
  connect: async () => {
    const client = await TestDatabase.getTestClient();
    return {
      query: async (text: string, params?: any[]) => {
        return client.query(text, params);
      },
      release: () => {
        // Don't release during tests - we manage the transaction lifecycle
      }
    };
  },
  end: async () => {
    await TestDatabase.close();
  }
};