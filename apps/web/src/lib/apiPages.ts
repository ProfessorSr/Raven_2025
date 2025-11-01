    import { api } from '@/lib/api';
export async function list(adminToken: string) { return api.get('/v0/admin/pages', { headers: { 'x-admin-token': adminToken }, credentials: 'include' }); }
export async function create(body: any, adminToken: string) { return api.post('/v0/admin/pages', body, { headers: { 'x-admin-token': adminToken }, credentials: 'include' }); }
export async function update(id: string, patch: any, adminToken: string) { return api.put(`/v0/admin/pages/${encodeURIComponent(id)}`, patch, { headers: { 'x-admin-token': adminToken }, credentials: 'include' }); }
export async function remove(id: string, adminToken: string) { return api.del(`/v0/admin/pages/${encodeURIComponent(id)}`, { headers: { 'x-admin-token': adminToken }, credentials: 'include' }); }
export async function getPublic(slug: string) { return api.get(`/v0/pages/${encodeURIComponent(slug)}`, { credentials: 'include' }); }
