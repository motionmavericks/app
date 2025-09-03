import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { build } from '../src/app';
import { setupDatabase } from '../src/tests/setup-db.js';

describe('Authentication Integration Tests', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let refreshToken: string;
  let testUserId: string;
  let testUserEmail: string;

  beforeAll(async () => {
    // Initialize real test database
    await setupDatabase.initialize();
    app = await build({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await setupDatabase.close();
  });

  beforeEach(async () => {
    // Start fresh transaction for test isolation
    await setupDatabase.startTransaction();
    
    // Clear any existing tokens
    accessToken = '';
    refreshToken = '';
    testUserId = '';
    testUserEmail = '';
  });

  afterEach(async () => {
    // Rollback transaction to cleanup test data
    await setupDatabase.cleanup();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'register.test@example.com',
          displayName: 'Registration Test User',
          password: 'TestPass123!'
        }
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.message).toBe('Registration successful');
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('email', 'register.test@example.com');
      expect(data.user).toHaveProperty('displayName', 'Registration Test User');
    });

    it('should reject registration with duplicate email', async () => {
      // First registration
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'duplicate.test@example.com',
          displayName: 'Duplicate Test User',
          password: 'TestPass123!'
        }
      });

      // Second registration with same email
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'duplicate.test@example.com',
          displayName: 'Duplicate Test User 2',
          password: 'TestPass123!'
        }
      });

      expect(response.statusCode).toBe(409);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('Email already exists');
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
      expect(data.error).toContain('Password must be at least 12 characters');
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
      expect(data.error).toContain('Invalid email format');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'login.test@example.com',
          displayName: 'Login Test User',
          password: 'TestPass123!'
        }
      });
      
      const userData = JSON.parse(registerResponse.body);
      testUserId = userData.user.id;
      testUserEmail = userData.user.email;
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
      expect(data.user).toHaveProperty('id');
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
          password: 'WrongPassword123!'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('Invalid credentials');
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
      expect(data.error).toContain('Invalid credentials');
    });
  });

  describe('Token Refresh', () => {
    beforeEach(async () => {
      // Create and login a user for token refresh tests
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
      refreshToken = loginData.refreshToken;
      accessToken = loginData.accessToken;
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
    });

    it('should reject refresh with invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refreshToken: 'invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('Invalid refresh token');
    });
  });

  describe('Protected Endpoints', () => {
    beforeEach(async () => {
      // Create and login a user for protected endpoint tests
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
        url: '/api/auth/me',
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
        url: '/api/auth/me'
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('Missing or invalid authorization header');
    });

    it('should reject protected endpoint with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toContain('Invalid token');
    });
  });

  describe('Logout', () => {
    beforeEach(async () => {
      // Create and login a user for logout tests
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
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });
});