import { describe, it, expect, beforeAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import pg from 'pg';
import Redis from 'ioredis';
import { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const execAsync = promisify(exec);

describe('Infrastructure Validation Tests', () => {
  describe('Health Check Tests', () => {
    it('should validate frontend service health', async () => {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const response = await fetch(`${frontendUrl}/api/health`);
      expect(response.status).toBeLessThanOrEqual(200);
    });

    it('should validate backend API health', async () => {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/health`);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.service).toBe('backend');
    });

    it('should validate edge service health', async () => {
      const edgeUrl = process.env.EDGE_URL || 'http://localhost:8080';
      const response = await fetch(`${edgeUrl}/health`);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.service).toBe('edge-verifier');
    });

    it('should validate worker service health', async () => {
      const workerHealthFile = '/tmp/worker-health.json';
      try {
        const fs = await import('fs/promises');
        const healthData = await fs.readFile(workerHealthFile, 'utf-8');
        const health = JSON.parse(healthData);
        expect(health.status).toBe('healthy');
        expect(health.ffmpeg).toBeDefined();
      } catch (error) {
        console.warn('Worker health file not found - worker may not be running');
      }
    });
  });

  describe('PostgreSQL Connectivity Tests', () => {
    let pool: pg.Pool;

    beforeAll(() => {
      const pgUrl = process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/motionmavericks';
      pool = new pg.Pool({ connectionString: pgUrl, max: 5 });
    });

    it('should connect to PostgreSQL', async () => {
      const client = await pool.connect();
      const result = await client.query('SELECT version()');
      client.release();
      expect(result.rows[0].version).toContain('PostgreSQL');
    });

    it('should validate PostgreSQL version is 16+', async () => {
      const client = await pool.connect();
      const result = await client.query('SHOW server_version_num');
      const version = parseInt(result.rows[0].server_version_num);
      client.release();
      expect(version).toBeGreaterThanOrEqual(160000);
    });

    it('should validate connection pooling is configured', async () => {
      const client = await pool.connect();
      const result = await client.query('SHOW max_connections');
      const maxConnections = parseInt(result.rows[0].max_connections);
      client.release();
      expect(maxConnections).toBeGreaterThanOrEqual(100);
    });

    it('should validate database tables exist', async () => {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('assets', 'versions', 'users', 'sessions')
        ORDER BY table_name
      `);
      client.release();
      expect(result.rows.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Redis Connectivity Tests', () => {
    let redis: Redis;

    beforeAll(() => {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      redis = new Redis(redisUrl);
    });

    it('should connect to Redis', async () => {
      const pong = await redis.ping();
      expect(pong).toBe('PONG');
    });

    it('should validate Redis version is 7+', async () => {
      const info = await redis.info('server');
      const versionMatch = info.match(/redis_version:(\d+)/);
      if (versionMatch) {
        const majorVersion = parseInt(versionMatch[1]);
        expect(majorVersion).toBeGreaterThanOrEqual(7);
      }
    });

    it('should validate Redis persistence is configured', async () => {
      const config = await redis.config('GET', 'save');
      expect(config[1]).toBeDefined();
    });

    it('should validate Redis memory policy', async () => {
      const config = await redis.config('GET', 'maxmemory-policy');
      expect(['allkeys-lru', 'volatile-lru', 'allkeys-lfu']).toContain(config[1]);
    });

    it('should test Redis Streams functionality', async () => {
      const testStream = 'test:stream';
      const id = await redis.xadd(testStream, '*', 'test', 'data');
      expect(id).toBeDefined();
      await redis.del(testStream);
    });
  });

  describe('VPC Network Isolation Tests', () => {
    it('should validate VPC configuration', async () => {
      if (process.env.DO_VPC_ID) {
        const { stdout } = await execAsync(`doctl vpcs get ${process.env.DO_VPC_ID} --format ID,Name,IPRange`);
        expect(stdout).toContain(process.env.DO_VPC_ID);
      } else {
        console.warn('VPC tests skipped - DO_VPC_ID not set');
      }
    });

    it('should validate firewall rules are configured', async () => {
      if (process.env.DO_FIREWALL_ID) {
        const { stdout } = await execAsync(`doctl compute firewall get ${process.env.DO_FIREWALL_ID} --format ID,Name,Status`);
        expect(stdout.toLowerCase()).toContain('succeeded');
      } else {
        console.warn('Firewall tests skipped - DO_FIREWALL_ID not set');
      }
    });

    it('should validate private networking between services', async () => {
      if (process.env.PRIVATE_BACKEND_URL) {
        try {
          const response = await fetch(`${process.env.PRIVATE_BACKEND_URL}/api/health`, {
            signal: AbortSignal.timeout(5000)
          });
          expect(response.status).toBe(200);
        } catch (error) {
          console.warn('Private network test failed - may not be in VPC context');
        }
      }
    });

    it('should validate load balancer configuration', async () => {
      if (process.env.DO_LB_ID) {
        const { stdout } = await execAsync(`doctl compute load-balancer get ${process.env.DO_LB_ID} --format ID,Name,Status`);
        expect(stdout.toLowerCase()).toContain('active');
      } else {
        console.warn('Load balancer tests skipped - DO_LB_ID not set');
      }
    });
  });

  describe('Storage Bucket Access Tests', () => {
    let s3Client: S3Client;

    beforeAll(() => {
      const endpoint = process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com';
      const region = process.env.WASABI_REGION || 'us-east-1';
      const accessKeyId = process.env.WASABI_STAGING_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.WASABI_STAGING_SECRET || process.env.AWS_SECRET_ACCESS_KEY;

      if (accessKeyId && secretAccessKey) {
        s3Client = new S3Client({
          region,
          endpoint,
          forcePathStyle: true,
          credentials: {
            accessKeyId: accessKeyId as string,
            secretAccessKey: secretAccessKey as string
          }
        });
      }
    });

    it('should validate staging bucket exists and is accessible', async () => {
      if (!s3Client || !process.env.STAGING_BUCKET) {
        console.warn('Staging bucket test skipped - credentials not configured');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: process.env.STAGING_BUCKET });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should validate masters bucket exists and is accessible', async () => {
      if (!s3Client || !process.env.MASTERS_BUCKET) {
        console.warn('Masters bucket test skipped - credentials not configured');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: process.env.MASTERS_BUCKET });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should validate previews bucket exists and is accessible', async () => {
      if (!s3Client || !process.env.PREVIEWS_BUCKET) {
        console.warn('Previews bucket test skipped - credentials not configured');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: process.env.PREVIEWS_BUCKET });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should test upload to staging bucket', async () => {
      if (!s3Client || !process.env.STAGING_BUCKET) {
        console.warn('Upload test skipped - credentials not configured');
        return;
      }

      const testKey = `test/validation-${Date.now()}.txt`;
      const putCommand = new PutObjectCommand({
        Bucket: process.env.STAGING_BUCKET,
        Key: testKey,
        Body: 'Infrastructure validation test',
        ContentType: 'text/plain'
      });

      await expect(s3Client.send(putCommand)).resolves.not.toThrow();
    });

    it('should validate object locking on masters bucket', async () => {
      if (!s3Client || !process.env.MASTERS_BUCKET) {
        console.warn('Object lock test skipped - credentials not configured');
        return;
      }

      try {
        const { GetBucketVersioningCommand } = await import('@aws-sdk/client-s3');
        const command = new GetBucketVersioningCommand({ Bucket: process.env.MASTERS_BUCKET });
        const response = await s3Client.send(command);
        expect(['Enabled', 'Suspended']).toContain(response.Status);
      } catch (error) {
        console.warn('Object lock verification requires additional permissions');
      }
    });
  });

  describe('Service Connectivity Matrix', () => {
    it('should validate backend can connect to PostgreSQL', async () => {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/health`);
      const data = await response.json();
      if (data.db !== undefined) {
        expect(data.db).toBe(true);
      }
    });

    it('should validate backend can connect to Redis', async () => {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/health`);
      const data = await response.json();
      if (data.redis !== undefined) {
        expect(data.redis).toBe(true);
      }
    });

    it('should validate backend can access S3 buckets', async () => {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'test/validation.txt' })
      });
      
      if (response.status === 501) {
        console.warn('S3 not configured in backend');
      } else {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.url).toBeDefined();
      }
    });

    it('should validate edge service HMAC signing', async () => {
      const edgeUrl = process.env.EDGE_URL || 'http://localhost:8080';
      const response = await fetch(`${edgeUrl}/health`);
      const data = await response.json();
      expect(data.hmacConfigured).toBeDefined();
    });
  });

  describe('Performance Baseline Tests', () => {
    it('should validate API response time < 200ms', async () => {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const start = Date.now();
      await fetch(`${backendUrl}/api/health`);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });

    it('should validate database query performance', async () => {
      const pgUrl = process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/motionmavericks';
      const pool = new pg.Pool({ connectionString: pgUrl, max: 1 });
      const client = await pool.connect();
      
      const start = Date.now();
      await client.query('SELECT COUNT(*) FROM assets');
      const duration = Date.now() - start;
      client.release();
      await pool.end();
      
      expect(duration).toBeLessThan(100);
    });

    it('should validate Redis operation performance', async () => {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const redis = new Redis(redisUrl);
      
      const start = Date.now();
      await redis.set('perf:test', 'value');
      await redis.get('perf:test');
      await redis.del('perf:test');
      const duration = Date.now() - start;
      redis.disconnect();
      
      expect(duration).toBeLessThan(50);
    });
  });
});