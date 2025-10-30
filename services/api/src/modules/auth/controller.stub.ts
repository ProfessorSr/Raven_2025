import express from 'express';
import cookie from 'cookie';
import * as AuthService from '../auth/service.stub';
import { getValidator } from '../forms/validation';
import { upsertProfile } from '../profiles/service';

export const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    // Separate auth fields from dynamic profile fields
    const { email, password, ...rest } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    // Validate dynamic fields against registration config
    const { validate, partition } = await getValidator('registration');
    const { ok, issues } = validate(rest);
    if (!ok) return res.status(400).json({ error: 'Validation failed', issues });

    // Create user and session
    const { session, user } = await AuthService.signup({ email, password, acceptTerms: true });

    // Partition and upsert profile
    const { core, attributes } = partition(rest);
    await upsertProfile(user.id, core, attributes);

    // Set cookie
    res.setHeader('Set-Cookie', cookie.serialize('raven_session', session.access_token, {
      httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax'
    }));

    res.status(201).json({ userId: user.id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const session = await AuthService.login(req.body);
    if (!session?.session) return res.status(401).json({ error: 'Invalid login' });

    res.setHeader(
      'Set-Cookie',
      cookie.serialize('raven_session', session.session.access_token, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      })
    );
    res.json({ user: session.user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.raven_session;
    if (!token) return res.status(401).json({ error: 'No session' });
    const user = await AuthService.getMe(token);
    res.json({ user });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});
