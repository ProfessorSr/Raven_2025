import express from 'express';
import cookie from 'cookie';
import { createClient } from '@supabase/supabase-js';
import * as AuthService from '../auth/service.stub';
import { getValidator } from '../forms/validation';
import { upsertProfile } from '../profiles/service';

export const router = express.Router();

// Admin supabase client (service role)
const supaAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Centralized cookie options
function sessionCookie(value: string, remember = false) {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30d vs 7d
  return cookie.serialize('raven_session', value, {
    httpOnly: true,
    path: '/',
    maxAge,
    sameSite: 'lax',
    secure: isProd,
  });
}

function clearSessionCookie() {
  const isProd = process.env.NODE_ENV === 'production';
  return cookie.serialize('raven_session', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0),
    sameSite: 'lax',
    secure: isProd,
  });
}

function ensureJsonBody(req: express.Request) {
  if (typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body); } catch {}
  }
}

router.post('/signup', async (req, res) => {
  try {
    ensureJsonBody(req);
    const body = (req.body || {}) as Record<string, any>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // Separate dynamic fields from auth fields
    const { email: _e, password: _p, ...rest } = body;

    // Validate dynamic fields against registration config
    const { validate, partition } = await getValidator('registration');
    const { ok, issues } = validate(rest);
    if (!ok) {
      return res.status(400).json({ error: 'Validation failed', issues });
    }

    const { session, user } = await AuthService.signup({ email, password, acceptTerms: true });

    const { core, attributes } = partition(rest);
    await upsertProfile(user.id, core, attributes);

    // Issue session cookie
    res.setHeader('Set-Cookie', sessionCookie(session.access_token));
    return res.status(201).json({ userId: user.id });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Sign up failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    ensureJsonBody(req);
    const body = (req.body || {}) as Record<string, any>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const remember = body.remember === true || body.remember === 'true' || body.remember === 1 || body.remember === '1';

    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const session = await AuthService.login({ email, password });
    if (!session?.session?.access_token) return res.status(401).json({ error: 'Invalid login' });

    res.setHeader('Set-Cookie', sessionCookie(session.session.access_token, remember));
    return res.json({ user: session.user });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Login failed' });
  }
});

router.post('/logout', async (_req, res) => {
  try {
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Logout failed' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    let token = cookies.raven_session;

    // Also accept Authorization: Bearer <token>
    const authz = req.headers.authorization || '';
    if (!token && typeof authz === 'string' && authz.startsWith('Bearer ')) {
      token = authz.slice(7).trim();
    }

    // And x-session-token header for non-browser clients
    const xTok = req.headers['x-session-token'];
    if (!token && typeof xTok === 'string' && xTok) {
      token = xTok.trim();
    }

    if (!token) return res.status(401).json({ error: 'No session' });

    // Resolve Supabase user via our AuthService
    const me = await AuthService.getMe(token);
    const user = (me && (me as any).user) ? (me as any).user : me; // tolerate either shape
    const userId = user?.id;
    if (!userId) return res.status(401).json({ error: 'No user context' });

    // Fetch app profile (role lives here)
    const { data: profile, error } = await supaAdmin
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', userId)
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });

    // Prevent intermediaries/browsers from caching /me
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.json({ user, profile });
  } catch (err: any) {
    return res.status(401).json({ error: err?.message || 'Not authorized' });
  }
});

// Keep-alive / refresh hook (no-op for now; useful for cookie keepalive)
router.post('/session/keep-alive', async (_req, res) => {
  try {
    return res.json({ ok: true, at: Date.now() });
  } catch (err: any) {
    return res.status(400).json({ error: 'keep-alive failed' });
  }
});

// Email: resend verification
router.post('/resend-verification', async (req, res) => {
  try {
    ensureJsonBody(req);
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email) return res.status(400).json({ error: 'email is required' });

    const { data, error } = await supaAdmin.auth.resend({
      type: 'signup',
      email,
      options: { redirectTo: process.env.WEB_BASE_URL || 'http://localhost:3000' }
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, data });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Resend failed' });
  }
});

// Password: request reset (sends email)
router.post('/password/forgot', async (req, res) => {
  try {
    ensureJsonBody(req);
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email) return res.status(400).json({ error: 'email is required' });

    const redirectTo = (process.env.WEB_BASE_URL || 'http://localhost:3000') + '/reset-password';
    const { data, error } = await supaAdmin.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, data });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Request failed' });
  }
});

export default router;
