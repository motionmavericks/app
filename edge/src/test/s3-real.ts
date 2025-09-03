/**
 * Real S3 Test Client - Edge Service
 * 
 * Provides real S3 connections using MinIO test environment for edge operations.
 * Handles preview content serving, HMAC signing, and test object cleanup.
 */

import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  HeadObjectCommand, 
  ListObjectsV2Command 
} from '@aws-sdk/client-s3';
import crypto from 'node:crypto';

export interface EdgeS3TestConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  previewsBucket: string;
  signingKey: string;
}

export class EdgeS3TestClient {
  private client: S3Client;
  private config: EdgeS3TestConfig;
  private testObjects: Set<string> = new Set(); // keys for cleanup

  constructor(config: Partial<EdgeS3TestConfig> = {}) {
    this.config = {
      endpoint: process.env.S3_TEST_ENDPOINT || 'http://localhost:9000',
      region: process.env.S3_TEST_REGION || 'us-east-1',
      accessKeyId: process.env.S3_TEST_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.S3_TEST_SECRET_KEY || 'minioadmin123',
      forcePathStyle: true,
      previewsBucket: process.env.S3_PREVIEWS_BUCKET || 'previews-test',
      signingKey: process.env.EDGE_SIGNING_KEY || 'test-secret-key-for-hmac-signing',
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
  getConfig(): EdgeS3TestConfig {
    return { ...this.config };
  }

  /**
   * Put object to S3 (tracked for cleanup)
   */
  async putObject(
    key: string, 
    body: string | Uint8Array | Buffer, 
    contentType?: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.config.previewsBucket,
      Key: key,
      Body: body,
      ContentType: contentType
    });
    
    await this.client.send(command);
    this.testObjects.add(key);
  }

  /**
   * Check if object exists
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.previewsBucket,
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
  async getObjectMetadata(key: string): Promise<any> {
    const command = new HeadObjectCommand({
      Bucket: this.config.previewsBucket,
      Key: key
    });
    
    return await this.client.send(command);
  }

  /**
   * List objects with prefix
   */
  async listObjects(prefix?: string): Promise<any> {
    const command = new ListObjectsV2Command({
      Bucket: this.config.previewsBucket,
      Prefix: prefix
    });
    
    return await this.client.send(command);
  }

  /**
   * Delete specific object
   */
  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.previewsBucket,
      Key: key
    });
    
    await this.client.send(command);
    this.testObjects.delete(key);
  }

  /**
   * Upload HLS manifest
   */
  async uploadHLSManifest(
    key: string,
    manifestContent: string = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXTINF:10.0,\nsegment001.ts\n#EXT-X-ENDLIST'
  ): Promise<string> {
    await this.putObject(key, manifestContent, 'application/vnd.apple.mpegurl');
    return key;
  }

  /**
   * Upload HLS segment
   */
  async uploadHLSSegment(
    key: string,
    segmentContent: Buffer = Buffer.from('mock-video-segment-data')
  ): Promise<string> {
    await this.putObject(key, segmentContent, 'video/MP2T');
    return key;
  }

  /**
   * Upload thumbnail
   */
  async uploadThumbnail(
    key: string,
    thumbnailContent: Buffer = Buffer.from('mock-thumbnail-data')
  ): Promise<string> {
    await this.putObject(key, thumbnailContent, 'image/jpeg');
    return key;
  }

  /**
   * Create HMAC signature for edge URL validation
   */
  createHMACSignature(path: string, expiresAt: number): string {
    const message = `${path}:${expiresAt}`;
    return crypto.createHmac('sha256', this.config.signingKey).update(message).digest('hex');
  }

  /**
   * Create signed preview URL
   */
  createSignedPreviewUrl(path: string, expiresIn: number = 3600): {
    url: string;
    hmac: string;
    expires: number;
  } {
    const requestPath = path.startsWith('/preview/') ? path : `/preview/${path}`;
    const expires = Math.floor(Date.now() / 1000) + expiresIn;
    const hmac = this.createHMACSignature(requestPath, expires);
    
    return {
      url: `${requestPath}?hmac=${hmac}&expires=${expires}`,
      hmac,
      expires
    };
  }

  /**
   * Validate HMAC signature
   */
  validateHMAC(path: string, hmac: string, expires: number): boolean {
    if (!expires || expires < Math.floor(Date.now() / 1000)) {
      return false; // Expired
    }
    const expectedHmac = this.createHMACSignature(path, expires);
    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    );
  }

  /**
   * Create complete HLS preview structure for testing
   */
  async createHLSPreview(prefix: string): Promise<{
    manifestKey: string;
    segmentKeys: string[];
    thumbnailKey: string;
    signedUrls: {
      manifest: string;
      segments: string[];
      thumbnail: string;
    };
  }> {
    const manifestKey = `${prefix}/index.m3u8`;
    const segmentKeys = [];
    const signedUrls = {
      manifest: '',
      segments: [] as string[],
      thumbnail: ''
    };
    
    // Upload manifest
    await this.uploadHLSManifest(manifestKey);
    signedUrls.manifest = this.createSignedPreviewUrl(manifestKey).url;
    
    // Upload segments
    for (let i = 1; i <= 3; i++) {
      const segmentKey = `${prefix}/segment${i.toString().padStart(3, '0')}.ts`;
      await this.uploadHLSSegment(segmentKey);
      segmentKeys.push(segmentKey);
      signedUrls.segments.push(this.createSignedPreviewUrl(segmentKey).url);
    }
    
    // Upload thumbnail
    const thumbnailKey = `${prefix}/thumbnail.jpg`;
    await this.uploadThumbnail(thumbnailKey);
    signedUrls.thumbnail = this.createSignedPreviewUrl(thumbnailKey).url;
    
    return {
      manifestKey,
      segmentKeys,
      thumbnailKey,
      signedUrls
    };
  }

  /**
   * Clean up all test objects
   */
  async cleanup(): Promise<void> {
    const errors: Error[] = [];
    
    for (const key of this.testObjects) {
      try {
        await this.deleteObject(key);
      } catch (error) {
        errors.push(error as Error);
        // Continue cleanup even if some deletions fail
      }
    }
    
    this.testObjects.clear();
    
    if (errors.length > 0) {
      console.warn(`Edge S3 cleanup completed with ${errors.length} errors:`, errors);
    }
  }

  /**
   * Clean up objects with specific prefix
   */
  async cleanupPrefix(prefix: string): Promise<void> {
    try {
      const listResult = await this.listObjects(prefix);
      const objects = listResult.Contents || [];
      
      for (const obj of objects) {
        if (obj.Key) {
          await this.deleteObject(obj.Key);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up prefix ${prefix} in previews bucket:`, error);
    }
  }

  /**
   * Create Edge S3 test client with default MinIO configuration
   */
  static create(config: Partial<EdgeS3TestConfig> = {}): EdgeS3TestClient {
    return new EdgeS3TestClient(config);
  }

  /**
   * Create edge-specific S3 test client
   */
  static forEdge(): EdgeS3TestClient {
    return new EdgeS3TestClient({
      previewsBucket: 'previews-test',
      signingKey: 'test-secret-key-for-hmac-signing'
    });
  }

  /**
   * Create integration test client
   */
  static forIntegration(): EdgeS3TestClient {
    return new EdgeS3TestClient({
      previewsBucket: 'previews-test',
      signingKey: 'test-secret-key-for-hmac-signing'
    });
  }

  /**
   * Validate S3 test environment connectivity
   */
  async validateEnvironment(): Promise<void> {
    try {
      // Test connectivity with simple list operation
      await this.listObjects();
    } catch (error) {
      throw new Error(`Edge S3 test environment validation failed: ${error}`);
    }
  }
}

/**
 * Global Edge S3 test client instance for shared use
 */
export const edgeS3TestClient = EdgeS3TestClient.forEdge();

/**
 * Setup Edge S3 test environment
 */
export async function setupEdgeS3Test(): Promise<EdgeS3TestClient> {
  const client = EdgeS3TestClient.forEdge();
  await client.validateEnvironment();
  return client;
}

/**
 * Teardown Edge S3 test environment
 */
export async function teardownEdgeS3Test(client: EdgeS3TestClient): Promise<void> {
  await client.cleanup();
}

/**
 * Set Edge S3 test environment variables
 */
export function setEdgeS3TestEnv(): void {
  process.env.S3_TEST_ENDPOINT = 'http://localhost:9000';
  process.env.S3_TEST_ACCESS_KEY = 'minioadmin';
  process.env.S3_TEST_SECRET_KEY = 'minioadmin123';
  process.env.S3_TEST_REGION = 'us-east-1';
  
  // Override application S3 config to use test MinIO
  process.env.WASABI_ENDPOINT = 'http://localhost:9000';
  process.env.PREVIEWS_BUCKET = 'previews-test';
  process.env.EDGE_SIGNING_KEY = 'test-secret-key-for-hmac-signing';
}