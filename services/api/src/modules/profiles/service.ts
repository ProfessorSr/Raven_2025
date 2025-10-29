import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function upsertProfile(userId: string, core: Record<string, any>, attrs: Record<string, any>) {
  const patch: any = { id: userId };
  if (typeof core.display_name !== 'undefined') patch.display_name = core.display_name;
  if (typeof core.avatar_url !== 'undefined') patch.avatar_url = core.avatar_url;
  if (typeof core.bio !== 'undefined') patch.bio = core.bio;
  if (attrs && Object.keys(attrs).length) patch.attributes = attrs;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(patch, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
