import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { build } from '../src/app';
import { verifyAccessToken } from '../src/auth/jwt';

describe('Debug Auth Flow', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should debug the full auth flow', async () => {
    // Step 1: Register a user
    console.log('=== REGISTERING USER ===');
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'debug.test@example.com',
        displayName: 'Debug Test User',
        password: 'TestPass123!'
      }
    });

    console.log('Register Status:', registerResponse.statusCode);
    console.log('Register Body:', registerResponse.body);
    
    expect(registerResponse.statusCode).toBe(201);
    const userData = JSON.parse(registerResponse.body);
    
    console.log('Parsed User Data:', userData);
    expect(userData.user).toBeDefined();
    expect(userData.user.id).toBeDefined();
    
    // Step 2: Login with the same user
    console.log('\n=== LOGGING IN USER ===');
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'debug.test@example.com',
        password: 'TestPass123!'
      }
    });

    console.log('Login Status:', loginResponse.statusCode);
    console.log('Login Body:', loginResponse.body);
    
    if (loginResponse.statusCode !== 200) {
      console.error('Login failed:', loginResponse.body);
    }
    
    expect(loginResponse.statusCode).toBe(200);
    const loginData = JSON.parse(loginResponse.body);
    expect(loginData.accessToken).toBeDefined();
    expect(loginData.refreshToken).toBeDefined();
    
    // Step 2.5: Decode the access token to see what's in it
    console.log('\n=== DECODING ACCESS TOKEN ===');
    try {
      const decodedToken = verifyAccessToken(loginData.accessToken);
      console.log('Decoded Token:', decodedToken);
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
    
    // Step 3: Use the access token
    console.log('\n=== USING ACCESS TOKEN ===');
    const meResponse = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: `Bearer ${loginData.accessToken}`
      }
    });

    console.log('Me Status:', meResponse.statusCode);
    console.log('Me Body:', meResponse.body);
    
    expect(meResponse.statusCode).toBe(200);
  });
});