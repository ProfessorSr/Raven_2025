import express from 'express';
import cookie from 'cookie';
import * as AuthService from './service.stub';

export const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const user = await AuthService.signup(req.body);
    res.status(201).json({ user });
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
