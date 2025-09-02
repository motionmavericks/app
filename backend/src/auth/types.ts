export interface User {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  status: 'pending' | 'active' | 'suspended';
  authzVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: 'Admin' | 'Manager' | 'Editor' | 'Viewer';
  permissions: string[];
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  jti: string;
  refreshTokenHash: string;
  parentJti?: string;
  replacedByJti?: string;
  revokedAt?: Date;
  reuseDetected: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface JWTPayload {
  sub: string;
  email: string;
  roles: string[];
  sid: string;
  jti: string;
  rvn: number;
  iat: number;
  exp: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  displayName: string;
}

export interface RefreshRequest {
  refreshToken?: string;
}