// Lightweight web client for API with keep-alive & admin token injection (no Next proxy)

export type FieldScope = 'registration' | 'login' | 'profile';

export type AdminFieldPayload = {
  key: string;
  label?: string;
  scope: FieldScope; // REQUIRED by server
  type: string; // text | password | email | number | date | textarea | checkbox | select
  required?: boolean;
  unique_field?: boolean;
  validation_regex?: string | null;
  min_length?: number | null;
  max_length?: number | null;
  options?: string[] | null;
  default_value?: string | null;
  write_to?: 'core' | 'attributes';
  visible?: boolean;
  help_text?: string | null;
};

function normalizeBase(input: string) {
  return input.replace(/\/$/, '');
}

function isAbsolute(u: string) {
  return /^https?:\/\//i.test(u);
}

function resolveApiBase(): string {
  const envBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    '';

  if (envBase) {
    return normalizeBase(envBase);
  }

  // Fallback to local API origin (avoids Next dev proxy + deprecation warnings)
  return 'http://localhost:4000';
}

const API_BASE = resolveApiBase();

function buildUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return isAbsolute(API_BASE) ? `${API_BASE}${p}` : `${API_BASE}${p}`; // API_BASE should be absolute by default
}

async function request(path: string, init: RequestInit = {}) {
  const url = buildUrl(path);
  const method = (init.method || 'GET').toString().toUpperCase();

  const headers = new Headers(init.headers || {});
  const hasBody = init.body != null && method !== 'GET' && method !== 'HEAD';
  if (hasBody && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  // Inject admin token automatically if present (and not explicitly provided)
  if (typeof window !== 'undefined') {
    const tok = window.localStorage.getItem('raven_admin_token') || '';
    if (tok && !headers.has('x-admin-token')) headers.set('x-admin-token', tok);
  }

  const fetchInit: RequestInit = { mode: 'cors', credentials: 'include', ...init, method, headers };
  if (method === 'GET' || method === 'HEAD') delete (fetchInit as any).body;

  let res: Response;
  try {
    res = await fetch(url, fetchInit);
  } catch (err: any) {
    throw new Error(err?.message || 'Network error');
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const raw = typeof data === 'string' ? data : (data && (data.error || data.message || data.raw));
    const msg = raw || res.statusText || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ---- Lightweight HTTP helpers (used by admin pages) ----
export function get(path: string, init?: RequestInit) {
  return request(path, { ...(init || {}), method: 'GET' });
}
export function post(path: string, body?: any, init?: RequestInit) {
  const headers = new Headers((init && init.headers) || {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return request(path, { ...(init || {}), method: 'POST', headers, body: body != null ? JSON.stringify(body) : undefined });
}
export function put(path: string, body?: any, init?: RequestInit) {
  const headers = new Headers((init && init.headers) || {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return request(path, { ...(init || {}), method: 'PUT', headers, body: body != null ? JSON.stringify(body) : undefined });
}
export function del(path: string, init?: RequestInit) {
  return request(path, { ...(init || {}), method: 'DELETE' });
}

let keepAliveTimer: any = null;
export function startSessionKeepAlive() {
  if (keepAliveTimer) return;
  // ping every 9 minutes
  keepAliveTimer = setInterval(() => {
    request('/v0/auth/session/keep-alive', { method: 'POST' })
      .then(() => console.debug('[keep-alive] ping OK'))
      .catch((err) => console.warn('[keep-alive] failed', err.message));
  }, 9 * 60 * 1000);
}

export const api = {
  auth: {
    signup(body: any) { return request('/v0/auth/signup', { method: 'POST', body: JSON.stringify(body) }); },
    login(body: any) { return request('/v0/auth/login', { method: 'POST', body: JSON.stringify(body) }); },
    async loginAndStart(body: any) {
      const d = await request('/v0/auth/login', { method: 'POST', body: JSON.stringify(body) });
      try { startSessionKeepAlive(); } catch {}
      return d;
    },
    logout() { return request('/v0/auth/logout', { method: 'POST' }); },
    me() { return request('/v0/auth/me'); },
    resendVerification(email: string) {
      return request('/v0/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
    },
    forgotPassword(email: string) {
      return request('/v0/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email }) });
    },
  },
  form: {
    registration() { return request('/v0/form/registration'); },
    profile() { return request('/v0/form/profile'); },
    login() { return request('/v0/form/login'); },
  },
  profile: {
    get() { return request('/v0/profile'); },
    update(body: any) { return request('/v0/profile', { method: 'PUT', body: JSON.stringify(body) }); },
  },
  admin: {
    listFields(scope?: string) {
      const q = scope ? `?scope=${encodeURIComponent(scope)}` : '';
      return request(`/v0/admin/form-fields${q}`);
    },

    // Create a new form field (admin token auto-injected if present)
    createField(payload: AdminFieldPayload) {
      if (!payload || !payload.scope) throw new Error('scope is required');
      return request(`/v0/admin/form-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },

    // Update an existing form field by id
    updateField(id: string, payload: Partial<AdminFieldPayload>) {
      return request(`/v0/admin/form-fields/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },

    // Delete a form field by id
    deleteField(id: string) {
      return request(`/v0/admin/form-fields/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    // Persist order with explicit indices
    reorder(items: { id: string; order_index: number }[]) {
      return request(`/v0/admin/form-fields/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
    },

    // Duplicate a field definition to other scopes
    duplicateField(id: string, scopes: FieldScope[]) {
      return request(`/v0/admin/form-fields/${encodeURIComponent(id)}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopes }),
      });
    },
  }
  ,
  // top-level HTTP helpers for convenience
  get,
  post,
  put,
  del,
  // alias to avoid reserved-word import issues
  delete: del,
};
export default api;
