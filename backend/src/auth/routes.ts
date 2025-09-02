import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { pool } from '../db.js';
import { hashPassword, verifyPassword, validatePasswordStrength } from './password.js';
import { 
  signAccessToken, 
  generateJTI, 
  generateRefreshToken,
  hashRefreshToken,
  verifyAccessToken
} from './jwt.js';
import { authenticateJWT } from './middleware.js';
import type { RegisterRequest, AuthRequest } from './types.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  displayName: z.string().min(2).max(100)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const refreshSchema = z.object({
  refreshToken: z.string()
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register endpoint
  fastify.post('/auth/register', {
    schema: {
      body: registerSchema
    },
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    const { email, password, displayName } = request.body as RegisterRequest;
    
    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      return reply.status(400).send({ 
        error: 'Password does not meet requirements',
        details: validation.errors
      });
    }
    
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return reply.status(409).send({ error: 'Email already registered' });
    }
    
    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    
    await pool.query(
      `INSERT INTO users (id, email, display_name, password_hash, status, authz_version)
       VALUES ($1, $2, $3, $4, 'pending', 1)`,
      [userId, email, displayName, passwordHash]
    );
    
    // Assign default Viewer role
    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE name = 'Viewer'"
    );
    
    if (roleResult.rows.length > 0) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [userId, roleResult.rows[0].id]
      );
    }
    
    // In production, send verification email here
    // For now, auto-activate the user
    await pool.query(
      "UPDATE users SET status = 'active' WHERE id = $1",
      [userId]
    );
    
    return reply.status(201).send({ 
      message: 'Registration successful',
      userId
    });
  });
  
  // Login endpoint
  fastify.post('/auth/login', {
    schema: {
      body: loginSchema
    },
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body as AuthRequest;
    
    // Get user with roles
    const userResult = await pool.query(
      `SELECT u.*, array_agg(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.email = $1
       GROUP BY u.id`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Verify password
    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    
    // Check user status
    if (user.status !== 'active') {
      return reply.status(403).send({ error: `Account ${user.status}` });
    }
    
    // Create session
    const sessionId = crypto.randomUUID();
    const jti = generateJTI();
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    
    await pool.query(
      `INSERT INTO sessions (id, user_id, jti, refresh_token_hash, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')`,
      [sessionId, user.id, jti, refreshTokenHash]
    );
    
    // Generate access token
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles || ['Viewer'],
      sid: sessionId,
      jti,
      rvn: user.authz_version
    });
    
    // Set refresh token cookie
    reply.setCookie('rt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    return reply.send({
      accessToken,
      expiresIn: 900, // 15 minutes
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        roles: user.roles || ['Viewer']
      }
    });
  });
  
  // Refresh endpoint
  fastify.post('/auth/refresh', {
    schema: {
      body: refreshSchema.partial()
    }
  }, async (request, reply) => {
    const refreshToken = (request.body as any).refreshToken || request.cookies.rt;
    
    if (!refreshToken) {
      return reply.status(401).send({ error: 'Refresh token required' });
    }
    
    const tokenHash = hashRefreshToken(refreshToken);
    
    // Find session
    const sessionResult = await pool.query(
      `SELECT s.*, u.email, u.authz_version, array_agg(r.name) as roles
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE s.refresh_token_hash = $1 AND s.revoked_at IS NULL
       GROUP BY s.id, u.id`,
      [tokenHash]
    );
    
    if (sessionResult.rows.length === 0) {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
    
    const session = sessionResult.rows[0];
    
    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      return reply.status(401).send({ error: 'Refresh token expired' });
    }
    
    // Rotate refresh token
    const newSessionId = crypto.randomUUID();
    const newJti = generateJTI();
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
    
    // Create new session and revoke old one
    await pool.query('BEGIN');
    
    await pool.query(
      `UPDATE sessions SET revoked_at = NOW(), replaced_by_jti = $1 WHERE id = $2`,
      [newJti, session.id]
    );
    
    await pool.query(
      `INSERT INTO sessions (id, user_id, jti, refresh_token_hash, parent_jti, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')`,
      [newSessionId, session.user_id, newJti, newRefreshTokenHash, session.jti]
    );
    
    await pool.query('COMMIT');
    
    // Generate new access token
    const accessToken = signAccessToken({
      sub: session.user_id,
      email: session.email,
      roles: session.roles || ['Viewer'],
      sid: newSessionId,
      jti: newJti,
      rvn: session.authz_version
    });
    
    // Set new refresh token cookie
    reply.setCookie('rt', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    
    return reply.send({
      accessToken,
      expiresIn: 900
    });
  });
  
  // Logout endpoint
  fastify.post('/auth/logout', {
    preHandler: authenticateJWT
  }, async (request, reply) => {
    const allDevices = (request.body as any)?.allDevices === true;
    
    if (allDevices) {
      // Revoke all sessions for user
      await pool.query(
        'UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
        [request.user!.sub]
      );
    } else {
      // Revoke current session
      await pool.query(
        'UPDATE sessions SET revoked_at = NOW() WHERE id = $1',
        [request.user!.sid]
      );
    }
    
    // Clear refresh token cookie
    reply.clearCookie('rt', { path: '/auth' });
    
    return reply.status(204).send();
  });
  
  // Get current user endpoint
  fastify.get('/auth/me', {
    preHandler: authenticateJWT
  }, async (request, reply) => {
    const result = await pool.query(
      `SELECT id, email, display_name, status, created_at, updated_at
       FROM users WHERE id = $1`,
      [request.user!.sub]
    );
    
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    return reply.send({
      ...result.rows[0],
      roles: request.user!.roles
    });
  });
}