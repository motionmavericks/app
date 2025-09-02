import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { build } from '../src/app';

describe('Authentication Integration Tests', () => {
  let app: FastifyInstance;
  let testUserId: string;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    app = await build({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await cleanupTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  async function cleanupTestData() {
    // In a real implementation, this would clean up test users and sessions
    // For now, we'll use the email pattern to identify test users
    try {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/test/cleanup',
        headers: {
          'authorization': `Bearer ${accessToken}`
        }
      });
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  }

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test.user@example.com',
          displayName: 'Test User',
          password: 'TestPass123!'
        }
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('email', 'test.user@example.com');
      expect(data.user).toHaveProperty('displayName', 'Test User');
      expect(data.user).not.toHaveProperty('password_hash');
      
      testUserId = data.user.id;
    });

    it('should reject registration with duplicate email', async () => {
      // First registration
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'duplicate@example.com',
          displayName: 'First User',
          password: 'TestPass123!'
        }
      });

      // Second registration with same email
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'duplicate@example.com',
          displayName: 'Second User',
          password: 'TestPass123!'
        }
      });

      expect(response.statusCode).toBe(409);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('email already exists');
    });

    it('should reject registration with weak password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'weak.password@example.com',
          displayName: 'Weak Password User',
          password: '123'
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('password');
    });

    it('should reject registration with invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'invalid-email',
          displayName: 'Invalid Email User',
          password: 'TestPass123!'
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('email');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'login.test@example.com',
          displayName: 'Login Test User',
          password: 'TestPass123!'
        }
      });
      
      const data = JSON.parse(response.body);
      testUserId = data.user.id;
    });

    it('should login with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'login.test@example.com',
          password: 'TestPass123!'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('accessToken');
      expect(data).toHaveProperty('refreshToken');
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('email', 'login.test@example.com');
      
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
    });

    it('should reject login with invalid password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'login.test@example.com',
          password: 'WrongPassword'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('invalid');
    });

    it('should reject login with non-existent email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'TestPass123!'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('invalid');
    });
  });

  describe('Token Refresh', () => {
    beforeEach(async () => {
      // Create and login a test user
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'refresh.test@example.com',
          displayName: 'Refresh Test User',
          password: 'TestPass123!'
        }
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'refresh.test@example.com',
          password: 'TestPass123!'
        }
      });

      const loginData = JSON.parse(loginResponse.body);
      accessToken = loginData.accessToken;
      refreshToken = loginData.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refreshToken: refreshToken
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('accessToken');
      expect(data).toHaveProperty('refreshToken');
      expect(data.accessToken).not.toBe(accessToken);
      expect(data.refreshToken).not.toBe(refreshToken);
    });

    it('should reject refresh with invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refreshToken: 'invalid-refresh-token'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('invalid');
    });
  });

  describe('Protected Endpoints', () => {
    beforeEach(async () => {
      // Create and login a test user
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'protected.test@example.com',
          displayName: 'Protected Test User',
          password: 'TestPass123!'
        }
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'protected.test@example.com',
          password: 'TestPass123!'
        }
      });

      const loginData = JSON.parse(loginResponse.body);
      accessToken = loginData.accessToken;
    });

    it('should access protected endpoint with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/profile',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.user).toHaveProperty('email', 'protected.test@example.com');
    });

    it('should reject protected endpoint without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/profile'
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('authentication');
    });

    it('should reject protected endpoint with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/profile',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('invalid');
    });
  });

  describe('Logout', () => {
    beforeEach(async () => {
      // Create and login a test user
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'logout.test@example.com',
          displayName: 'Logout Test User',
          password: 'TestPass123!'
        }
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'logout.test@example.com',
          password: 'TestPass123!'
        }
      });

      const loginData = JSON.parse(loginResponse.body);
      accessToken = loginData.accessToken;
      refreshToken = loginData.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(200);
    });

    it('should not access protected endpoints after logout', async () => {
      // First logout
      await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      // Try to access protected endpoint
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/profile',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
