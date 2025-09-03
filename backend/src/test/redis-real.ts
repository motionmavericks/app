/**
 * Real Redis Test Client - Backend Service
 * 
 * Provides real Redis connections with database isolation for testing.
 * Uses Redis DB 0 for backend tests, with proper cleanup utilities.
 */

import IORedis, { Redis } from 'ioredis';

export interface RedisTestConfig {
  db: number;
  maxRetries: number;
  retryDelayMs: number;
  connectionTimeout: number;
}

export class RedisTestClient {
  private client: Redis;
  private testKeys: Set<string> = new Set();
  private testStreams: Set<string> = new Set();
  private testGroups: Map<string, string[]> = new Map(); // stream -> groups
  private config: RedisTestConfig;

  constructor(config: Partial<RedisTestConfig> = {}) {
    this.config = {
      db: 0, // Backend tests use DB 0
      maxRetries: 3,
      retryDelayMs: 100,
      connectionTimeout: 5000,
      ...config
    };

    const redisUrl = process.env.REDIS_TEST_URL || 'redis://localhost:6380';
    
    this.client = new (IORedis as any)(redisUrl, {
      db: this.config.db,
      maxRetriesPerRequest: this.config.maxRetries,
      retryDelayOnFailover: this.config.retryDelayMs,
      connectTimeout: this.config.connectionTimeout,
      lazyConnect: true, // Don't connect until first use
      // Disable keep-alive for tests to avoid connection leaks
      keepAlive: 0,
      // Use a dedicated connection pool for tests
      family: 4
    });

    // Handle connection errors
    this.client.on('error', (err: Error) => {
      console.error('Redis test client error:', err);
    });
  }

  /**
   * Get the underlying Redis client for direct operations
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Connect to Redis and verify connectivity
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      await this.client.ping();
    } catch (error) {
      throw new Error(`Failed to connect to Redis test instance: ${error}`);
    }
  }

  /**
   * Set a test key (tracked for cleanup)
   */
  async set(key: string, value: string, expireSeconds?: number): Promise<string> {
    this.testKeys.add(key);
    if (expireSeconds) {
      return await this.client.setex(key, expireSeconds, value);
    }
    return await this.client.set(key, value);
  }

  /**
   * Get a key value
   */
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  /**
   * Delete a specific key
   */
  async del(key: string): Promise<number> {
    this.testKeys.delete(key);
    return await this.client.del(key);
  }

  /**
   * Add entry to Redis Stream (tracked for cleanup)
   */
  async xadd(stream: string, id: string, ...fieldsAndValues: string[]): Promise<string> {
    this.testStreams.add(stream);
    const result = await this.client.xadd(stream, id, ...fieldsAndValues);
    return result as string;
  }

  /**
   * Create consumer group (tracked for cleanup)
   */
  async xgroupCreate(stream: string, group: string, id: string = '$', mkstream: boolean = true): Promise<string> {
    this.testStreams.add(stream);
    if (!this.testGroups.has(stream)) {
      this.testGroups.set(stream, []);
    }
    this.testGroups.get(stream)!.push(group);
    
    try {
      const args = ['CREATE', stream, group, id];
      if (mkstream) {
        args.push('MKSTREAM');
      }
      return await (this.client as any).xgroup(...args);
    } catch (error: any) {
      // Ignore BUSYGROUP errors (group already exists)
      if (error.message && error.message.includes('BUSYGROUP')) {
        return 'OK';
      }
      throw error;
    }
  }

  /**
   * Read from consumer group
   */
  async xreadgroup(
    group: string, 
    consumer: string, 
    streams: Record<string, string>,
    count?: number,
    block?: number
  ): Promise<any> {
    const args: string[] = ['GROUP', group, consumer];
    if (count) {
      args.push('COUNT', count.toString());
    }
    if (block !== undefined) {
      args.push('BLOCK', block.toString());
    }
    args.push('STREAMS');
    
    for (const [stream, lastId] of Object.entries(streams)) {
      args.push(stream, lastId);
    }
    
    return await (this.client as any).xreadgroup(...args);
  }

  /**
   * Acknowledge message processing
   */
  async xack(stream: string, group: string, ...ids: string[]): Promise<number> {
    return await this.client.xack(stream, group, ...ids);
  }

  /**
   * Get Redis database info
   */
  async info(): Promise<string> {
    return await this.client.info();
  }

  /**
   * Ping Redis to check connectivity
   */
  async ping(): Promise<string> {
    return await this.client.ping();
  }

  /**
   * Clean up all test data
   */
  async cleanup(): Promise<void> {
    try {
      // Delete consumer groups first
      for (const [stream, groups] of this.testGroups) {
        for (const group of groups) {
          try {
            await this.client.xgroup('DESTROY', stream, group);
          } catch (error) {
            // Ignore errors - group might not exist
          }
        }
      }
      
      // Delete test streams
      if (this.testStreams.size > 0) {
        await this.client.del(...Array.from(this.testStreams));
      }
      
      // Delete test keys
      if (this.testKeys.size > 0) {
        await this.client.del(...Array.from(this.testKeys));
      }
      
      // Clear tracking sets
      this.testKeys.clear();
      this.testStreams.clear();
      this.testGroups.clear();
    } catch (error) {
      console.error('Error during Redis test cleanup:', error);
    }
  }

  /**
   * Close the Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      await this.cleanup();
      await this.client.quit();
    } catch (error) {
      console.error('Error disconnecting Redis test client:', error);
      // Force disconnect if graceful quit fails
      this.client.disconnect();
    }
  }

  /**
   * Flush current test database (use with caution!)
   */
  async flushDb(): Promise<string> {
    return await this.client.flushdb();
  }

  /**
   * Select a different database number
   */
  async select(db: number): Promise<string> {
    this.config.db = db;
    return await this.client.select(db);
  }

  /**
   * Create a new Redis test client with different database
   */
  static create(config: Partial<RedisTestConfig> = {}): RedisTestClient {
    return new RedisTestClient(config);
  }

  /**
   * Create backend-specific test client (DB 0)
   */
  static forBackend(): RedisTestClient {
    return new RedisTestClient({ db: 0 });
  }

  /**
   * Create integration test client (DB 3)
   */
  static forIntegration(): RedisTestClient {
    return new RedisTestClient({ db: 3 });
  }

  /**
   * Create cache test client (DB 4)
   */
  static forCache(): RedisTestClient {
    return new RedisTestClient({ db: 4 });
  }
}

/**
 * Global Redis test client instance for shared use
 */
export const redisTestClient = RedisTestClient.forBackend();

/**
 * Setup Redis test environment
 */
export async function setupRedisTest(): Promise<RedisTestClient> {
  const client = RedisTestClient.forBackend();
  await client.connect();
  await client.flushDb(); // Start with clean database
  return client;
}

/**
 * Teardown Redis test environment
 */
export async function teardownRedisTest(client: RedisTestClient): Promise<void> {
  await client.disconnect();
}