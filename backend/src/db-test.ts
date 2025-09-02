// Test database mock for when PostgreSQL is not available
import type { Pool as PgPool } from 'pg';

// Mock pool that simulates database responses for tests
class MockPool {
  private mockData: Map<string, any> = new Map();
  
  constructor() {
    // Set up default mock data
    this.setupMockData();
  }
  
  private setupMockData() {
    // Mock users
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      display_name: 'Test User',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      status: 'active',
      authz_version: 1,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.mockData.set('SELECT * FROM users WHERE email = $1', { rows: [mockUser], rowCount: 1 });
    this.mockData.set('SELECT id, email, display_name FROM users WHERE id = $1', { rows: [mockUser], rowCount: 1 });
    this.mockData.set('SELECT authz_version FROM users WHERE id = $1', { rows: [{ authz_version: 1 }], rowCount: 1 });
  }
  
  async query(text: string, params?: any[]): Promise<any> {
    // Return mock data based on query pattern
    for (const [pattern, result] of this.mockData.entries()) {
      if (text.includes(pattern.split(' WHERE')[0])) {
        return Promise.resolve(result);
      }
    }
    
    // Default empty result
    return Promise.resolve({ rows: [], rowCount: 0 });
  }
  
  async connect() {
    return Promise.resolve({
      query: this.query.bind(this),
      release: () => Promise.resolve()
    });
  }
  
  async end() {
    return Promise.resolve();
  }
}

// Export mock pool for tests
export const pool = process.env.NODE_ENV === 'test' ? new MockPool() as any : undefined;