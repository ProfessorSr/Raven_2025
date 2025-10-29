import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  const { data: user, error } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  });
  if (error) throw new Error(error.message);
  return user;
}

export async function login(data: unknown) {
  const body = loginSchema.parse(data);
  const { data: session, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });
  if (error) throw new Error(error.message);
  return session;
}

export async function getMe(token: string) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error) throw new Error(error.message);
  return data.user;
}
