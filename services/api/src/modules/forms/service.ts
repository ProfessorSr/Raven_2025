import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

type Scope = 'registration' | 'profile' | 'both';

export async function getFields(scope: Scope) {
  const { data, error } = await supabase
    .from('form_fields')
    .select('*')
    .in('scope', [scope, 'both'])
    .eq('visible', true)
    .order('order_index', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}
