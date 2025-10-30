import { createClient } from '@supabase/supabase-js';

// Create a service-role Supabase client for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type FormField = {
  id?: string;
  key: string;
  label?: string | null;
  scope: 'registration' | 'profile' | 'both';
  type: string;
  required?: boolean;
  validation_regex?: string | null;
  min_length?: number | null;
  max_length?: number | null;
  options?: any | null;
  write_to: 'core' | 'attributes';
  visible?: boolean;
  order_index?: number | null;
  help_text?: string | null;
};

export async function list(scope?: string) {
  let q = supabase
    .from('form_fields')
    .select('*')
    .order('order_index', { ascending: true });

  if (scope) q = q.eq('scope', scope);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as FormField[];
}

export async function create(field: Partial<FormField>) {
  // If order_index is not provided, assign next = (max + 1)
  let order_index: number | null | undefined = field.order_index;
  if (order_index === undefined || order_index === null || Number.isNaN(order_index as any)) {
    const { data: maxRow, error: maxErr } = await supabase
      .from('form_fields')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr && maxErr.code !== 'PGRST116') { // ignore "Results contain 0 rows" style cases
      throw new Error(maxErr.message);
    }

    const maxVal = (maxRow && typeof maxRow.order_index === 'number') ? maxRow.order_index : -1;
    order_index = maxVal + 1;
  }

  const toInsert = { ...field, order_index };

  const { data, error } = await supabase
    .from('form_fields')
    .insert(toInsert)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as FormField;
}

export async function update(id: string, field: Partial<FormField>) {
  const { data, error } = await supabase
    .from('form_fields')
    .update(field)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as FormField;
}

export async function remove(id: string) {
  const { error } = await supabase
    .from('form_fields')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { ok: true } as const;
}
