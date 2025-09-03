import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkerS3TestClient, setWorkerS3TestEnv } from '../src/test/s3-real';

// Helper function to skip tests when S3 is not available
const skipIfS3Unavailable = (s3Available: boolean, testFn: () => Promise<void>) => {
  return async () => {
    if (!s3Available) {
      console.log('Skipping S3 test - environment not available');
      return;
    }
    await testFn();
  };
};

describe('Worker S3 Integration', () => {
  let s3Client: WorkerS3TestClient;
  let s3Available = false;

  beforeEach(async () => {
    setWorkerS3TestEnv();
    s3Client = WorkerS3TestClient.forWorker();
    
    // Try to validate S3 environment, but don't fail tests if unavailable
    try {
      await s3Client.validateEnvironment();
      s3Available = true;
    } catch (error) {
      s3Available = false;
      console.warn('Worker S3 test environment not available, tests will be skipped');
    }
  });

  afterEach(async () => {
    if (s3Available) {
      try {
        await s3Client.cleanup();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  it('should upload and download master files', async () => {
    if (!s3Available) {
      console.log('Skipping S3 test - environment not available');
      return;
    }
    
    const masterKey = 'masters/test-upload.mp4';
    const testContent = 'test-video-content-for-worker';
    
    // Upload master file
    await s3Client.uploadMasterFile(masterKey, testContent, 'video/mp4');
    
    // Verify file exists
    const exists = await s3Client.objectExists(s3Client.getConfig().mastersBucket, masterKey);
    expect(exists).toBe(true);
    
    // Download and verify content
    const downloadedBuffer = await s3Client.downloadToBuffer(s3Client.getConfig().mastersBucket, masterKey);
    expect(downloadedBuffer.toString()).toBe(testContent);
  });

  it('should create presigned URLs for master file access', async () => {
    if (!s3Available) {
      console.log('Skipping S3 test - environment not available');
      return;
    }
    
    const masterKey = 'masters/test-presign.mp4';
    const testContent = Buffer.from('test-video-content-for-presigning');
    
    // Upload test file
    await s3Client.uploadMasterFile(masterKey, testContent, 'video/mp4');
    
    // Create presigned URL
    const presignedUrl = await s3Client.createPresignedGetUrl(
      s3Client.getConfig().mastersBucket,
      masterKey,
      300
    );
    
    // Verify URL format
    expect(presignedUrl).toContain('masters-test');
    expect(presignedUrl).toContain(masterKey);
    expect(presignedUrl).toContain('X-Amz-Signature');
    expect(presignedUrl).toContain('X-Amz-Expires=300');
    
    // Test actual download via presigned URL
    const response = await fetch(presignedUrl);
    expect(response.ok).toBe(true);
    
    const downloadedContent = await response.arrayBuffer();
    expect(Buffer.from(downloadedContent)).toEqual(testContent);
  });

  it('should create complete HLS preview structure', async () => {
    const previewPrefix = `previews/test-${Date.now()}`;
    
    // Create HLS preview structure
    const preview = await s3Client.createHLSPreview(previewPrefix);
    
    // Verify all components were created
    expect(preview.manifestKey).toContain('index.m3u8');
    expect(preview.segmentKeys).toHaveLength(3);
    expect(preview.thumbnailKey).toContain('thumbnail.jpg');
    
    // Verify manifest exists and has correct content type
    const manifestExists = await s3Client.objectExists(
      s3Client.getConfig().previewsBucket,
      preview.manifestKey
    );
    expect(manifestExists).toBe(true);
    
    const manifestMeta = await s3Client.getObjectMetadata(
      s3Client.getConfig().previewsBucket,
      preview.manifestKey
    );
    expect(manifestMeta.ContentType).toBe('application/vnd.apple.mpegurl');
    
    // Verify segments exist
    for (const segmentKey of preview.segmentKeys) {
      const segmentExists = await s3Client.objectExists(
        s3Client.getConfig().previewsBucket,
        segmentKey
      );
      expect(segmentExists).toBe(true);
    }
    
    // Verify thumbnail exists
    const thumbnailExists = await s3Client.objectExists(
      s3Client.getConfig().previewsBucket,
      preview.thumbnailKey
    );
    expect(thumbnailExists).toBe(true);
  });

  it('should upload individual preview components', async () => {
    const previewPrefix = `previews/manual-${Date.now()}`;
    
    // Upload HLS manifest
    const manifestContent = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXTINF:10.0,\nsegment001.ts\n#EXT-X-ENDLIST';
    const manifestKey = await s3Client.uploadHLSManifest(previewPrefix, manifestContent);
    
    // Upload HLS segment
    const segmentContent = Buffer.from('mock-hls-segment-data');
    const segmentKey = await s3Client.uploadHLSSegment(previewPrefix, 'segment001.ts', segmentContent);
    
    // Upload thumbnail
    const thumbnailContent = Buffer.from('mock-thumbnail-jpeg-data');
    const thumbnailKey = await s3Client.uploadThumbnail(previewPrefix, 'thumb.jpg', thumbnailContent);
    
    // Verify all uploads
    const manifestExists = await s3Client.objectExists(s3Client.getConfig().previewsBucket, manifestKey);
    const segmentExists = await s3Client.objectExists(s3Client.getConfig().previewsBucket, segmentKey);
    const thumbnailExists = await s3Client.objectExists(s3Client.getConfig().previewsBucket, thumbnailKey);
    
    expect(manifestExists).toBe(true);
    expect(segmentExists).toBe(true);
    expect(thumbnailExists).toBe(true);
    
    // Verify content types
    const manifestMeta = await s3Client.getObjectMetadata(s3Client.getConfig().previewsBucket, manifestKey);
    const segmentMeta = await s3Client.getObjectMetadata(s3Client.getConfig().previewsBucket, segmentKey);
    const thumbnailMeta = await s3Client.getObjectMetadata(s3Client.getConfig().previewsBucket, thumbnailKey);
    
    expect(manifestMeta.ContentType).toBe('application/vnd.apple.mpegurl');
    expect(segmentMeta.ContentType).toBe('video/MP2T');
    expect(thumbnailMeta.ContentType).toBe('image/jpeg');
  });

  it('should handle content type inference correctly', async () => {
    const previewPrefix = `previews/types-${Date.now()}`;
    
    // Test different file types
    const files = [
      { name: 'playlist.m3u8', expectedType: 'application/vnd.apple.mpegurl' },
      { name: 'segment.ts', expectedType: 'video/MP2T' },
      { name: 'video.mp4', expectedType: 'video/mp4' },
      { name: 'image.jpg', expectedType: 'image/jpeg' },
      { name: 'image.png', expectedType: 'image/png' },
      { name: 'image.webp', expectedType: 'image/webp' },
      { name: 'unknown.xyz', expectedType: 'application/octet-stream' }
    ];
    
    for (const file of files) {
      const key = `${previewPrefix}/${file.name}`;
      await s3Client.putObject(
        s3Client.getConfig().previewsBucket,
        key,
        'test-content',
        undefined // Let it infer content type
      );
      
      const metadata = await s3Client.getObjectMetadata(s3Client.getConfig().previewsBucket, key);
      expect(metadata.ContentType).toBe(file.expectedType);
    }
  });

  it('should clean up objects by prefix', async () => {
    const testPrefix = `cleanup-test/${Date.now()}`;
    
    // Upload multiple test objects
    const objects = ['file1.mp4', 'file2.m3u8', 'file3.ts'];
    for (const obj of objects) {
      await s3Client.putObject(
        s3Client.getConfig().previewsBucket,
        `${testPrefix}/${obj}`,
        'test-content'
      );
    }
    
    // Verify objects exist
    for (const obj of objects) {
      const exists = await s3Client.objectExists(s3Client.getConfig().previewsBucket, `${testPrefix}/${obj}`);
      expect(exists).toBe(true);
    }
    
    // Clean up by prefix
    await s3Client.cleanupPrefix(s3Client.getConfig().previewsBucket, testPrefix);
    
    // Verify objects are gone
    for (const obj of objects) {
      const exists = await s3Client.objectExists(s3Client.getConfig().previewsBucket, `${testPrefix}/${obj}`);
      expect(exists).toBe(false);
    }
  });

  it('should create test environment with sample data', async () => {
    const testEnv = await s3Client.createTestEnvironment();
    
    // Verify master file exists
    const masterExists = await s3Client.objectExists(s3Client.getConfig().mastersBucket, testEnv.masterKey);
    expect(masterExists).toBe(true);
    
    // Verify preview structure exists
    const manifestExists = await s3Client.objectExists(s3Client.getConfig().previewsBucket, testEnv.manifestKey);
    expect(manifestExists).toBe(true);
    
    expect(testEnv.segmentKeys.length).toBeGreaterThan(0);
    for (const segmentKey of testEnv.segmentKeys) {
      const segmentExists = await s3Client.objectExists(s3Client.getConfig().previewsBucket, segmentKey);
      expect(segmentExists).toBe(true);
    }
    
    const thumbnailExists = await s3Client.objectExists(s3Client.getConfig().previewsBucket, testEnv.thumbnailKey);
    expect(thumbnailExists).toBe(true);
  });

  it('should handle S3 error conditions gracefully', async () => {
    // Test with non-existent object
    const exists = await s3Client.objectExists('masters-test', 'non-existent-key.mp4');
    expect(exists).toBe(false);
    
    // Test getting metadata for non-existent object
    await expect(
      s3Client.getObjectMetadata('masters-test', 'non-existent-key.mp4')
    ).rejects.toThrow();
    
    // Test downloading non-existent object
    await expect(
      s3Client.downloadToBuffer('masters-test', 'non-existent-key.mp4')
    ).rejects.toThrow();
  });
});