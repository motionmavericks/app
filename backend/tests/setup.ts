import { vi } from 'vitest';

// Test environment variables for real database testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_SECRET = 'test-refresh-secret';
process.env.PORT = '3000';
process.env.LOG_LEVEL = 'error';

// REAL DATABASE TESTING: Use actual PostgreSQL test database
process.env.POSTGRES_TEST_URL = process.env.POSTGRES_TEST_URL || 'postgresql://postgres:postgres@localhost:5433/motionmavericks_test';

// Mock Redis connection (still needed for non-database tests)
vi.mock('ioredis', () => {
  const Redis = vi.fn();
  Redis.prototype.on = vi.fn();
  Redis.prototype.connect = vi.fn();
  Redis.prototype.disconnect = vi.fn();
  Redis.prototype.get = vi.fn();
  Redis.prototype.set = vi.fn();
  Redis.prototype.del = vi.fn();
  Redis.prototype.expire = vi.fn();
  Redis.prototype.xadd = vi.fn();
  Redis.prototype.xread = vi.fn();
  Redis.prototype.xgroup = vi.fn();
  Redis.prototype.xreadgroup = vi.fn();
  Redis.prototype.xack = vi.fn();
  Redis.prototype.ping = vi.fn().mockResolvedValue('PONG');
  return { default: Redis };
});

// Setup real database for all tests (moved to individual test files to avoid vitest global setup issues)