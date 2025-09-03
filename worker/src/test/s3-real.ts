/**
 * Real S3 Test Client - Worker Service
 * 
 * Provides real S3 connections using MinIO test environment for worker operations.
 * Handles preview uploads, master file downloads, and test object cleanup.
 */

import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  HeadObjectCommand, 
  ListObjectsV2Command 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream } from 'node:fs';

export interface WorkerS3TestConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  mastersBucket: string;
  previewsBucket: string;
}

export class WorkerS3TestClient {
  private client: S3Client;
  private config: WorkerS3TestConfig;
  private testObjects: Set<string> = new Set(); // bucket/key for cleanup

  constructor(config: Partial<WorkerS3TestConfig> = {}) {
    this.config = {
      endpoint: process.env.S3_TEST_ENDPOINT || 'http://localhost:9000',
      region: process.env.S3_TEST_REGION || 'us-east-1',
      accessKeyId: process.env.S3_TEST_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.S3_TEST_SECRET_KEY || 'minioadmin123',
      forcePathStyle: true,
      mastersBucket: process.env.S3_MASTERS_BUCKET || 'masters-test',
      previewsBucket: process.env.S3_PREVIEWS_BUCKET || 'previews-test',
      ...config
    };

    this.client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      forcePathStyle: this.config.forcePathStyle,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey
      }
    });
  }

  /**
   * Get the underlying S3 client for direct operations
   */
  getClient(): S3Client {
    return this.client;
  }

  /**
   * Get S3 configuration
   */
  getConfig(): WorkerS3TestConfig {
    return { ...this.config };
  }

  /**
   * Create presigned GET URL for master file downloads
   */
  async createPresignedGetUrl(
    bucket: string, 
    key: string, 
    expiresIn: number = 900
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    return await getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Put object to S3 (tracked for cleanup)
   */
  async putObject(
    bucket: string, 
    key: string, 
    body: string | Uint8Array | Buffer | NodeJS.ReadableStream, 
    contentType?: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    });
    
    await this.client.send(command);
    this.testObjects.add(`${bucket}/${key}`);
  }

  /**
   * Get object from S3
   */
  async getObject(bucket: string, key: string): Promise<any> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    return await this.client.send(command);
  }

  /**
   * Check if object exists
   */
  async objectExists(bucket: string, key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key
      });
      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get object metadata
   */
  async getObjectMetadata(bucket: string, key: string): Promise<any> {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    return await this.client.send(command);
  }

  /**
   * List objects with prefix
   */
  async listObjects(bucket: string, prefix?: string): Promise<any> {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix
    });
    
    return await this.client.send(command);
  }

  /**
   * Delete specific object
   */
  async deleteObject(bucket: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    await this.client.send(command);
    this.testObjects.delete(`${bucket}/${key}`);
  }

  /**
   * Upload master test file
   */
  async uploadMasterFile(
    key: string, 
    content: string | Buffer = Buffer.from('test-master-video-content'), 
    contentType: string = 'video/mp4'
  ): Promise<string> {
    await this.putObject(this.config.mastersBucket, key, content, contentType);
    return key;
  }

  /**
   * Upload preview file (HLS segment, manifest, or thumbnail)
   */
  async uploadPreviewFile(
    key: string, 
    content: string | Buffer, 
    contentType?: string
  ): Promise<string> {
    const inferredType = contentType || this.inferContentType(key);
    await this.putObject(this.config.previewsBucket, key, content, inferredType);
    return key;
  }

  /**
   * Upload HLS manifest
   */
  async uploadHLSManifest(
    previewPrefix: string,
    manifestContent: string = '#EXTM3U\n#EXT-X-VERSION:3\n#EXTINF:10.0,\nsegment001.ts'
  ): Promise<string> {
    const manifestKey = `${previewPrefix.replace(/\/$/, '')}/index.m3u8`;
    await this.putObject(
      this.config.previewsBucket,
      manifestKey,
      manifestContent,
      'application/vnd.apple.mpegurl'
    );
    return manifestKey;
  }

  /**
   * Upload HLS segment
   */
  async uploadHLSSegment(
    previewPrefix: string,
    segmentName: string,
    segmentContent: Buffer = Buffer.from('mock-video-segment-data')
  ): Promise<string> {
    const segmentKey = `${previewPrefix.replace(/\/$/, '')}/${segmentName}`;
    await this.putObject(
      this.config.previewsBucket,
      segmentKey,
      segmentContent,
      'video/MP2T'
    );
    return segmentKey;
  }

  /**
   * Upload thumbnail
   */
  async uploadThumbnail(
    previewPrefix: string,
    thumbnailName: string,
    thumbnailContent: Buffer = Buffer.from('mock-thumbnail-data')
  ): Promise<string> {
    const thumbnailKey = `${previewPrefix.replace(/\/$/, '')}/${thumbnailName}`;
    await this.putObject(
      this.config.previewsBucket,
      thumbnailKey,
      thumbnailContent,
      'image/jpeg'
    );
    return thumbnailKey;
  }

  /**
   * Create complete HLS preview structure
   */
  async createHLSPreview(previewPrefix: string): Promise<{
    manifestKey: string;
    segmentKeys: string[];
    thumbnailKey: string;
  }> {
    const manifestKey = await this.uploadHLSManifest(previewPrefix);
    
    const segmentKeys = [];
    for (let i = 1; i <= 3; i++) {
      const segmentKey = await this.uploadHLSSegment(
        previewPrefix,
        `segment${i.toString().padStart(3, '0')}.ts`
      );
      segmentKeys.push(segmentKey);
    }
    
    const thumbnailKey = await this.uploadThumbnail(previewPrefix, 'thumbnail.jpg');
    
    return {
      manifestKey,
      segmentKeys,
      thumbnailKey
    };
  }

  /**
   * Upload file from local path
   */
  async uploadFromFile(bucket: string, key: string, filePath: string, contentType?: string): Promise<void> {
    const fileStream = createReadStream(filePath);
    await this.putObject(bucket, key, fileStream, contentType);
  }

  /**
   * Download object to buffer
   */
  async downloadToBuffer(bucket: string, key: string): Promise<Buffer> {
    const response = await this.getObject(bucket, key);
    const chunks: Uint8Array[] = [];
    
    if (response.Body) {
      const stream = response.Body as NodeJS.ReadableStream;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
    }
    
    return Buffer.concat(chunks);
  }

  /**
   * Infer content type from file extension
   */
  private inferContentType(key: string): string {
    const ext = key.toLowerCase().split('.').pop();
    const typeMap: Record<string, string> = {
      'm3u8': 'application/vnd.apple.mpegurl',
      'ts': 'video/MP2T',
      'mp4': 'video/mp4',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    return typeMap[ext || ''] || 'application/octet-stream';
  }

  /**
   * Clean up all test objects
   */
  async cleanup(): Promise<void> {
    const errors: Error[] = [];
    
    for (const objectPath of this.testObjects) {
      const [bucket, ...keyParts] = objectPath.split('/');
      const key = keyParts.join('/');
      
      try {
        await this.deleteObject(bucket, key);
      } catch (error) {
        errors.push(error as Error);
        // Continue cleanup even if some deletions fail
      }
    }
    
    this.testObjects.clear();
    
    if (errors.length > 0) {
      console.warn(`Worker S3 cleanup completed with ${errors.length} errors:`, errors);
    }
  }

  /**
   * Clean up objects with specific prefix
   */
  async cleanupPrefix(bucket: string, prefix: string): Promise<void> {
    try {
      const listResult = await this.listObjects(bucket, prefix);
      const objects = listResult.Contents || [];
      
      for (const obj of objects) {
        if (obj.Key) {
          await this.deleteObject(bucket, obj.Key);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up prefix ${prefix} in bucket ${bucket}:`, error);
    }
  }

  /**
   * Create test environment with sample master and preview files
   */
  async createTestEnvironment(): Promise<{
    masterKey: string;
    previewPrefix: string;
    manifestKey: string;
    segmentKeys: string[];
    thumbnailKey: string;
  }> {
    const timestamp = Date.now();
    const masterKey = `masters/test-${timestamp}.mp4`;
    const previewPrefix = `previews/${timestamp}`;
    
    // Upload master file
    await this.uploadMasterFile(masterKey);
    
    // Create HLS preview structure
    const preview = await this.createHLSPreview(previewPrefix);
    
    return {
      masterKey,
      previewPrefix,
      ...preview
    };
  }

  /**
   * Create Worker S3 test client with default MinIO configuration
   */
  static create(config: Partial<WorkerS3TestConfig> = {}): WorkerS3TestClient {
    return new WorkerS3TestClient(config);
  }

  /**
   * Create worker-specific S3 test client
   */
  static forWorker(): WorkerS3TestClient {
    return new WorkerS3TestClient({
      mastersBucket: 'masters-test',
      previewsBucket: 'previews-test'
    });
  }

  /**
   * Create integration test client
   */
  static forIntegration(): WorkerS3TestClient {
    return new WorkerS3TestClient({
      mastersBucket: 'masters-test',
      previewsBucket: 'previews-test'
    });
  }

  /**
   * Validate S3 test environment connectivity
   */
  async validateEnvironment(): Promise<void> {
    try {
      // Test connectivity with simple list operations
      await this.listObjects(this.config.mastersBucket);
      await this.listObjects(this.config.previewsBucket);
    } catch (error) {
      throw new Error(`Worker S3 test environment validation failed: ${error}`);
    }
  }
}

/**
 * Global Worker S3 test client instance for shared use
 */
export const workerS3TestClient = WorkerS3TestClient.forWorker();

/**
 * Setup Worker S3 test environment
 */
export async function setupWorkerS3Test(): Promise<WorkerS3TestClient> {
  const client = WorkerS3TestClient.forWorker();
  await client.validateEnvironment();
  return client;
}

/**
 * Teardown Worker S3 test environment
 */
export async function teardownWorkerS3Test(client: WorkerS3TestClient): Promise<void> {
  await client.cleanup();
}

/**
 * Create test preview job data
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

/**
 * Set Worker S3 test environment variables
 */
export function setWorkerS3TestEnv(): void {
  process.env.S3_TEST_ENDPOINT = 'http://localhost:9000';
  process.env.S3_TEST_ACCESS_KEY = 'minioadmin';
  process.env.S3_TEST_SECRET_KEY = 'minioadmin123';
  process.env.S3_TEST_REGION = 'us-east-1';
  
  // Override application S3 config to use test MinIO
  process.env.WASABI_ENDPOINT = 'http://localhost:9000';
  process.env.WASABI_PREVIEWS_ACCESS_KEY = 'minioadmin';
  process.env.WASABI_PREVIEWS_SECRET = 'minioadmin123';
  process.env.WASABI_MASTERS_ACCESS_KEY = 'minioadmin';
  process.env.WASABI_MASTERS_SECRET = 'minioadmin123';
  process.env.WASABI_REGION = 'us-east-1';
  process.env.S3_BUCKET_MASTERS = 'masters-test';
  process.env.S3_BUCKET_PREVIEWS = 'previews-test';
}