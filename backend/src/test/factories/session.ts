import { testDb } from '../db-real.js';
import crypto from 'crypto';

export interface TestSession {
  id: string;
  user_id: string;
  jti: string;
  refresh_token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at?: Date;
}

export class SessionFactory {
  static async create(userId: string, overrides: Partial<TestSession> = {}): Promise<TestSession> {
    const sessionId = crypto.randomUUID();
    const jti = crypto.randomUUID();
    const refreshTokenHash = crypto.randomBytes(32).toString('hex');

    const sessionData = {
      id: sessionId,
      user_id: userId,
      jti,
      refresh_token_hash: refreshTokenHash,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      created_at: new Date(),
      ...overrides
    };

    // Insert session into database
    const result = await testDb.query(`
      INSERT INTO sessions (id, user_id, jti, refresh_token_hash, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      sessionData.id,
      sessionData.user_id,
      sessionData.jti,
      sessionData.refresh_token_hash,
      sessionData.expires_at,
      sessionData.created_at
    ]);

    return result.rows[0];
  }

  static async createExpired(userId: string, overrides: Partial<TestSession> = {}): Promise<TestSession> {
    return this.create(userId, {
      ...overrides,
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired 24 hours ago
    });
  }

  static async createRevoked(userId: string, overrides: Partial<TestSession> = {}): Promise<TestSession> {
    const session = await this.create(userId, overrides);
    
    // Revoke the session
    const result = await testDb.query(`
      UPDATE sessions 
      SET revoked_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `, [session.id]);

    return result.rows[0];
  }

  static async findByRefreshTokenHash(hash: string): Promise<TestSession | null> {
    const result = await testDb.query('SELECT * FROM sessions WHERE refresh_token_hash = $1', [hash]);
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<TestSession | null> {
    const result = await testDb.query('SELECT * FROM sessions WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async revoke(sessionId: string): Promise<void> {
    await testDb.query('UPDATE sessions SET revoked_at = NOW() WHERE id = $1', [sessionId]);
  }

  static async cleanup(): Promise<void> {
    // This will be handled by transaction rollback in test cleanup
    // No explicit cleanup needed for real data
  }
}