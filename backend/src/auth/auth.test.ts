import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { setupDatabase } from '../tests/setup-db.js';
import { UserFactory, SessionFactory } from '../test/factories/index.js';
import { testDb } from '../test/db-real.js';
import { hashPassword, verifyPassword } from './password.js';

describe('Authentication with Real Database', () => {
  beforeAll(async () => {
    await setupDatabase.initialize();
  });

  afterAll(async () => {
    await setupDatabase.close();
  });

  beforeEach(async () => {
    await setupDatabase.startTransaction();
  });

  afterEach(async () => {
    await setupDatabase.cleanup();
  });
  describe('User Operations', () => {
    it('should create user with real data', async () => {
      const user = await UserFactory.create({
        email: 'test@example.com',
        display_name: 'Test User'
      });

      expect(user).toMatchObject({
        email: 'test@example.com',
        display_name: 'Test User',
        status: 'active'
      });
      expect(user.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(user.password_hash).toBeTruthy();
      expect(user.created_at).toBeInstanceOf(Date);
    });

    it('should find user by email', async () => {
      const email = 'findme@example.com';
      const createdUser = await UserFactory.create({ email });

      const foundUser = await UserFactory.findByEmail(email);

      expect(foundUser).toMatchObject({
        email,
        id: createdUser.id
      });
    });

    it('should update user status in database', async () => {
      const user = await UserFactory.createPending();
      
      // Update user status directly in database
      const result = await testDb.query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        ['active', user.id]
      );

      expect(result.rows[0].status).toBe('active');
      expect(new Date(result.rows[0].updated_at)).toBeInstanceOf(Date);
    });

    it('should validate password hashing', async () => {
      const plainPassword = 'testpassword123';
      const hashedPassword = await hashPassword(plainPassword);
      
      const user = await UserFactory.create({
        password_hash: hashedPassword
      });

      const isValid = await verifyPassword(plainPassword, user.password_hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('wrongpassword', user.password_hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Session Operations', () => {
    it('should create session with real data', async () => {
      const user = await UserFactory.create();
      const session = await SessionFactory.create(user.id);

      expect(session).toMatchObject({
        user_id: user.id
      });
      expect(session.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(session.jti).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(session.refresh_token_hash).toBeTruthy();
      expect(session.expires_at).toBeInstanceOf(Date);
      expect(session.created_at).toBeInstanceOf(Date);
    });

    it('should find session by refresh token hash', async () => {
      const user = await UserFactory.create();
      const session = await SessionFactory.create(user.id);

      const foundSession = await SessionFactory.findByRefreshTokenHash(session.refresh_token_hash);

      expect(foundSession).toMatchObject({
        id: session.id,
        user_id: user.id,
        refresh_token_hash: session.refresh_token_hash
      });
    });

    it('should handle expired sessions', async () => {
      const user = await UserFactory.create();
      const expiredSession = await SessionFactory.createExpired(user.id);

      expect(expiredSession.expires_at.getTime()).toBeLessThan(Date.now());
    });

    it('should revoke sessions in database', async () => {
      const user = await UserFactory.create();
      const session = await SessionFactory.create(user.id);

      await SessionFactory.revoke(session.id);

      const revokedSession = await SessionFactory.findById(session.id);
      expect(revokedSession?.revoked_at).toBeTruthy();
    });
  });

  describe('Complex User-Session Queries', () => {
    it('should join users and sessions with roles', async () => {
      const user = await UserFactory.create();
      const session = await SessionFactory.create(user.id);

      // Complex query with real database joins
      const result = await testDb.query(`
        SELECT s.*, u.email, u.authz_version, array_agg(r.name) as roles
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE s.refresh_token_hash = $1
        GROUP BY s.id, u.email, u.authz_version
      `, [session.refresh_token_hash]);

      expect(result.rows).toHaveLength(1);
      const sessionWithUser = result.rows[0];
      
      expect(sessionWithUser).toMatchObject({
        id: session.id,
        user_id: user.id,
        email: user.email,
        authz_version: user.authz_version
      });
      expect(Array.isArray(sessionWithUser.roles)).toBe(true);
    });
  });
});