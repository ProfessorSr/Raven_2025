import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import SectionLayout from "@/components/admin/SectionLayout";
import * as formsApi from "@/lib/apiForms";
import { api } from "@/lib/api";
import { useRouter } from "next/router";

// ---- Types ----
type Field = {
  id?: string;
  _placement_id?: string; // placement row id (server adds this)
  key: string;
  label?: string;
  type?: string;
  required?: boolean;
  visible?: boolean;
  help_text?: string | null;
  order_index?: number;
  write_to?: "core" | "attributes";
  validation_regex?: string | null;
  min_length?: number | null;
  max_length?: number | null;
  options?: string[] | null;
};

function FormDetailPage() {
  const [adminToken, setAdminToken] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [form, setForm] = React.useState<any>(null);
  const [fields, setFields] = React.useState<Field[]>([]);
  const [err, setErr] = React.useState("");
  const [info, setInfo] = React.useState("");
  const [draft, setDraft] = React.useState<Field>({ key: "", label: "", type: "text", required: false, visible: true, help_text: "" });
  const [editing, setEditing] = React.useState<Field | null>(null);

  // Derive admin token once, and slug from Next router when ready
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const tok = localStorage.getItem("raven_admin_token") || "";
      setAdminToken(tok);
    }
  }, []);

  React.useEffect(() => {
    if (!router.isReady) return;
    const s = String(router.query.slug || "");
    if (s) setSlug(s);
  }, [router.isReady, router.query.slug]);

  const load = React.useCallback(async () => {
    if (!slug) return;
    setErr("");
    setInfo("");
    try {
      const data = await formsApi.getFormBySlug(slug);
      setForm(data.form);
      setFields((data.fields || []).map((f: any, i: number) => ({
        ...f,
        order_index: typeof f.order_index === "number" ? f.order_index : i * 10,
      })));
    } catch (e: any) {
      setErr(e?.message || "Failed to load form");
    }
  }, [slug]);

  React.useEffect(() => { load(); }, [load]);

  // ---- Actions ----
  async function addField(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setInfo("");
    try {
      if (!adminToken) throw new Error("Admin token required");
      const formId = form?.id; if (!formId) throw new Error("Form id missing");
      await formsApi.addFieldToForm(formId, {
        key: draft.key,
        label: draft.label || draft.key,
        type: draft.type || "text",
        write_to: draft.write_to || "attributes",
        required: !!draft.required,
        visible: draft.visible !== false,
        help_text: draft.help_text || null,
        validation_regex: draft.validation_regex || null,
        min_length: draft.min_length ?? null,
        max_length: draft.max_length ?? null,
        options: draft.options ?? null,
      }, adminToken);
      setDraft({ key: "", label: "", type: "text", required: false, visible: true, help_text: "" });
      setInfo("Field added");
      await load();
    } catch (e: any) { setErr(e?.message || "Add failed"); }
  }

  async function move(idx: number, dir: -1 | 1) {
    setErr("");
    setInfo("");
    try {
      if (!adminToken) throw new Error("Admin token required");
      const formId = form?.id; if (!formId) throw new Error("Form id missing");
      const next = fields.slice(); const j = idx + dir; if (j < 0 || j >= next.length) return;
      const tmp = next[idx]; next[idx] = next[j]; next[j] = tmp;
      const items = next.map((f, i) => ({ id: (f as any)._placement_id || (f as any).id, order_index: i * 10 }));
      await formsApi.reorderForm(formId, items, adminToken);
      setInfo("Order saved");
      await load();
    } catch (e: any) { setErr(e?.message || "Reorder failed"); }
  }

  async function onDelete(f: Field) {
    if (!confirm(`Remove "${f.label || f.key}" from form?`)) return;
    setErr("");
    setInfo("");
    try {
      const formId = form?.id; if (!formId) throw new Error("Form id missing");
      const pid = (f as any)._placement_id || (f as any).id; if (!pid) throw new Error("Placement id missing");
      await api.del(`/v0/admin/forms/${encodeURIComponent(formId)}/fields/${encodeURIComponent(pid)}`);
      setInfo("Field removed");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Delete failed");
    }
  }

  function beginEdit(f: Field) { setEditing({ ...f }); }

  async function saveEdit() {
    if (!editing) return;
    setErr("");
    setInfo("");
    try {
      const formId = form?.id; if (!formId) throw new Error("Form id missing");
      const pid = (editing as any)._placement_id || (editing as any).id; if (!pid) throw new Error("Placement id missing");
      const body: any = {
        required: !!editing.required,
        visible: editing.visible !== false,
        help_text: editing.help_text || null,
        order_index: typeof editing.order_index === 'number' ? editing.order_index : undefined,
        label: editing.label,
        type: editing.type,
        write_to: editing.write_to,
        validation_regex: editing.validation_regex,
        min_length: editing.min_length,
        max_length: editing.max_length,
        options: editing.options,
      };
      await api.put(`/v0/admin/forms/${encodeURIComponent(form.id)}/fields/${encodeURIComponent(pid)}`, body);
      setEditing(null);
      setInfo("Field updated");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Update failed");
    }
  }

  // ---- Render ----
  return (
    <AdminLayout>
      <SectionLayout title={`Form: ${form?.title || slug}`} sidebar={null}>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
        {info && <p style={{ color: "seagreen" }}>{info}</p>}

        <h3>Fields</h3>
        <ul style={{ display:'grid', gap:8, padding:0, listStyle:'none', maxWidth: 760 }}>
          {fields.map((f, i) => (
            <li key={(f as any)._placement_id || (f as any).id || `${f.key}-${i}`}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: 8, border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <div style={{ minWidth: 200 }}>
                <strong>{f.label || f.key}</strong>
                <div style={{ fontSize:12, opacity:.7 }}>{f.key} · {f.type}</div>
              </div>
              <div style={{ fontSize:12, opacity:.8 }}>required: {String(!!f.required)}</div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button onClick={() => move(i, -1)} disabled={i===0}>↑</button>
                <button onClick={() => move(i, 1)} disabled={i===fields.length-1}>↓</button>
                <button onClick={() => beginEdit(f)}>Edit</button>
                <button onClick={() => onDelete(f)} style={{ color: 'crimson' }}>Delete</button>
              </div>
            </li>
          ))}
        </ul>

        {editing && (
          <div style={{ marginTop: 16, padding: 12, border: "1px solid #cbd5e1", borderRadius: 8, maxWidth: 760 }}>
            <h4>Edit field</h4>
            <div style={{ display:'grid', gap:8 }}>
              <label>Label<br/>
                <input value={editing.label || ""} onChange={(e)=>setEditing({ ...editing, label: e.target.value })} />
              </label>
              <label>Type<br/>
                <select value={editing.type || "text"} onChange={(e)=>setEditing({ ...editing, type: e.target.value })}>
                  <option>text</option><option>email</option><option>password</option><option>number</option><option>date</option><option>textarea</option><option>checkbox</option><option>select</option>
                </select>
              </label>
              <label><input type="checkbox" checked={!!editing.required} onChange={(e)=>setEditing({ ...editing, required: e.target.checked })}/> Required</label>
              <label><input type="checkbox" checked={editing.visible !== false} onChange={(e)=>setEditing({ ...editing, visible: e.target.checked })}/> Visible</label>
              <label>Help text<br/>
                <input value={editing.help_text || ""} onChange={(e)=>setEditing({ ...editing, help_text: e.target.value })} />
              </label>
              <label>Order index<br/>
                <input type="number" value={typeof editing.order_index === 'number' ? editing.order_index : 0} onChange={(e)=>setEditing({ ...editing, order_index: Number(e.target.value) })} />
              </label>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={saveEdit} type="button">Save</button>
                <button onClick={()=>setEditing(null)} type="button">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <h3 style={{ marginTop: 24 }}>Add field to this form</h3>
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

export default FormDetailPage;
