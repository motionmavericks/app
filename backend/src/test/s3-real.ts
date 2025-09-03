/**
 * Real S3 Test Client - Backend Service
 * 
 * Provides real S3 connections using MinIO test environment.
 * Handles presigning, uploading, copying, and test object cleanup.
 */

import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  CopyObjectCommand, 
  DeleteObjectCommand, 
  HeadObjectCommand, 
  ListObjectsV2Command 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface S3TestConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  stagingBucket: string;
  mastersBucket: string;
  previewsBucket: string;
}

export class S3TestClient {
  private client: S3Client;
  private config: S3TestConfig;
  private testObjects: Set<string> = new Set(); // bucket/key for cleanup

  constructor(config: Partial<S3TestConfig> = {}) {
    this.config = {
      endpoint: process.env.S3_TEST_ENDPOINT || 'http://localhost:9000',
      region: process.env.S3_TEST_REGION || 'us-east-1',
      accessKeyId: process.env.S3_TEST_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.S3_TEST_SECRET_KEY || 'minioadmin123',
      forcePathStyle: true,
      stagingBucket: process.env.S3_STAGING_BUCKET || 'staging-test',
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
  getConfig(): S3TestConfig {
    return { ...this.config };
  }

  /**
   * Create presigned PUT URL for uploads
   */
  async createPresignedPutUrl(
    bucket: string, 
    key: string, 
    contentType?: string, 
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType
    });
    
    this.testObjects.add(`${bucket}/${key}`);
    return await getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Create presigned GET URL for downloads
   */
  async createPresignedGetUrl(
    bucket: string, 
    key: string, 
    expiresIn: number = 3600
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
    body: string | Uint8Array | Buffer, 
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
   * Copy object between buckets/keys (tracked for cleanup)
   */
  async copyObject(
    sourceBucket: string, 
    sourceKey: string, 
    destBucket: string, 
    destKey: string
  ): Promise<void> {
    const command = new CopyObjectCommand({
      CopySource: `${sourceBucket}/${sourceKey}`,
      Bucket: destBucket,
      Key: destKey
    });
    
    await this.client.send(command);
    this.testObjects.add(`${destBucket}/${destKey}`);
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
   * Upload test file to staging bucket
   */
  async uploadTestFile(
    key: string, 
    content: string = 'test-video-content', 
    contentType: string = 'video/mp4'
  ): Promise<string> {
    await this.putObject(this.config.stagingBucket, key, content, contentType);
    return key;
  }

  /**
   * Promote file from staging to masters
   */
  async promoteToMasters(stagingKey: string, mastersKey?: string): Promise<string> {
    const destKey = mastersKey || stagingKey.replace('uploads/', 'masters/');
    
    await this.copyObject(
      this.config.stagingBucket,
      stagingKey,
      this.config.mastersBucket,
      destKey
    );
    
    return destKey;
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
      console.warn(`S3 cleanup completed with ${errors.length} errors:`, errors);
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
   * Create test environment with sample objects
   */
  async createTestEnvironment(): Promise<{
    stagingFile: string;
    mastersFile: string;
    testData: string;
  }> {
    const timestamp = Date.now();
    const testData = `test-video-content-${timestamp}`;
    const stagingKey = `uploads/test-${timestamp}.mp4`;
    const mastersKey = `masters/test-${timestamp}.mp4`;
    
    // Upload to staging
    await this.putObject(this.config.stagingBucket, stagingKey, testData, 'video/mp4');
    
    // Copy to masters
    await this.copyObject(
      this.config.stagingBucket,
      stagingKey,
      this.config.mastersBucket,
      mastersKey
    );
    
    return {
      stagingFile: stagingKey,
      mastersFile: mastersKey,
      testData
    };
  }

  /**
   * Create S3 test client with default MinIO configuration
   */
  static create(config: Partial<S3TestConfig> = {}): S3TestClient {
    return new S3TestClient(config);
  }

  /**
   * Create backend-specific S3 test client
   */
  static forBackend(): S3TestClient {
    return new S3TestClient({
      stagingBucket: 'staging-test',
      mastersBucket: 'masters-test',
      previewsBucket: 'previews-test'
    });
  }

  /**
   * Create integration test client
   */
  static forIntegration(): S3TestClient {
    return new S3TestClient({
      stagingBucket: 'staging-test',
      mastersBucket: 'masters-test', 
      previewsBucket: 'previews-test'
    });
  }

  /**
   * Validate S3 test environment connectivity
   */
  async validateEnvironment(): Promise<void> {
    try {
      // Test connectivity with a simple list operation
      await this.listObjects(this.config.stagingBucket);
      await this.listObjects(this.config.mastersBucket);
      await this.listObjects(this.config.previewsBucket);
    } catch (error) {
      throw new Error(`S3 test environment validation failed: ${error}`);
    }
  }
}

/**
 * Global S3 test client instance for shared use
 */
export const s3TestClient = S3TestClient.forBackend();

/**
 * Setup S3 test environment
 */
export async function setupS3Test(): Promise<S3TestClient> {
  const client = S3TestClient.forBackend();
  await client.validateEnvironment();
  return client;
}

/**
 * Teardown S3 test environment
 */
export async function teardownS3Test(client: S3TestClient): Promise<void> {
  await client.cleanup();
}

/**
 * Create test S3 environment variables
 */
export function setS3TestEnv(): void {
  process.env.S3_TEST_ENDPOINT = 'http://localhost:9000';
  process.env.S3_TEST_ACCESS_KEY = 'minioadmin';
  process.env.S3_TEST_SECRET_KEY = 'minioadmin123';
  process.env.S3_TEST_REGION = 'us-east-1';
  
  // Override application S3 config to use test MinIO
  process.env.WASABI_ENDPOINT = 'http://localhost:9000';
  process.env.WASABI_STAGING_ACCESS_KEY = 'minioadmin';
  process.env.WASABI_STAGING_SECRET = 'minioadmin123';
  process.env.WASABI_MASTERS_ACCESS_KEY = 'minioadmin';
  process.env.WASABI_MASTERS_SECRET = 'minioadmin123';
  process.env.WASABI_REGION = 'us-east-1';
  process.env.STAGING_BUCKET = 'staging-test';
  process.env.MASTERS_BUCKET = 'masters-test';
  process.env.PREVIEWS_BUCKET = 'previews-test';
}