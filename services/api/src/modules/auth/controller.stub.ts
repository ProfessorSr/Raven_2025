import express from 'express';
import cookie from 'cookie';
import * as AuthService from '../auth/service.stub';
import { getValidator } from '../forms/validation';
import { upsertProfile } from '../profiles/service';

function ensureJsonBody(req: express.Request) {
  if (typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body); } catch { /* ignore */ }
  }
}

export const router = express.Router();

// Centralized cookie options
function sessionCookie(value: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const isProd = process.env.NODE_ENV === 'production';
  return cookie.serialize('raven_session', value, {
    httpOnly: true,
    path: '/',
    maxAge: maxAgeSeconds,
    sameSite: 'lax',
    secure: isProd, // secure only in prod (HTTPS)
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

    // Create user and session
    const { session, user } = await AuthService.signup({ email, password, acceptTerms: true });

    // Upsert profile using partitioned core/attributes
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
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const session = await AuthService.login({ email, password });
    if (!session?.session?.access_token) return res.status(401).json({ error: 'Invalid login' });

    res.setHeader('Set-Cookie', sessionCookie(session.session.access_token));
    return res.json({ user: session.user });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Login failed' });
  }
});

router.post('/logout', async (_req, res) => {
  try {
    // If you later wire a server-side revoke, call it here.
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Logout failed' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.raven_session;
    if (!token) return res.status(401).json({ error: 'No session' });
    const user = await AuthService.getMe(token);
    return res.json({ user });
  } catch (err: any) {
    return res.status(401).json({ error: err?.message || 'Not authorized' });
  }
});
