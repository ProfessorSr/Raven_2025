import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

const admin = createClient(supabaseUrl, serviceKey);
const anon = createClient(supabaseUrl, anonKey);

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  acceptTerms: z.boolean().optional().default(true),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function signup(data: unknown) {
  const body = signupSchema.parse(data);
  const { data: created, error } = await admin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: false,
  });
  if (error) throw new Error(error.message);
  if (!created.user) throw new Error('User creation failed');

  // Sign in to create a session for cookie
  const { data: sessionData, error: signInErr } = await anon.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });
  if (signInErr) throw new Error(signInErr.message);
  if (!sessionData.session || !sessionData.user) throw new Error('Failed to establish session');

  return { session: sessionData.session, user: sessionData.user };
}

export async function login(data: unknown) {
  const body = loginSchema.parse(data);
  const { data: session, error } = await anon.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });
  if (error) throw new Error(error.message);
  return session;
}

export async function getMe(token: string) {
  const { data, error } = await anon.auth.getUser(token);
  if (error) throw new Error(error.message);
  return data.user;
}
