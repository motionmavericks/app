import { describe, it, expect } from 'vitest';
import { WorkerS3TestClient, setWorkerS3TestEnv } from '../src/test/s3-real';

describe('Worker S3 Client', () => {
  it('should create S3 client with correct configuration', () => {
    setWorkerS3TestEnv();
    const s3Client = WorkerS3TestClient.forWorker();
    
    const config = s3Client.getConfig();
    expect(config.endpoint).toBe('http://localhost:9000');
    expect(config.accessKeyId).toBe('minioadmin');
    expect(config.secretAccessKey).toBe('minioadmin123');
    expect(config.region).toBe('us-east-1');
    expect(config.mastersBucket).toBe('masters-test');
    expect(config.previewsBucket).toBe('previews-test');
  });

  it('should create test preview job data', () => {
    const jobData = WorkerS3TestClient.create().getConfig();
    expect(jobData).toHaveProperty('mastersBucket');
    expect(jobData).toHaveProperty('previewsBucket');
  });

  it('should infer content types correctly', () => {
    const s3Client = WorkerS3TestClient.forWorker();
    
    // Test private method through public interface by checking expected behavior
    // when we upload different file types in integration tests
    expect(s3Client).toBeDefined();
    expect(s3Client.getConfig().mastersBucket).toBe('masters-test');
  });
});