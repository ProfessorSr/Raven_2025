import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Public-facing scopes supported by the forms API
export type Scope = 'registration' | 'profile' | 'login';

export type FormFieldPublic = {
  id: string;
  key: string;
  label: string | null;
  type: string;
  write_to: 'core' | 'attributes';
  required: boolean;
  visible?: boolean; // always true in public output, but kept for completeness
  help_text: string | null;
  options: string[] | null; // normalized to array of strings when type==='select'
  order_index: number;
  system?: boolean;
  created_at?: string;
  updated_at?: string;
};

function parseOptions(input: any): string[] | null {
  if (input == null) return null;
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === 'string') {
    // try JSON first
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    // fallback: comma-separated string
    return input.split(',').map((s) => s.trim()).filter(Boolean);
  }
  // unknown structure → null to avoid leaking complex shapes
  return null;
}

function normalizeRow(r: any): FormFieldPublic | null {
  if (!r) return null;
  const order_index = typeof r.order_index === 'number' ? r.order_index : 0;
  const label = typeof r.label === 'string' ? r.label : r.key;
  const help_text = r.help_text ?? null;
  const write_to = (r.write_to === 'core' ? 'core' : 'attributes') as 'core' | 'attributes';

  // Normalize options only for select-like fields; otherwise null
  const options = r.type === 'select' ? parseOptions(r.options) : null;

  return {
    id: String(r.id),
    key: String(r.key),
    label,
    type: String(r.type),
    write_to,
    required: !!r.required,
    help_text,
    options,
    order_index,
    system: !!r.system,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export async function getFields(scope: Scope): Promise<FormFieldPublic[]> {
  try {
    // Primary path: placement-driven (registration/profile/login)
    const { data, error } = await supabase
      .from('form_fields')
      .select(
        `id,key,label,type,write_to,validation_regex,min_length,max_length,options,system,created_at,updated_at,
         form_field_placements!inner(scope,order_index,visible,required,help_text)`
      )
      .eq('form_field_placements.scope', scope)
      .eq('form_field_placements.visible', true)
      .order('order_index', { ascending: true, foreignTable: 'form_field_placements' });

    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    const merged = rows.map((r) => {
      const p = (r as any).form_field_placements || {};
      return {
        ...r,
        order_index: typeof p.order_index === 'number' ? p.order_index : r.order_index ?? 0,
        visible: typeof p.visible === 'boolean' ? p.visible : r.visible ?? true,
        required: typeof p.required === 'boolean' ? p.required : r.required ?? false,
        help_text: p.help_text ?? r.help_text ?? null,
      };
    });

    // Final normalization + safety sort
    const normalized = merged
      .map(normalizeRow)
      .filter((x): x is FormFieldPublic => !!x)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    return normalized;
  } catch (e: any) {
    // Fallbacks: placement table missing OR PostgREST join/alias issues
    const msg = String(e?.message || e);
    const missingPlacements = /form_field_placements/i.test(msg) && /(does not exist|missing|relation)/i.test(msg);

    if (!missingPlacements) {
      throw e;
    }

    // Legacy path: visible rows for requested scope or 'both', ordered by base order_index
    const { data, error } = await supabase
      .from('form_fields')
      .select('*')
      .in('scope', [scope as any, 'both'])
      .eq('visible', true)
      .order('order_index', { ascending: true });

    if (error) throw new Error(error.message);

    const legacy = Array.isArray(data) ? data : [];
    return legacy
      .map(normalizeRow)
      .filter((x): x is FormFieldPublic => !!x);
  }
}
