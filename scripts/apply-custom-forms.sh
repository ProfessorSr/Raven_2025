#!/usr/bin/env bash
set -euo pipefail

root="$(pwd)"

echo "==> Creating directories..."
mkdir -p "$root/sql"
mkdir -p "$root/services/api/src/modules/forms"
mkdir -p "$root/apps/web/src/lib"
mkdir -p "$root/apps/web/src/pages/admin/forms"
mkdir -p "$root/scripts"

write() {
  local path="$1"
  shift
  echo "==> Writing $path"
  cat > "$path" <<'EOF'
'"$@"'
EOF
}

# --- SQL: migration ---
write "$root/sql/2025-10-31_custom_forms.sql" \
'-- Raven Custom Forms migration
BEGIN;

-- 1) Custom forms registry
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Allow field placements to target either a built-in scope OR a custom form
alter table public.form_field_placements
  add column if not exists form_id uuid references public.forms(id) on delete cascade;

-- One target only: scope XOR form_id
alter table public.form_field_placements
  drop constraint if exists ffp_one_target_chk;

alter table public.form_field_placements
  add constraint ffp_one_target_chk
  check (
    (scope is not null and form_id is null)
    or (scope is null and form_id is not null)
  );

-- Uniqueness guards
create unique index if not exists ffp_unique_field_scope
  on public.form_field_placements(field_id, scope)
  where scope is not null;

create unique index if not exists ffp_unique_field_form
  on public.form_field_placements(field_id, form_id)
  where form_id is not null;

-- Ordering helper
create index if not exists idx_ffp_form_order
  on public.form_field_placements(form_id, order_index);

COMMIT;
'

# --- API: controller ---
write "$root/services/api/src/modules/forms/customForms.controller.ts" \
// Mounted at /v0
'import { Router, Request, Response } from "express";
import * as Svc from "./customForms.service";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

// Public: fetch a custom form by slug
router.get("/form/:slug", async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug || "").trim();
    if (!slug) return res.status(400).json({ error: "slug is required" });
    const data = await Svc.getFormBySlug(slug);
    if (!data) return res.status(404).json({ error: "Form not found" });
    return res.json(data);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to load form" });
  }
});

// Public: submit a custom form
router.post("/form/:slug/submit", async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug || "").trim();
    if (!slug) return res.status(400).json({ error: "slug is required" });
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const userId = (req as any).user?.id || null;
    const result = await Svc.submit(slug, payload, { userId });
    return res.json(result || { ok: true });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Submission failed" });
  }
});

// Admin: list forms
router.get("/admin/forms", requireAdmin, async (_req, res) => {
  try {
    const list = await Svc.listForms();
    return res.json({ forms: list });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to list forms" });
  }
});

// Admin: create form
router.post("/admin/forms", requireAdmin, async (req, res) => {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { slug, title, description, is_active } = body;
    if (!slug || !title) return res.status(400).json({ error: "slug and title are required" });
    const form = await Svc.createForm({
      slug,
      title,
      description: description ?? null,
      is_active: is_active !== false
    });
    return res.json(form);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to create form" });
  }
});

// Admin: get one
router.get("/admin/forms/:id", requireAdmin, async (req, res) => {
  try {
    const form = await Svc.getFormById(String(req.params.id));
    if (!form) return res.status(404).json({ error: "Form not found" });
    return res.json(form);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to load form" });
  }
});

// Admin: update
router.put("/admin/forms/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const patch: any = {};
    if (typeof body.slug !== "undefined") patch.slug = body.slug;
    if (typeof body.title !== "undefined") patch.title = body.title;
    if (typeof body.description !== "undefined") patch.description = body.description;
    if (typeof body.is_active !== "undefined") patch.is_active = !!body.is_active;
    const out = await Svc.updateForm(id, patch);
    return res.json(out);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to update form" });
  }
});

// Admin: delete
router.delete("/admin/forms/:id", requireAdmin, async (req, res) => {
  try {
    await Svc.deleteForm(String(req.params.id));
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to delete form" });
  }
});

// Admin: add/update placement
router.post("/admin/forms/:id/fields", requireAdmin, async (req, res) => {
  try {
    const formId = String(req.params.id);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const out = await Svc.addOrUpdatePlacement({
      form_id: formId,
      field_id: body.field_id,
      key: body.key,
      required: body.required,
      visible: body.visible,
      help_text: body.help_text,
      order_index: body.order_index,
      base: {
        label: body.label,
        type: body.type,
        write_to: body.write_to,
        validation_regex: body.validation_regex,
        min_length: body.min_length,
        max_length: body.max_length,
        options: body.options
      }
    });
    return res.json(out);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to add field" });
  }
});

// Admin: reorder
router.post("/admin/forms/:id/reorder", requireAdmin, async (req, res) => {
  try {
    const formId = String(req.params.id);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return res.status(400).json({ error: "items[] is required" });
    await Svc.reorderForm(
      formId,
      items.map((it: any) => ({ id: String(it.id), order_index: Number(it.order_index) }))
    );
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to reorder" });
  }
});

export default router;
'

# --- API: service ---
write "$root/services/api/src/modules/forms/customForms.service.ts" \
'import { supabase } from "../../lib/supabase";

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
    form_id,
    field_id: fid,
    order_index,
    required: !!input.required,
    visible: input.visible !== false,
    help_text: input.help_text ?? null,
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

  try {
    const { error } = await supabase
      .from("form_submissions")
      .insert([{ form_id: (form as any).id, user_id: null, payload: values }]);
    if (error) throw error;
  } catch {}
  return { ok: true } as const;
}
'

# --- Web: small API client ---
write "$root/apps/web/src/lib/apiForms.ts" \
'export async function listForms(adminToken: string) {
  const res = await fetch("/__api/v0/admin/forms", {
    headers: { "x-admin-token": adminToken, "Accept": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ forms: Array<{id:string;slug:string;title:string;is_active:boolean}> }>;
}

export async function createForm(body: { slug: string; title: string; description?: string }, adminToken: string) {
  const res = await fetch("/__api/v0/admin/forms", {
    method: "POST",
    headers: { "x-admin-token": adminToken, "Content-Type": "application/json", "Accept": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getFormBySlug(slug: string) {
  const res = await fetch(`/__api/v0/form/${encodeURIComponent(slug)}`, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ form: any; fields: any[] }>;
}

export async function addFieldToForm(formId: string, payload: any, adminToken: string) {
  const res = await fetch(`/__api/v0/admin/forms/${encodeURIComponent(formId)}/fields`, {
    method: "POST",
    headers: { "x-admin-token": adminToken, "Content-Type": "application/json", "Accept": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function reorderForm(formId: string, items: { id: string; order_index: number }[], adminToken: string) {
  const res = await fetch(`/__api/v0/admin/forms/${encodeURIComponent(formId)}/reorder`, {
    method: "POST",
    headers: { "x-admin-token": adminToken, "Content-Type": "application/json", "Accept": "application/json" },
    credentials: "include",
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
'

# --- Web: /admin/forms (list/create) ---
write "$root/apps/web/src/pages/admin/forms/index.tsx" \
'import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import SectionLayout from "@/components/admin/SectionLayout";
import * as formsApi from "@/lib/apiForms";

export default function FormsLibraryPage() {
  const [adminToken, setAdminToken] = React.useState("");
  const [list, setList] = React.useState<any[]>([]);
  const [err, setErr] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [slug, setSlug] = React.useState("contact");
  const [title, setTitle] = React.useState("Contact Us");
  const [description, setDescription] = React.useState("");

  const load = React.useCallback(async () => {
    setErr("");
    try {
      const tok = localStorage.getItem("raven_admin_token") || "";
      setAdminToken(tok);
      const out = await formsApi.listForms(tok);
      setList(out.forms || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load forms");
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await formsApi.createForm({ slug, title, description }, adminToken);
      setCreating(false);
      setSlug(""); setTitle(""); setDescription("");
      await load();
    } catch (e: any) { setErr(e?.message || "Create failed"); }
  };

  return (
    <AdminLayout>
      <SectionLayout title="Forms Library" sidebar={null}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Custom Forms</h2>
          <button onClick={() => setCreating((s) => !s)} style={{ padding: "6px 10px" }}>{creating ? "Close" : "New Form"}</button>
        </div>

        {creating && (
          <form onSubmit={onCreate} style={{ margin: "8px 0", display: "grid", gap: 8, maxWidth: 520 }}>
            <label>Slug<br/><input value={slug} onChange={(e)=>setSlug(e.target.value)} placeholder="contact" required /></label>
            <label>Title<br/><input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Contact Us" required /></label>
            <label>Description<br/><input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Optional"/></label>
            <div><button type="submit">Create</button></div>
          </form>
        )}
        {err && <p style={{ color: "crimson" }}>{err}</p>}

        <ul>
          {list.map((f: any) => (
            <li key={f.id}>
              <a href={`/admin/forms/${encodeURIComponent(f.slug)}`}>{f.title} <small style={{ opacity: .6 }}>({f.slug})</small></a>
            </li>
          ))}
        </ul>
      </SectionLayout>
    </AdminLayout>
  );
}
'

# --- Web: /admin/forms/[slug] (manage fields) ---
write "$root/apps/web/src/pages/admin/forms/[slug].tsx" \
'import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import SectionLayout from "@/components/admin/SectionLayout";
import * as formsApi from "@/lib/apiForms";

type Field = { id?: string; key: string; label?: string; type?: string; required?: boolean; visible?: boolean; help_text?: string | null; order_index?: number; };

export default function AdminFormDetailPage() {
  const [adminToken, setAdminToken] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [form, setForm] = React.useState<any>(null);
  const [fields, setFields] = React.useState<Field[]>([]);
  const [err, setErr] = React.useState("");
  const [draft, setDraft] = React.useState<Field>({ key: "", label: "", type: "text", required: false, visible: true, help_text: "" });

  React.useEffect(() => {
    const tok = localStorage.getItem("raven_admin_token") || "";
    setAdminToken(tok);
    const parts = window.location.pathname.split("/");
    const s = parts[parts.length - 1];
    setSlug(s);
  }, []);

  const load = React.useCallback(async () => {
    if (!slug) return;
    try {
      const data = await formsApi.getFormBySlug(slug);
      setForm(data.form);
      setFields(data.fields || []);
    } catch (e: any) { setErr(e?.message || "Failed to load form"); }
  }, [slug]);

  React.useEffect(() => { load(); }, [load]);

  const addField = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!adminToken) throw new Error("Admin token required");
      const formId = form?.id; if (!formId) throw new Error("Form id missing");
      await formsApi.addFieldToForm(formId, {
        key: draft.key, label: draft.label || draft.key, type: draft.type || "text", write_to: "attributes",
        required: !!draft.required, visible: draft.visible !== false, help_text: draft.help_text || null,
      }, adminToken);
      setDraft({ key: "", label: "", type: "text", required: false, visible: true, help_text: "" });
      await load();
    } catch (e: any) { setErr(e?.message || "Add failed"); }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    try {
      if (!adminToken) throw new Error("Admin token required");
      const formId = form?.id; if (!formId) throw new Error("Form id missing");
      const next = fields.slice(); const j = idx + dir; if (j < 0 || j >= next.length) return;
      const tmp = next[idx]; next[idx] = next[j]; next[j] = tmp;
      const items = next.map((f, i) => ({ id: (f as any)._placement_id || (f as any).id, order_index: i * 10 }));
      await formsApi.reorderForm(formId, items, adminToken);
      await load();
    } catch (e: any) { setErr(e?.message || "Reorder failed"); }
  };

  return (
    <AdminLayout>
      <SectionLayout title={`Form: ${form?.title || slug}`} sidebar={null}>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
        <h3>Fields</h3>
        <ul>
          {fields.map((f, i) => (
            <li key={(f as any).id || i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 160 }}>{f.label || f.key}</span>
              <code>{f.key}</code>
              <span style={{ opacity: .7 }}>{f.type}</span>
              <span style={{ marginLeft: "auto" }}>
                <button onClick={() => move(i, -1)} disabled={i===0}>↑</button>
                <button onClick={() => move(i, 1)} disabled={i===fields.length-1} style={{ marginLeft: 6 }}>↓</button>
              </span>
            </li>
          ))}
        </ul>

        <h3 style={{ marginTop: 16 }}>Add field to this form</h3>
        <form onSubmit={addField} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
          <label>Key<br/><input value={draft.key} onChange={(e)=>setDraft({ ...draft, key: e.target.value })} required /></label>
          <label>Label<br/><input value={draft.label || ""} onChange={(e)=>setDraft({ ...draft, label: e.target.value })} /></label>
          <label>Type<br/>
            <select value={draft.type} onChange={(e)=>setDraft({ ...draft, type: e.target.value })}>
              <option>text</option><option>email</option><option>password</option><option>number</option><option>date</option><option>textarea</option><option>checkbox</option><option>select</option>
            </select>
          </label>
          <label><input type="checkbox" checked={!!draft.required} onChange={(e)=>setDraft({ ...draft, required: e.target.checked })}/> Required</label>
          <label><input type="checkbox" checked={draft.visible !== false} onChange={(e)=>setDraft({ ...draft, visible: e.target.checked })}/> Visible</label>
          <label>Help text<br/><input value={draft.help_text || ""} onChange={(e)=>setDraft({ ...draft, help_text: e.target.value })} /></label>
          <div><button type="submit">Add field</button></div>
        </form>
      </SectionLayout>
    </AdminLayout>
  );
}
'

# --- README for this bundle ---
write "$root/README-CustomForms.md" \
'# Raven Custom Forms Bundle

This bundle adds **custom forms** you can manage in Admin alongside registration/login/profile.

## Files
- sql/2025-10-31_custom_forms.sql
- services/api/src/modules/forms/customForms.controller.ts
- services/api/src/modules/forms/customForms.service.ts
- apps/web/src/lib/apiForms.ts
- apps/web/src/pages/admin/forms/index.tsx
- apps/web/src/pages/admin/forms/[slug].tsx

## Install
1) Run the SQL in Supabase (dev first): `sql/2025-10-31_custom_forms.sql`
2) In `services/api/src/main.ts` mount the router:
```ts
import customForms from "./modules/forms/customForms.controller";
app.use("/v0", customForms);
