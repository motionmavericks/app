import { vi } from 'vitest';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_SECRET = 'test-refresh-secret';
process.env.PORT = '3000';
process.env.LOG_LEVEL = 'error';

// IMPORTANT: Remove database and Redis URLs in test mode to force mock usage
delete process.env.POSTGRES_URL;
delete process.env.REDIS_URL;

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
  Redis.prototype.ping = vi.fn().mockResolvedValue('PONG');
  return { default: Redis };
});

// Don't mock the database - let db.ts handle test mode properly