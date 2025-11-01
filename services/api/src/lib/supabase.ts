import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
const anonKey = process.env.SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl) throw new Error('SUPABASE_URL missing');
if (!serviceKey && !anonKey) throw new Error('Provide SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');

export const supabase = createClient(
  supabaseUrl,
  (serviceKey || anonKey)!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: { 'X-Client-Info': 'raven-api' },
    },
  }
);

export const supa = supabase;
