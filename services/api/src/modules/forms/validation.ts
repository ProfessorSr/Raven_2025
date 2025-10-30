import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type Field = {
  key: string;
  scope: 'registration' | 'profile' | 'both';
  label: string;
  type: string;
  required: boolean;
  validation_regex: string | null;
  min_length: number | null;
  max_length: number | null;
  options: any | null;
  write_to: 'core' | 'attributes';
  visible: boolean;
  order_index: number;
};

/**
 * Fetch fields for a scope and build a validator.
 * Returns { fields, validate(payload), partition(payload) }
 */
export async function getValidator(scope: 'registration' | 'profile') {
  const { data, error } = await supabase
    .from('form_fields')
    .select('*')
    .in('scope', [scope, 'both'])
    .eq('visible', true)
    .order('order_index', { ascending: true });

  if (error) throw new Error(error.message);
  const fields = (data || []) as Field[];

  function validate(payload: Record<string, any>) {
    const issues: string[] = [];

    for (const f of fields) {
      const val = payload[f.key];

      if (f.required && (val === undefined || val === null || val === '')) {
        issues.push(`${f.label || f.key} is required`);
        continue;
      }
      if (val === undefined || val === null) continue;

      if (f.type === 'email') {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof val !== 'string' || !re.test(val)) issues.push(`${f.label || f.key} must be a valid email`);
      } else if (f.type === 'number') {
        if (Number.isNaN(Number(val))) issues.push(`${f.label || f.key} must be a number`);
      } else if (f.type === 'select' && f.options && Array.isArray(f.options)) {
        if (!f.options.includes(val)) issues.push(`${f.label || f.key} must be one of: ${f.options.join(', ')}`);
      } else if (f.type === 'checkbox') {
        if (typeof val !== 'boolean') issues.push(`${f.label || f.key} must be true/false`);
      } else {
        if (typeof val !== 'string' && typeof val !== 'number') {
          issues.push(`${f.label || f.key} has invalid type`);
        }
      }

      if (f.min_length && typeof val === 'string' && val.length < f.min_length) {
        issues.push(`${f.label || f.key} must be at least ${f.min_length} characters`);
      }
      if (f.max_length && typeof val === 'string' && val.length > f.max_length) {
        issues.push(`${f.label || f.key} must be at most ${f.max_length} characters`);
      }
      if (f.validation_regex) {
        try {
          const re = new RegExp(f.validation_regex);
          if (!re.test(String(val))) issues.push(`${f.label || f.key} is invalid`);
        } catch { /* ignore bad regex in config */ }
      }
    }

    return { ok: issues.length === 0, issues };
  }

  function partition(payload: Record<string, any>) {
    const core: Record<string, any> = {};
    const attributes: Record<string, any> = {};
    for (const f of fields) {
      const v = payload[f.key];
      if (v === undefined) continue;
      if (f.write_to === 'core') core[f.key] = v;
      else attributes[f.key] = v;
    }
    return { core, attributes };
  }

  return { fields, validate, partition };
}
