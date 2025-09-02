import { vi } from 'vitest';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_SECRET = 'test-refresh-secret';
process.env.PORT = '3000';
process.env.LOG_LEVEL = 'error';

// Mock Redis connection
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
  return { default: Redis };
});

// Mock database pool
vi.mock('../src/db.js', () => ({
  pool: {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: vi.fn(),
    end: vi.fn()
  }
}));