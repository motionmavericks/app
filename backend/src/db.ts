import { Pool } from 'pg';

const pgUrl = process.env.POSTGRES_URL;

// For tests, use mock database that simulates real behavior
let pool: Pool | undefined;

if (process.env.NODE_ENV === 'test') {
  // Create enhanced mock pool with realistic responses and in-memory storage
  const users: Map<string, any> = new Map();
  const sessions: Map<string, any> = new Map();
  
  const mockPool = {
    query: async (text: string, params?: any[]) => {
      // Provide more realistic mock responses based on query patterns
      if (text.includes('SELECT * FROM users WHERE email') || text.includes('SELECT id FROM users WHERE email')) {
        const email = params?.[0];
        const user = Array.from(users.values()).find(u => u.email === email);
        return user ? { rows: [user], rowCount: 1 } : { rows: [], rowCount: 0 };
      }
      
      if (text.includes('INSERT INTO users')) {
        const userData = {
          id: params?.[0] || 'test-user-id',
          email: params?.[1] || 'test@example.com',
          display_name: params?.[2] || 'Test User',
          password_hash: params?.[3],
          status: 'pending',
          authz_version: 1
        };
        users.set(userData.id, userData);
        return { rows: [userData], rowCount: 1 };
      }
      
      if (text.includes('SELECT id FROM roles WHERE name')) {
        return { rows: [{ id: 'test-role-id' }], rowCount: 1 };
      }
      
      if (text.includes('INSERT INTO user_roles')) {
        return { rows: [], rowCount: 1 };
      }
      
      if (text.includes('UPDATE users SET status')) {
        const userId = params?.[0];
        const user = users.get(userId);
        if (user) {
          user.status = 'active';
          users.set(userId, user);
        }
        return { rows: [], rowCount: 1 };
      }
      
      if (text.includes('SELECT id, email, display_name FROM users WHERE id')) {
        const userId = params?.[0];
        const user = users.get(userId);
        if (user) {
          return { rows: [{
            id: user.id,
            email: user.email,
            display_name: user.display_name
          }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      
      if (text.includes('SELECT u.*, array_agg(r.name) as roles')) {
        const email = params?.[0];
        const user = Array.from(users.values()).find(u => u.email === email);
        if (user) {
          return { rows: [{
            ...user,
            roles: ['Viewer']
          }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      
      if (text.includes('INSERT INTO sessions')) {
        const sessionData = {
          id: params?.[0],
          user_id: params?.[1],
          jti: params?.[2],
          refresh_token_hash: params?.[3],
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
        sessions.set(sessionData.id, sessionData);
        return { rows: [], rowCount: 1 };
      }
      
      if (text.includes('SELECT s.*, u.email, u.authz_version, array_agg(r.name) as roles')) {
        const tokenHash = params?.[0];
        const session = Array.from(sessions.values()).find(s => s.refresh_token_hash === tokenHash);
        if (session) {
          const user = users.get(session.user_id);
          return { rows: [{
            ...session,
            email: user?.email || 'test@example.com',
            authz_version: user?.authz_version || 1,
            roles: ['Viewer']
          }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      
      // Transaction commands
      if (text === 'BEGIN' || text === 'COMMIT') {
        return { rows: [], rowCount: 0 };
      }
      
      if (text.includes('UPDATE sessions SET revoked_at')) {
        return { rows: [], rowCount: 1 };
      }
      
      if (text.includes('SELECT authz_version FROM users WHERE id')) {
        const userId = params?.[0];
        const user = users.get(userId);
        return user ? { rows: [{ authz_version: user.authz_version }], rowCount: 1 } : { rows: [], rowCount: 0 };
      }
      
      // Health check
      if (text === 'select 1') {
        return { rows: [{ '?column?': 1 }], rowCount: 1 };
      }
      
      // Default empty result
      return { rows: [], rowCount: 0 };
    },
    connect: async () => ({
      query: async () => ({ rows: [], rowCount: 0 }),
      release: () => {}
    }),
    end: async () => {}
  };
  
  pool = mockPool as any;
} else if (pgUrl) {
  pool = new Pool({
    connectionString: pgUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

export { pool };