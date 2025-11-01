import { createClient } from '@supabase/supabase-js';

// Admin-capable Supabase client (service role)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type Scope = 'registration' | 'profile' | 'login';

export type FormFieldBase = {
  id?: string;
  key: string;
  label?: string | null;
  type: string;
  validation_regex?: string | null;
  min_length?: number | null;
  max_length?: number | null;
  options?: any | null;
  write_to: 'core' | 'attributes';
  system?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Placement = {
  field_id: string;
  scope: Scope;
  order_index: number;
  visible: boolean;
  required: boolean;
  help_text: string | null;
};

export type AdminFieldRow = FormFieldBase & {
  // placement-surfaced values for the active scope (if requested)
  order_index?: number | null;
  visible?: boolean;
  required?: boolean;
  help_text?: string | null;
};

function scopesFromInput(scope?: string | null): Scope[] {
  if (!scope) return [];
  if (scope === 'registration' || scope === 'profile' || scope === 'login') return [scope as Scope];
  return [];
}

export async function list(scope?: string): Promise<AdminFieldRow[]> {
  // If a scope is provided, join with placements to surface per-scope settings and ordering
  if (scope === 'registration' || scope === 'profile' || scope === 'login') {
    const { data, error } = await supabase
      .from('form_fields')
      .select(
        `id,key,label,type,write_to,validation_regex,min_length,max_length,options,system,created_at,updated_at,
         form_field_placements!inner(scope,order_index,visible,required,help_text)`
      )
      .eq('form_field_placements.scope', scope)
      .order('order_index', { ascending: true, foreignTable: 'form_field_placements' });

    if (error) throw new Error(error.message);

    const rows = (data || []) as any[];
    return rows.map((r) => {
      const p = r.form_field_placements || {};
      return {
        id: r.id,
        key: r.key,
        label: r.label,
        type: r.type,
        write_to: r.write_to,
        validation_regex: r.validation_regex,
        min_length: r.min_length,
        max_length: r.max_length,
        options: r.options,
        system: r.system,
        created_at: r.created_at,
        updated_at: r.updated_at,
        order_index: typeof p.order_index === 'number' ? p.order_index : 0,
        visible: typeof p.visible === 'boolean' ? p.visible : true,
        required: typeof p.required === 'boolean' ? p.required : false,
        help_text: p.help_text ?? null,
      } as AdminFieldRow;
    });
  }

  // Base list (no scope): returns raw form_fields rows; placements not joined
  const { data, error } = await supabase
    .from('form_fields')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as any[];
}

export async function create(field: Partial<FormFieldBase & { scope?: string; visible?: boolean; required?: boolean; help_text?: string | null; }>) {
  const targetScopes = scopesFromInput(field.scope);
  if (!targetScopes.length) {
    throw new Error("scope is required (registration | login | profile)");
  }

  const key = field.key!;

  // If a base row with this key already exists, reuse it; otherwise insert a new base row.
  let field_id: string | undefined;
  {
    const { data: existing, error: exErr } = await supabase
      .from('form_fields')
      .select('id')
      .eq('key', key)
      .maybeSingle();
    if (exErr && (exErr as any).code !== 'PGRST116') throw new Error(exErr.message);
    if (existing?.id) {
      field_id = existing.id as string;
      // Optionally patch base attributes if provided (non-destructive)
      const basePatch: Partial<FormFieldBase> = {};
      if (typeof field.label !== 'undefined') basePatch.label = field.label ?? null;
      if (typeof field.type !== 'undefined') basePatch.type = field.type as any;
      if (typeof field.write_to !== 'undefined') basePatch.write_to = field.write_to as any;
      if (typeof field.validation_regex !== 'undefined') basePatch.validation_regex = field.validation_regex ?? null;
      if (typeof field.min_length !== 'undefined') basePatch.min_length = field.min_length ?? null;
      if (typeof field.max_length !== 'undefined') basePatch.max_length = field.max_length ?? null;
      if (typeof field.options !== 'undefined') basePatch.options = field.options ?? null;
      if (Object.keys(basePatch).length) {
        const { error: patchErr } = await supabase
          .from('form_fields')
          .update(basePatch)
          .eq('id', field_id);
        if (patchErr) throw new Error(patchErr.message);
      }
    }
  }

  const baseInsert: Partial<FormFieldBase> = {
    key: field.key!,
    label: field.label ?? null,
    type: field.type!,
    write_to: (field.write_to as any) || 'attributes',
    validation_regex: field.validation_regex ?? null,
    min_length: field.min_length ?? null,
    max_length: field.max_length ?? null,
    options: field.options ?? null,
    // NOTE: we no longer write a scope on the base row. All scoping lives in form_field_placements.
  };

  if (!field_id) {
    const { data: inserted, error: insErr } = await supabase
      .from('form_fields')
      .insert(baseInsert)
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);
    field_id = inserted!.id as string;
  }

  // If a scope is provided (registration/profile/login), create placements accordingly.
  for (const s of targetScopes) {
    // Skip if placement already exists for this field + scope
    const { data: existingPlacement, error: selErr } = await supabase
      .from('form_field_placements')
      .select('field_id')
      .eq('field_id', field_id!)
      .eq('scope', s)
      .maybeSingle();
    if (selErr && (selErr as any).code !== 'PGRST116') throw new Error(selErr.message);
    if (existingPlacement) {
      // Optionally update visibility/required/help_text if explicitly provided
      const patch: any = {};
      if (typeof field.visible === 'boolean') patch.visible = field.visible;
      if (typeof field.required === 'boolean') patch.required = field.required;
      if (typeof field.help_text !== 'undefined') patch.help_text = field.help_text ?? null;
      if (Object.keys(patch).length) {
        const { error: upErr } = await supabase
          .from('form_field_placements')
          .update(patch)
          .eq('field_id', field_id!)
          .eq('scope', s);
        if (upErr) throw new Error(upErr.message);
      }
      continue; // placement already existed
    }

    // Compute next order_index for this scope
    const { data: maxRow, error: maxErr } = await supabase
      .from('form_field_placements')
      .select('order_index')
      .eq('scope', s)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr && (maxErr as any).code !== 'PGRST116') throw new Error(maxErr.message);
    const maxVal = maxRow && typeof (maxRow as any).order_index === 'number' ? (maxRow as any).order_index : -1;

    const placement = {
      field_id,
      scope: s,
      order_index: (maxVal + 10),
      visible: field.visible ?? true,
      required: field.required ?? false,
      help_text: field.help_text ?? null,
    } as Omit<Placement, 'created_at' | 'updated_at'>;

    const { error: pErr } = await supabase
      .from('form_field_placements')
      .insert(placement);

    if (pErr) throw new Error(pErr.message);
  }

  return { id: field_id };
}

export async function update(id: string, field: Partial<FormFieldBase & { scope?: string; visible?: boolean; required?: boolean; help_text?: string | null; order_index?: number | null; }>) {
  // Split base vs placement props
  const { scope, visible, required, help_text, order_index, ...basePatch } = field as any;

  // Update base field if there are base props to change
  if (Object.keys(basePatch).length) {
    const { error: uErr } = await supabase
      .from('form_fields')
      .update(basePatch)
      .eq('id', id);
    if (uErr) throw new Error(uErr.message);
  }

  // If scope-specific props were provided, upsert placement for that scope
  if (scope === 'registration' || scope === 'profile' || scope === 'login') {
    const placementPatch: Partial<Placement> = {};
    if (typeof visible === 'boolean') placementPatch.visible = visible;
    if (typeof required === 'boolean') placementPatch.required = required;
    if (typeof help_text !== 'undefined') placementPatch.help_text = help_text as any;
    if (typeof order_index === 'number') placementPatch.order_index = order_index;

    if (Object.keys(placementPatch).length) {
      const { error: pErr } = await supabase
        .from('form_field_placements')
        .upsert({ field_id: id, scope, ...placementPatch }, { onConflict: 'field_id,scope' });
      if (pErr) throw new Error(pErr.message);
    }
  }

  // Return merged view for the provided scope (if any), otherwise base row
  if (scope === 'registration' || scope === 'profile' || scope === 'login') {
    const { data, error } = await supabase
      .from('form_fields')
      .select(
        `id,key,label,type,write_to,validation_regex,min_length,max_length,options,system,created_at,updated_at,
         form_field_placements!inner(scope,order_index,visible,required,help_text)`
      )
      .eq('id', id)
      .eq('form_field_placements.scope', scope)
      .maybeSingle();

    if (error) throw new Error(error.message);
    const r: any = data;
    const p = r?.form_field_placements || {};
    return {
      id: r.id,
      key: r.key,
      label: r.label,
      type: r.type,
      write_to: r.write_to,
      validation_regex: r.validation_regex,
      min_length: r.min_length,
      max_length: r.max_length,
      options: r.options,
      system: r.system,
      created_at: r.created_at,
      updated_at: r.updated_at,
      order_index: typeof p.order_index === 'number' ? p.order_index : 0,
      visible: typeof p.visible === 'boolean' ? p.visible : true,
      required: typeof p.required === 'boolean' ? p.required : false,
      help_text: p.help_text ?? null,
    } as AdminFieldRow;
  }

  const { data: base, error: bErr } = await supabase
    .from('form_fields')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (bErr) throw new Error(bErr.message);
  return base as any;
}

export async function remove(id: string) {
  const { error } = await supabase.from('form_fields').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { ok: true } as const;
}

export async function reorder(ids: string[], scope?: string) {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error('ids must be a non-empty string[]');
  if (scope !== 'registration' && scope !== 'profile' && scope !== 'login') throw new Error('scope is required for reorder');

  // Update placements for the given scope only; never insert new rows here
  for (let idx = 0; idx < ids.length; idx++) {
    const field_id = ids[idx];
    if (!field_id) throw new Error(`invalid id at index ${idx}`);
    const { error } = await supabase
      .from('form_field_placements')
      .update({ order_index: idx })
      .eq('field_id', field_id)
      .eq('scope', scope);
    if (error) throw new Error(error.message);
  }

  return { ok: true } as const;
}

export async function reorderWithIndex(items: { id: string; order_index: number }[], scope: string) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('items must be a non-empty array');
  if (scope !== 'registration' && scope !== 'profile' && scope !== 'login') throw new Error('scope is required for reorder');

  for (const it of items) {
    if (!it?.id || typeof it.order_index !== 'number') throw new Error('items[].id and items[].order_index are required');
    const { error } = await supabase
      .from('form_field_placements')
      .update({ order_index: it.order_index })
      .eq('field_id', it.id)
      .eq('scope', scope);
    if (error) throw new Error(error.message);
  }
  return { ok: true } as const;
}
