import { vi } from 'vitest';

// Test environment variables for real database testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_SECRET = 'test-refresh-secret';
process.env.PORT = '3000';
process.env.LOG_LEVEL = 'error';

// REAL DATABASE TESTING: Use actual PostgreSQL test database
process.env.POSTGRES_TEST_URL = process.env.POSTGRES_TEST_URL || 'postgresql://postgres:postgres@localhost:5433/motionmavericks_test';

// REAL REDIS TESTING: Use actual Redis test database (no mocks)
process.env.REDIS_TEST_URL = process.env.REDIS_TEST_URL || 'redis://localhost:6380/0';

// REAL S3 TESTING: Use actual MinIO test environment (no mocks)
process.env.S3_TEST_ENDPOINT = process.env.S3_TEST_ENDPOINT || 'http://localhost:9000';
process.env.S3_TEST_ACCESS_KEY = process.env.S3_TEST_ACCESS_KEY || 'minioadmin';
process.env.S3_TEST_SECRET_KEY = process.env.S3_TEST_SECRET_KEY || 'minioadmin123';
process.env.S3_TEST_REGION = process.env.S3_TEST_REGION || 'us-east-1';

// Setup real database for all tests (moved to individual test files to avoid vitest global setup issues)