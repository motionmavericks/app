export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  status: 'active' | 'disabled' | 'invited';
  token_version: number;
  mfa_enabled: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
}

export interface Session {
  id: string;
  user_id: string;
  refresh_token_hash?: string;
  user_agent?: string;
  ip?: string;
  created_at: Date;
  last_used_at: Date;
  expires_at: Date;
  revoked_at?: Date;
  reason?: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  prefix: string;
  secret_hash: string;
  scopes: string[];
  allowed_ips?: string[];
  last_used_at?: Date;
  expires_at?: Date;
  created_at: Date;
  revoked_at?: Date;
}

export interface JWTPayload {
  sub: string; // user id
  sid: string; // session id
  roles: string[];
  scopes?: string[];
  ver: number; // token version
  iat: number;
  exp: number;
  jti?: string;
}

export interface AuthPrincipal {
  user: User;
  roles: Role[];
  scopes: string[];
  session_id?: string;
  is_api_key: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    principal?: AuthPrincipal;
  }
}
