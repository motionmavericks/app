import { testDb } from '../db-real.js';
import crypto from 'crypto';
import { hashPassword } from '../../auth/password.js';

export interface TestUser {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  status: 'pending' | 'active' | 'suspended';
  authz_version: number;
  created_at: Date;
  updated_at: Date;
}

export class UserFactory {
  static async create(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    const userId = crypto.randomUUID();
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    
    const userData = {
      id: userId,
      email: `test-${randomSuffix}@example.com`,
      display_name: `Test User ${randomSuffix}`,
      password_hash: await hashPassword('password123'),
      status: 'active' as const,
      authz_version: 1,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };

    // Insert user into database
    const result = await testDb.query(`
      INSERT INTO users (id, email, display_name, password_hash, status, authz_version, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      userData.id,
      userData.email,
      userData.display_name,
      userData.password_hash,
      userData.status,
      userData.authz_version,
      userData.created_at,
      userData.updated_at
    ]);

    // Assign default role
    const roleResult = await testDb.query('SELECT id FROM roles WHERE name = $1', ['Viewer']);
    if (roleResult.rows.length > 0) {
      await testDb.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [userData.id, roleResult.rows[0].id]
      );
    }

    return result.rows[0];
  }

  static async createPending(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    return this.create({ ...overrides, status: 'pending' });
  }

  static async createActive(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    return this.create({ ...overrides, status: 'active' });
  }

  static async findByEmail(email: string): Promise<TestUser | null> {
    const result = await testDb.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<TestUser | null> {
    const result = await testDb.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async cleanup(): Promise<void> {
    // This will be handled by transaction rollback in test cleanup
    // No explicit cleanup needed for real data
  }
}