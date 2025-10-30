export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';

async function request(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || res.statusText || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

export const api = {
  form: {
    registration: () => request('/v0/form/registration'),
    profile: () => request('/v0/form/profile'),
  },
  auth: {
    signup: (body: any) => request('/v0/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: any) => request('/v0/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/v0/auth/me'),
  },
  profile: {
    get: () => request('/v0/profile'),
    update: (body: any) => request('/v0/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },
  admin: {
    listFields: (scope?: string) => request(`/v0/admin/form-fields${scope ? `?scope=${encodeURIComponent(scope)}` : ''}`),
    createField: (field: any, token: string) =>
      request('/v0/admin/form-fields', { method: 'POST', body: JSON.stringify(field), headers: { 'x-admin-token': token } }),
    updateField: (id: string, field: any, token: string) =>
      request(`/v0/admin/form-fields/${id}`, { method: 'PUT', body: JSON.stringify(field), headers: { 'x-admin-token': token } }),
    deleteField: (id: string, token: string) =>
      request(`/v0/admin/form-fields/${id}`, { method: 'DELETE', headers: { 'x-admin-token': token } }),
  },
};

export default api;
