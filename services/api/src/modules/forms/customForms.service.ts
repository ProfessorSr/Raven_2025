import { randomUUID } from "crypto";
import { supabase } from "../../lib/supabase";

export type UUID = string;

export type FormRow = {
  id: UUID;
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export async function listForms(): Promise<FormRow[]> {
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as any;
}

export async function createForm(input: {
  slug: string;
  title: string;
  description?: string | null;
  is_active?: boolean;
}): Promise<FormRow> {
  const body = {
    slug: input.slug,
    title: input.title,
    description: input.description ?? null,
    is_active: input.is_active !== false,
  };
  const { data, error } = await supabase
    .from("forms")
    .insert([body])
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as any;
}

export async function getFormById(id: UUID): Promise<FormRow | null> {
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as any) || null;
}

export async function getFormBySlug(
  slug: string
): Promise<{ form: FormRow; fields: any[] } | null> {
  const { data: form, error: fe } = await supabase
    .from("forms")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (fe) throw new Error(fe.message);
  if (!form) return null;

  const { data: placements, error: pe } = await supabase
    .from("form_field_placements")
    .select("id, order_index, required, visible, help_text, field:form_fields(*)")
    .eq("form_id", (form as any).id)
    .order("order_index", { ascending: true });
  if (pe) throw new Error(pe.message);

  const fields = (placements || []).map((p: any) => ({
    _placement_id: p.id,
    id: p.field?.id,
    key: p.field?.key,
    label: p.field?.label ?? p.field?.key,
    type: p.field?.type,
    required: !!p.required,
    unique_field: false,
    validation_regex: p.field?.validation_regex,
    min_length: p.field?.min_length,
    max_length: p.field?.max_length,
    options: p.field?.options,
    default_value: null,
    order_index: p.order_index,
    system: false,
    write_to: p.field?.write_to ?? "attributes",
    visible: !!p.visible,
    help_text: p.help_text,
  }));

  return { form: form as any, fields };
}

export async function updateForm(
  id: UUID,
  patch: Partial<FormRow>
): Promise<FormRow> {
  const clean: any = {};
  if (typeof patch.slug !== "undefined") clean.slug = patch.slug;
  if (typeof patch.title !== "undefined") clean.title = patch.title;
  if (typeof patch.description !== "undefined") clean.description = patch.description;
  if (typeof patch.is_active !== "undefined") clean.is_active = !!patch.is_active;

  const { data, error } = await supabase
    .from("forms")
    .update(clean)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as any;
}

export async function deleteForm(id: UUID): Promise<void> {
  const { error } = await supabase.from("forms").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* placements */
type FieldRow = {
  id: UUID;
  key: string;
  label: string | null;
  type: string;
  write_to: "core" | "attributes" | null;
  validation_regex: string | null;
  min_length: number | null;
  max_length: number | null;
  options: string[] | null;
};

async function ensureField({
  field_id,
  key,
  base,
}: {
  field_id?: UUID;
  key?: string;
  base?: Partial<FieldRow>;
}): Promise<UUID> {
  if (field_id) return field_id;
  if (!key) throw new Error("field_id or key is required");

  const { data: existed, error: exErr } = await supabase
    .from("form_fields")
    .select("id")
    .eq("key", key)
    .maybeSingle();
  if (exErr) throw new Error(exErr.message);
  if (existed?.id) return existed.id as UUID;

  const def: Partial<FieldRow> = {
    key,
    label: base?.label ?? key,
    type: base?.type || "text",
    write_to: (base?.write_to as any) || "attributes",
    validation_regex: base?.validation_regex ?? null,
    min_length: base?.min_length ?? null,
    max_length: base?.max_length ?? null,
    options: base?.options ?? null,
  } as any;

  const { data: created, error: crErr } = await supabase
    .from("form_fields")
    .insert(def as any)
    .select("id")
    .single();
  if (crErr) throw new Error(crErr.message);
  return created!.id as UUID;
}

async function nextOrderIndex(form_id: UUID): Promise<number> {
  const { data, error } = await supabase
    .from("form_field_placements")
    .select("order_index")
    .eq("form_id", form_id)
    .order("order_index", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const rows = (data || []) as any[];
  const max = rows[0]?.order_index ?? -10;
  return max + 10;
}

export async function addOrUpdatePlacement(input: {
  form_id: UUID;
  field_id?: UUID;
  key?: string;
  required?: boolean;
  visible?: boolean;
  help_text?: string | null;
  order_index?: number;
  base?: Partial<FieldRow>;
}) {
  const form_id = input.form_id;
  const fid = await ensureField({
    field_id: input.field_id,
    key: input.key,
    base: input.base,
  });

  const { data: existing, error: exErr } = await supabase
    .from("form_field_placements")
    .select("id")
    .eq("form_id", form_id)
    .eq("field_id", fid)
    .maybeSingle();
  if (exErr) throw new Error(exErr.message);

  if (existing?.id) {
    const patch: any = {};
    if (typeof input.required === "boolean") patch.required = input.required;
    if (typeof input.visible === "boolean") patch.visible = input.visible;
    if (typeof input.help_text !== "undefined") patch.help_text = input.help_text;
    if (typeof input.order_index === "number") patch.order_index = input.order_index;

    const { data, error } = await supabase
      .from("form_field_placements")
      .update(patch)
      .eq("id", existing.id as UUID)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const order_index =
    typeof input.order_index === "number"
      ? input.order_index
      : await nextOrderIndex(form_id);

  const payload = {
    id: randomUUID(),
    form_id,
    field_id: fid,
    order_index,
    required: !!input.required,
    visible: input.visible !== false,
    help_text: input.help_text ?? null,
    scope: null as any, // IMPORTANT: custom forms must not set a built-in scope
  };

  const { data, error } = await supabase
    .from("form_field_placements")
    .insert([payload])
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function reorderForm(
  form_id: UUID,
  items: { id: UUID; order_index: number }[]
) {
  for (const it of items) {
    const { error } = await supabase
      .from("form_field_placements")
      .update({ order_index: it.order_index })
      .eq("id", it.id)
      .eq("form_id", form_id);
    if (error) throw new Error(error.message);
  }
  return { ok: true } as const;
}

export async function updatePlacement(
  form_id: UUID,
  placement_id: UUID,
  input: {
    required?: boolean;
    visible?: boolean;
    help_text?: string | null;
    order_index?: number;
    base?: Partial<FieldRow>;
  }
) {
  const patch: any = {};
  if (typeof input.required === "boolean") patch.required = input.required;
  if (typeof input.visible === "boolean") patch.visible = input.visible;
  if (typeof input.help_text !== "undefined") patch.help_text = input.help_text;
  if (typeof input.order_index === "number") patch.order_index = input.order_index;

  const { data: placement, error: pe } = await supabase
    .from("form_field_placements")
    .update(patch)
    .eq("id", placement_id)
    .eq("form_id", form_id)
    .select("*")
    .maybeSingle();
  if (pe) throw new Error(pe.message);
  if (!placement) throw new Error("Placement not found");

  if (input.base) {
    const fieldPatch: any = {};
    if (typeof input.base.label !== "undefined") fieldPatch.label = input.base.label;
    if (typeof input.base.type !== "undefined") fieldPatch.type = input.base.type;
    if (typeof input.base.write_to !== "undefined") fieldPatch.write_to = input.base.write_to as any;
    if (typeof input.base.validation_regex !== "undefined") fieldPatch.validation_regex = input.base.validation_regex;
    if (typeof input.base.min_length !== "undefined") fieldPatch.min_length = input.base.min_length;
    if (typeof input.base.max_length !== "undefined") fieldPatch.max_length = input.base.max_length;
    if (typeof input.base.options !== "undefined") fieldPatch.options = input.base.options as any;

    if (Object.keys(fieldPatch).length > 0) {
      const { error: fe } = await supabase
        .from("form_fields")
        .update(fieldPatch)
        .eq("id", (placement as any).field_id);
      if (fe) throw new Error(fe.message);
    }
  }
  return placement;
}

export async function deletePlacement(form_id: UUID, placement_id: UUID) {
  const { error } = await supabase
    .from("form_field_placements")
    .delete()
    .eq("id", placement_id)
    .eq("form_id", form_id);
  if (error) throw new Error(error.message);
}

export async function submit(
  slug: string,
  values: Record<string, any>,
  opts: { userId?: UUID | null } = {}
) {
  const userId = opts.userId || null;
  const { data: form, error: fe } = await supabase
    .from("forms")
    .select("id, is_active")
    .eq("slug", slug)
    .maybeSingle();
  if (fe) throw new Error(fe.message);
  if (!form) throw new Error("Form not found");
  if ((form as any).is_active === false) throw new Error("Form is inactive");

  // Authenticated users -> merge into profiles.attributes
  if (userId) {
    const { data: prof, error: pe } = await supabase
      .from("profiles")
      .select("id, attributes")
      .eq("id", userId)
      .maybeSingle();
    if (pe) throw new Error(pe.message);
    const nextAttrs: Record<string, any> = { ...(prof?.attributes || {}) };
    for (const [k, v] of Object.entries(values || {})) nextAttrs[k] = v;
    const { error: ue } = await supabase
      .from("profiles")
      .update({ attributes: nextAttrs })
      .eq("id", userId);
    if (ue) throw new Error(ue.message);
    return { ok: true } as const;
  }

  // Anonymous -> optional form_submissions capture (if table exists)
  try {
    const { error } = await supabase
      .from("form_submissions")
      .insert([{ form_id: (form as any).id, user_id: null, payload: values }]);
    if (error) throw error;
  } catch {}
  return { ok: true } as const;
}
