import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from './jwt.js';
import type { JWTPayload } from './types.js';
import { pool } from '../db.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

export async function authenticateJWT(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid authorization header' });
    }
    
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    // Check if user's authz version matches
    const result = await pool.query(
      'SELECT authz_version FROM users WHERE id = $1',
      [payload.sub]
    );
    
    if (result.rows.length === 0) {
      return reply.status(401).send({ error: 'User not found' });
    }
    
    if (result.rows[0].authz_version !== payload.rvn) {
      return reply.status(401).send({ error: 'Token outdated, please refresh' });
    }
    
    request.user = payload;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const hasRole = request.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return reply.status(403).send({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: request.user.roles
      });
    }
  };
}

export function requirePermission(...requiredPerms: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    // Admin has all permissions
    if (request.user.roles.includes('Admin')) {
      return;
    }
    
    // Get permissions for user's roles
    const roleList = request.user.roles.map(r => `'${r}'`).join(',');
    const result = await pool.query(
      `SELECT DISTINCT p.name 
       FROM roles r
       JOIN role_permissions rp ON r.id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE r.name IN (${roleList})`
    );
    
    const userPerms = result.rows.map(row => row.name);
    const hasAllPerms = requiredPerms.every(perm => userPerms.includes(perm));
    
    if (!hasAllPerms) {
      return reply.status(403).send({
        error: 'Insufficient permissions',
        required: requiredPerms,
        current: userPerms
      });
    }
  };
}