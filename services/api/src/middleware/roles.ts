import { Request, Response, NextFunction } from 'express';
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role || (req as any).role || null;
    if (role === 'admin') return next();
    if (roles.includes(role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}
export const requireAdminOrEditor = requireRole('editor');
