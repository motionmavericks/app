import { vi } from 'vitest'

// Mock environment variables first
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  REDIS_URL: 'redis://localhost:6379',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_ACCESS_KEY: 'test-key',
  S3_SECRET_KEY: 'test-secret',
  S3_REGION: 'us-east-1',
  S3_BUCKET_MASTERS: 'test-masters',
  S3_BUCKET_PREVIEWS: 'test-previews',
  FFMPEG_PATH: '/usr/bin/ffmpeg',
  SENTRY_DSN: '',
}

// REAL REDIS TESTING: Use actual Redis test database (no mocks)
process.env.REDIS_TEST_URL = process.env.REDIS_TEST_URL || 'redis://localhost:6380/1';

// REAL S3 TESTING: Use actual MinIO test environment (no mocks)
process.env.S3_TEST_ENDPOINT = process.env.S3_TEST_ENDPOINT || 'http://localhost:9000';
process.env.S3_TEST_ACCESS_KEY = process.env.S3_TEST_ACCESS_KEY || 'minioadmin';
process.env.S3_TEST_SECRET_KEY = process.env.S3_TEST_SECRET_KEY || 'minioadmin123';
process.env.S3_TEST_REGION = process.env.S3_TEST_REGION || 'us-east-1';

// Mock child_process for FFmpeg with proper mock functions
const mockSpawn = vi.fn()
const mockExec = vi.fn()

vi.mock('child_process', () => ({
  spawn: mockSpawn,
  exec: mockExec,
}))

// Mock fs for file operations
vi.mock('fs/promises', () => ({
  unlink: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockResolvedValue(undefined),
}))

// Mock Sentry
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})