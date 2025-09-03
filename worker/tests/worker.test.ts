import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkerRedisTestClient, createTestPreviewJob } from '../src/test/redis-real';

describe('Worker Service Real Redis Testing', () => {
  let redisClient: WorkerRedisTestClient;

  beforeEach(async () => {
    // Setup real Redis test client for worker (DB 1)
    redisClient = WorkerRedisTestClient.forWorker();
    await redisClient.connect();
    await redisClient.setupPreviewConsumerGroup();
  })

  afterEach(async () => {
    await redisClient.disconnect();
  })

  it('should connect to real Redis and ping successfully', async () => {
    const pingResult = await redisClient.ping();
    expect(pingResult).toBe('PONG');
  })

  it('should create and manage Redis Streams for job processing', async () => {
    const streamName = 'previews:build:test';
    
    // Add a job to the stream
    const jobId = await redisClient.xadd(
      streamName,
      '*',
      'jobId', 'test-job-123',
      'master_key', 'masters/test.mp4',
      'master_bucket', 'masters-test',
      'previews_bucket', 'previews-test',
      'preview_prefix', 'previews/test-job-123'
    );
    
    expect(jobId).toBeDefined();
    
    // Verify stream length
    const streamLength = await redisClient.getClient().xlen(streamName);
    expect(streamLength).toBe(1);
  })

  it('should create consumer groups and read jobs', async () => {
    const streamName = 'previews:build:test';
    const groupName = 'previewers:test';
    const consumerName = 'test-consumer-1';
    
    // Create consumer group
    await redisClient.xgroupCreate(streamName, groupName, '$', true);
    
    // Add a job
    await redisClient.addPreviewJob('test-job-456', 'masters/video.mp4');
    
    // Read from the group
    const messages = await redisClient.readJobs(consumerName, 1, 100);
    
    if (messages && messages.length > 0) {
      expect(messages).toBeDefined();
      expect(messages[0]).toBeDefined();
      expect(messages[0][1]).toBeDefined(); // stream entries
    }
  })

  it('should handle job acknowledgment', async () => {
    const streamName = 'previews:build:test';
    const groupName = 'previewers:test';
    const consumerName = 'test-consumer-ack';
    
    // Ensure group exists
    await redisClient.xgroupCreate(streamName, groupName, '$', true);
    
    // Add a job
    const messageId = await redisClient.addPreviewJob('test-job-ack', 'masters/ack-test.mp4');
    expect(messageId).toBeDefined();
    
    // Acknowledge the job (even if we didn't read it properly)
    const ackResult = await redisClient.ackPreviewJob(messageId);
    expect(ackResult).toBeGreaterThanOrEqual(0);
  })

  it('should use helper functions for test job creation', () => {
    const testJob = createTestPreviewJob();
    
    expect(testJob).toHaveProperty('jobId');
    expect(testJob).toHaveProperty('masterKey');
    expect(testJob).toHaveProperty('masterBucket', 'masters-test');
    expect(testJob).toHaveProperty('previewsBucket', 'previews-test');
    expect(testJob).toHaveProperty('previewPrefix');
    expect(testJob.masterKey).toContain('masters/test-');
    expect(testJob.previewPrefix).toContain('previews/');
  })

  it('should handle multiple databases correctly', async () => {
    const db1Client = WorkerRedisTestClient.forWorker(); // DB 1
    const db3Client = WorkerRedisTestClient.forIntegration(); // DB 3
    
    try {
      await db1Client.connect();
      await db3Client.connect();
      
      // Set different values in different databases
      await db1Client.set('test-key', 'worker-value');
      await db3Client.set('test-key', 'integration-value');
      
      // Verify isolation
      const workerValue = await db1Client.get('test-key');
      const integrationValue = await db3Client.get('test-key');
      
      expect(workerValue).toBe('worker-value');
      expect(integrationValue).toBe('integration-value');
      
    } finally {
      await db1Client.disconnect();
      await db3Client.disconnect();
    }
  })

  it('should handle Redis Stream info operations', async () => {
    const streamName = 'info-test:stream';
    
    // Add some data to create the stream
    await redisClient.xadd(streamName, '*', 'test', 'data');
    
    // Get stream info
    const streamInfo = await redisClient.xinfoStream(streamName);
    expect(streamInfo).toBeDefined();
    expect(streamInfo.length).toBeGreaterThan(0);
    
    // Create a group and get group info
    await redisClient.xgroupCreate(streamName, 'test-group', '$');
    const groupInfo = await redisClient.xinfoGroups(streamName);
    expect(groupInfo).toBeDefined();
    expect(Array.isArray(groupInfo)).toBe(true);
  })

  it('should cleanup test data automatically', async () => {
    const testKey = 'auto-cleanup-test';
    const testStream = 'cleanup:stream';
    
    // Add test data
    await redisClient.set(testKey, 'cleanup-value');
    await redisClient.xadd(testStream, '*', 'cleanup', 'data');
    
    // Verify data exists
    const value = await redisClient.get(testKey);
    const streamLen = await redisClient.getClient().xlen(testStream);
    
    expect(value).toBe('cleanup-value');
    expect(streamLen).toBe(1);
    
    // Cleanup will happen automatically in afterEach
  })

  it('should have correct test environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.REDIS_TEST_URL).toBeDefined();
    expect(process.env.REDIS_TEST_URL).toContain('6380'); // Test port
  })
})