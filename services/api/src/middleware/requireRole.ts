import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import * as AuthService from '../modules/auth/service.stub';

const supa = createClient(process.env.SUPABASE_URL!, (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)!);

/**
 * RBAC middleware with admin-token override.
 * - If request has header x-admin-token matching ADMIN_API_TOKEN, allow.
 * - Else resolve session -> user -> role from profiles.role (default 'member').
 * - Roles: 'guest' < 'member' < 'editor' < 'admin'.
 */
function makeGuard(required: 'guest' | 'member' | 'editor' | 'admin') {
  return async function requireRoleMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      // 0) Admin token override
      const headerToken = req.header('x-admin-token') || req.header('x-admin-secret');
      const adminToken = process.env.ADMIN_API_TOKEN;
      if (adminToken && headerToken && headerToken === adminToken) {
        res.setHeader('Cache-Control', 'no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return next();
      }

      // 1) Get session token from cookie or headers
      let token = (req as any)?.cookies?.['raven_session'] as string | undefined;
      if (!token && typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.slice(7).trim();
      }
      if (!token) {
        const xTok = req.headers['x-session-token'];
        if (typeof xTok === 'string' && xTok) token = xTok.trim();
      }
      if (!token && required !== 'guest') return res.status(401).json({ error: 'No session' });

      // 2) Resolve current user
      let userId: string | undefined = undefined;
      let email: string | undefined = undefined;
      if (token) {
        const me = await AuthService.getMe(token);
        userId = me?.user?.id as string | undefined;
        email = me?.user?.email as string | undefined;
        if (!userId && required !== 'guest') return res.status(401).json({ error: 'No user context' });
      }

      // 3) Load role from profiles (defaults to 'member' if unknown user)
      let userRole: 'guest' | 'member' | 'editor' | 'admin' = 'guest';
      if (userId) {
        const { data, error } = await supa
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        if (error) return res.status(400).json({ error: error.message });
        userRole = ((data?.role as string) || 'member') as any;
      }

      // 4) Admin email fallback (dev@example.com is always admin)
      const isAdminEmail = email === 'dev@example.com';

      // 5) Role comparison ladder
      const rank = { guest: 0, member: 1, editor: 2, admin: 3 } as const;
      const effectiveRole = isAdminEmail ? 'admin' : userRole;
      const ok = rank[effectiveRole] >= rank[required];

      if (!ok) return res.status(403).json({ error: 'Forbidden' });

      // 6) No-store for RBAC responses
      res.setHeader('Cache-Control', 'no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      return next();
    } catch (e: any) {
      return res.status(400).json({ error: e?.message || 'RBAC error' });
    }
  };
}

export function requireRole(role: 'guest' | 'member' | 'editor' | 'admin') {
  return makeGuard(role);
}

// Named helper used across routers
export const requireAdmin = makeGuard('admin');
export const requireAdminOrEditor = makeGuard('editor');

// Default export (factory) for convenience
export default makeGuard;
