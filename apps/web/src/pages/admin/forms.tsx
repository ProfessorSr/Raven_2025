import React from 'react';
import { api } from '../../lib/api';

type Field = {
  id?: string;
  key: string;
  label?: string | null;
  scope: 'registration' | 'profile' | 'both';
  type: 'text' | 'textarea' | 'email' | 'number' | 'select' | 'checkbox' | 'date';
  required?: boolean;
  options?: any[] | null;
  write_to: 'core' | 'attributes';
  order_index?: number | null;
  help_text?: string | null;
};

const SCOPES: Field['scope'][] = ['registration', 'profile', 'both'];
const TYPES: Field['type'][] = ['text', 'textarea', 'email', 'number', 'select', 'checkbox', 'date'];
const WRITE_TO: Field['write_to'][] = ['core', 'attributes'];

function sanitizeKey(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function AdminForms() {
  const [fields, setFields] = React.useState<Field[]>([]);
  const [token, setToken] = React.useState('');
  const [error, setError] = React.useState('');
  const [filter, setFilter] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Create/Edit panel state
  const [showPanel, setShowPanel] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Field>({
    key: '',
    label: '',
    scope: 'registration',
    type: 'text',
    required: false,
    options: null,
    write_to: 'attributes',
    order_index: null,
    help_text: ''
  });
  const [formError, setFormError] = React.useState<string>('');

  const [rows, setRows] = React.useState<Field[]>([]);
  const [dirtyOrder, setDirtyOrder] = React.useState(false);
  const dragIndexRef = React.useRef<number | null>(null);

  const reload = async () => {
    try {
      const d = await api.admin.listFields(filter || undefined);
      const arr: Field[] = ((d as any).fields || (d as any) || []) as Field[];
      setFields(arr);
      setRows(arr);
      setDirtyOrder(false);
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  React.useEffect(() => { reload(); }, [filter]);

  function openCreate() {
    setEditingId(null);
    setForm({ key: '', label: '', scope: 'registration', type: 'text', required: false, options: null, write_to: 'attributes', order_index: null, help_text: '' });
    setFormError('');
    setShowPanel(true);
  }

  function openEdit(f: Field) {
    setEditingId(f.id || null);
    setForm({
      key: f.key || '',
      label: f.label || '',
      scope: f.scope,
      type: f.type,
      required: !!f.required,
      options: f.options ?? (f.type === 'select' ? [] : null),
      write_to: f.write_to,
      order_index: f.order_index ?? null,
      help_text: f.help_text ?? ''
    });
    setFormError('');
    setShowPanel(true);
  }

  function validate(): string | null {
    const k = sanitizeKey(form.key || '');
    // derive from label if key is empty
    const derived = !k && form.label ? sanitizeKey(form.label) : k;

    if (!derived) return 'Key is required (use letters, numbers, underscore).';
    if (!SCOPES.includes(form.scope)) return 'Invalid scope';
    if (!TYPES.includes(form.type)) return 'Invalid type';
    if (!WRITE_TO.includes(form.write_to)) return 'Invalid write_to';
    if (form.type === 'select' && form.options && !Array.isArray(form.options)) {
      return 'Options must be an array for select';
    }
    return null;
  }

  async function submit() {
    const err = validate();
    if (err) { setFormError(err); return; }
    setLoading(true);
    setFormError('');
    const effectiveKey = sanitizedPreview;
    if (!effectiveKey) {
      setFormError('Key is required (derived from key or label).');
      setLoading(false);
      return;
    }
    try {
      // final sanitize + derive
      const k = effectiveKey;
      const payload: any = {
        ...form,
        key: k,
        label: form.label && form.label.trim() ? form.label : k,
        options: form.type === 'select'
          ? (Array.isArray(form.options) ? form.options : [])
          : null,
      };
      console.debug('[admin/forms] submitting payload', payload);
      await (editingId
        ? api.admin.updateField(editingId, payload, token)
        : api.admin.createField(payload, token)
      );
      setShowPanel(false);
      await reload();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(f: Field) {
    if (!confirm(`Delete field "${f.key}"?`)) return;
    try {
      await api.admin.deleteField(String(f.id), token);
      await reload();
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    }
  }

  // helpers for form updates
  const set = (k: keyof Field, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const optionsCsv = Array.isArray(form.options) ? form.options.join(',') : '';
  const sanitizedPreview = sanitizeKey(form.key || '') || (form.label ? sanitizeKey(form.label) : '');
  const effectiveKey = sanitizedPreview;

  function onDragStart(idx: number) {
    dragIndexRef.current = idx;
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onDrop(idx: number) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from == null || from === idx) return;
    setRows((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDirtyOrder(true);
  }

  async function saveOrder() {
    if (!dirtyOrder) return;
    try {
      // Prevent saving if any row is missing an id (would cause upsert/insert and DB NOT NULL errors)
      const missing = rows.filter((r: any) => !r?.id);
      if (missing.length) {
        setError(`Cannot save order: ${missing.length} item(s) missing id. Click Reload and try again.`);
        await reload();
        return;
      }

      const ids = rows.map((r) => String(r.id));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v0/admin/form-fields/reorder`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
          // NOTE: omit 'Accept' to avoid strict CORS preflight failures on some setups
        },
        body: JSON.stringify({ ids }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || 'Failed to save order');
      setDirtyOrder(false);
      await reload();
    } catch (e: any) {
      setError(e.message || 'Failed to save order');
    }
  }
  function resetOrder() {
    setRows(fields);
    setDirtyOrder(false);
  }

  return (
    <main style={{ maxWidth: 1000, margin: '40px auto', padding: 16 }}>
      <h1>Admin: Form Fields</h1>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <input placeholder="ADMIN_API_TOKEN" value={token} onChange={(e) => setToken(e.target.value)} style={{ flex: 1 }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={reload}>Reload</button>
        <button onClick={openCreate}>New Field</button>
        <button onClick={saveOrder} disabled={!dirtyOrder}>Save Order</button>
        <button onClick={resetOrder} disabled={!dirtyOrder}>Reset</button>
      </div>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {/* Create/Edit Panel */}
      {showPanel && (
        <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit Field' : 'New Field'}</h2>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div>
              <label>Key *</label>
              <input
                value={form.key}
                onChange={(e) => set('key', sanitizeKey(e.target.value))}
                placeholder="first_name"
              />
              <small style={{ opacity: 0.7 }}>
                Effective key: <code>{sanitizeKey(form.key || '') || (form.label ? sanitizeKey(form.label) : '') || '—'}</code>
              </small>
            </div>
            <div>
              <label>Label</label>
              <input value={form.label || ''} onChange={(e) => set('label', e.target.value)} placeholder="First Name" />
            </div>
            <div>
              <label>Scope</label>
              <select value={form.scope} onChange={(e) => set('scope', e.target.value as Field['scope'])}>
                {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Type</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value as Field['type'])}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Write To</label>
              <select value={form.write_to} onChange={(e) => set('write_to', e.target.value as Field['write_to'])}>
                {WRITE_TO.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input id="fld_required" type="checkbox" checked={!!form.required} onChange={(e) => set('required', e.target.checked)} />
              <label htmlFor="fld_required">Required</label>
            </div>
            {form.type === 'select' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Options (comma-separated)</label>
                <input
                  value={optionsCsv}
                  onChange={(e) => set('options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="red, green, blue"
                />
              </div>
            )}
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Help Text</label>
              <input value={form.help_text || ''} onChange={(e) => set('help_text', e.target.value)} placeholder="Shown under the field" />
            </div>
          </div>

          {formError && <p style={{ color: 'crimson', marginTop: 12 }}>{formError}</p>}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={submit} disabled={loading || !sanitizedPreview}>
              {loading ? 'Saving…' : (editingId ? 'Save Changes' : 'Create Field')}
            </button>
            <button onClick={() => setShowPanel(false)} type="button">Cancel</button>
          </div>
        </div>
      )}

      {dirtyOrder && (
        <p style={{ color: '#b45309', background: '#fffbeb', border: '1px solid #fef3c7', padding: 8, borderRadius: 6 }}>
          You have unsaved changes to the order. Click <b>Save Order</b> to persist.
        </p>
      )}

      <table border={1} cellPadding={6} cellSpacing={0} width="100%">
        <thead>
          <tr>
            <th style={{ width: 32 }}></th><th>key</th><th>label</th><th>scope</th><th>type</th><th>required</th><th>write_to</th><th>actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f: any, idx: number) => (
            <tr key={f.id || f.key}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(idx)}
            >
              <td style={{ cursor: 'grab', width: 32 }}>☰</td>
              <td>{f.key}</td>
              <td>{f.label}</td>
              <td>{f.scope}</td>
              <td>{f.type}</td>
              <td>{String(f.required)}</td>
              <td>{f.write_to}</td>
              <td>
                <button onClick={() => openEdit(f)}>Edit</button>{' '}
                <button onClick={() => onDelete(f)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
