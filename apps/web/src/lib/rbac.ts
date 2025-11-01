export type Role = 'admin' | 'editor' | 'member' | 'guest' | 'authenticated';
export function hasRole(userRole: string | null | undefined, ...allowed: Role[]) {
  if (!userRole) return false;
  if (allowed.includes('guest')) return true;
  if (userRole === 'admin') return true;
  return allowed.includes(userRole as Role);
}
