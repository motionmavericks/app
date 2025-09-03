/**
 * Real Redis Test Client - Worker Service
 * 
 * Provides real Redis connections with database isolation for worker testing.
 * Uses Redis DB 1 for worker tests, with proper Streams and job queue support.
 */

import IORedis, { Redis } from 'ioredis';

export interface WorkerRedisTestConfig {
  db: number;
  maxRetries: number;
  retryDelayMs: number;
  connectionTimeout: number;
  streamName?: string;
  consumerGroup?: string;
}

export class WorkerRedisTestClient {
  private client: Redis;
  private testKeys: Set<string> = new Set();
  private testStreams: Set<string> = new Set();
  private testGroups: Map<string, string[]> = new Map(); // stream -> groups
  private testConsumers: Map<string, string[]> = new Map(); // group -> consumers
  private config: WorkerRedisTestConfig;

  constructor(config: Partial<WorkerRedisTestConfig> = {}) {
    this.config = {
      db: 1, // Worker tests use DB 1
      maxRetries: 3,
      retryDelayMs: 100,
      connectionTimeout: 5000,
      streamName: 'previews:build:test',
      consumerGroup: 'previewers:test',
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
      console.error('Worker Redis test client error:', err);
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
      throw new Error(`Failed to connect to Worker Redis test instance: ${error}`);
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
   * Add job to preview stream (tracked for cleanup)
   */
  async addPreviewJob(
    jobId: string,
    masterKey: string,
    masterBucket: string = 'masters-test',
    previewsBucket: string = 'previews-test',
    previewPrefix?: string
  ): Promise<string> {
    const stream = this.config.streamName!;
    this.testStreams.add(stream);
    
    const prefix = previewPrefix || `previews/${jobId}`;
    
    const result = await this.client.xadd(
      stream,
      '*',
      'jobId', jobId,
      'master_key', masterKey,
      'master_bucket', masterBucket,
      'previews_bucket', previewsBucket,
      'preview_prefix', prefix
    );
    return result as string;
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
   * Setup preview job consumer group
   */
  async setupPreviewConsumerGroup(): Promise<void> {
    const stream = this.config.streamName!;
    const group = this.config.consumerGroup!;
    await this.xgroupCreate(stream, group, '$', true);
  }

  /**
   * Read jobs from consumer group
   */
  async readJobs(
    consumer: string, 
    count: number = 1,
    block: number = 100
  ): Promise<any> {
    const stream = this.config.streamName!;
    const group = this.config.consumerGroup!;
    
    // Track consumer for cleanup
    if (!this.testConsumers.has(group)) {
      this.testConsumers.set(group, []);
    }
    if (!this.testConsumers.get(group)!.includes(consumer)) {
      this.testConsumers.get(group)!.push(consumer);
    }
    
    return await (this.client as any).xreadgroup(
      'GROUP', group, consumer,
      'COUNT', count.toString(),
      'BLOCK', block.toString(),
      'STREAMS', stream, '>'
    );
  }

  /**
   * Read from consumer group with custom parameters
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
   * Acknowledge job processing
   */
  async xack(stream: string, group: string, ...ids: string[]): Promise<number> {
    return await this.client.xack(stream, group, ...ids);
  }

  /**
   * Acknowledge preview job
   */
  async ackPreviewJob(messageId: string): Promise<number> {
    const stream = this.config.streamName!;
    const group = this.config.consumerGroup!;
    return await this.client.xack(stream, group, messageId);
  }

  /**
   * Get stream information
   */
  async xinfoStream(stream: string): Promise<any> {
    return await this.client.xinfo('STREAM', stream);
  }

  /**
   * Get consumer group information
   */
  async xinfoGroups(stream: string): Promise<any> {
    return await this.client.xinfo('GROUPS', stream);
  }

  /**
   * Get consumers in a group
   */
  async xinfoConsumers(stream: string, group: string): Promise<any> {
    return await this.client.xinfo('CONSUMERS', stream, group);
  }

  /**
   * Get stream length
   */
  async xlen(stream: string): Promise<number> {
    return await this.client.xlen(stream);
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
      this.testConsumers.clear();
    } catch (error) {
      console.error('Error during Worker Redis test cleanup:', error);
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
      console.error('Error disconnecting Worker Redis test client:', error);
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
   * Create a new Worker Redis test client with different database
   */
  static create(config: Partial<WorkerRedisTestConfig> = {}): WorkerRedisTestClient {
    return new WorkerRedisTestClient(config);
  }

  /**
   * Create worker-specific test client (DB 1)
   */
  static forWorker(): WorkerRedisTestClient {
    return new WorkerRedisTestClient({ db: 1 });
  }

  /**
   * Create integration test client (DB 3)
   */
  static forIntegration(): WorkerRedisTestClient {
    return new WorkerRedisTestClient({ db: 3 });
  }

  /**
   * Create job queue test client with custom stream
   */
  static forJobQueue(streamName: string, consumerGroup: string): WorkerRedisTestClient {
    return new WorkerRedisTestClient({
      db: 1,
      streamName,
      consumerGroup
    });
  }
}

/**
 * Global Worker Redis test client instance for shared use
 */
export const workerRedisTestClient = WorkerRedisTestClient.forWorker();

/**
 * Setup Worker Redis test environment
 */
export async function setupWorkerRedisTest(): Promise<WorkerRedisTestClient> {
  const client = WorkerRedisTestClient.forWorker();
  await client.connect();
  await client.flushDb(); // Start with clean database
  await client.setupPreviewConsumerGroup();
  return client;
}

/**
 * Teardown Worker Redis test environment
 */
export async function teardownWorkerRedisTest(client: WorkerRedisTestClient): Promise<void> {
  await client.disconnect();
}

/**
 * Create a test preview job for testing
 */
export function createTestPreviewJob(jobId?: string) {
  const id = jobId || `test-job-${Date.now()}`;
  return {
    jobId: id,
    masterKey: `masters/test-${id}.mp4`,
    masterBucket: 'masters-test',
    previewsBucket: 'previews-test',
    previewPrefix: `previews/${id}`
  };
}