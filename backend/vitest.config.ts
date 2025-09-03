import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Environment setup for real database testing
    environment: 'node',
    
    // Test environment variables
    env: {
      NODE_ENV: 'test',
      POSTGRES_TEST_URL: 'postgresql://postgres:postgres@localhost:5433/motionmavericks_test',
      REDIS_TEST_URL: 'redis://localhost:6380/0',
      S3_TEST_ENDPOINT: 'http://localhost:9000',
      S3_TEST_ACCESS_KEY: 'minioadmin',
      S3_TEST_SECRET_KEY: 'minioadmin123',
      S3_TEST_REGION: 'us-east-1',
      S3_STAGING_BUCKET: 'staging-test',
      S3_MASTERS_BUCKET: 'masters-test',
      S3_PREVIEWS_BUCKET: 'previews-test'
    },
    
    // Test patterns
    include: [
      'tests/**/*.spec.ts',
      'tests/**/*.test.ts',
      'src/**/*.test.ts',
      'src/**/__tests__/**/*.ts'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.vitest',
      'coverage'
    ],
    
    // Timeout settings for database operations
    testTimeout: 10000,
    hookTimeout: 30000,
    
    // Run tests sequentially to avoid database conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        'src/**/*.test.ts',
        'src/tests/**',
        'src/test/**'
      ]
    },
    
    // Database setup/teardown (disabled for unit tests that don't need real DB)
    // globalSetup: './src/tests/global-setup.ts',
    
    // Test setup file for all tests
    setupFiles: ['./tests/setup.ts']
  }
});