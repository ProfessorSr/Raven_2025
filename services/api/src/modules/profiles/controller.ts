import express from 'express';
import cookie from 'cookie';
import { upsertProfile } from './service';
import { getValidator } from '../forms/validation';
import { createClient } from '@supabase/supabase-js';

export const router = express.Router();

// Helper to get user from raven_session cookie
async function getUserFromCookie(req: any) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.raven_session;
  if (!token) return null;
  const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data, error } = await anon.auth.getUser(token);
  if (error) return null;
  return data.user;
}

// GET /v0/profile - get own profile (core + attributes)
router.get('/', async (req, res) => {
  try {
    const user = await getUserFromCookie(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const svc = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await svc.from('profiles').select('*').eq('id', user.id).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message); // not found is ok
    res.json({ profile: data || null });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /v0/profile - update own profile using dynamic config (scope=profile)
router.put('/', async (req, res) => {
  try {
    const user = await getUserFromCookie(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { validate, partition } = await getValidator('profile');
    const { ok, issues } = validate(req.body || {});
    if (!ok) return res.status(400).json({ error: 'Validation failed', issues });

    const { core, attributes } = partition(req.body || {});
    const updated = await upsertProfile(user.id, core, attributes);
    res.json({ profile: updated });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
