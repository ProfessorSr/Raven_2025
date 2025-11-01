import React from 'react';
import { api } from '@/lib/api';

const ALL_SCOPES = ['registration','login','profile'] as const;

export type FieldScope = 'registration' | 'login' | 'profile';

export type FormField = {
  id?: string;
  key: string;
  label: string;
  scope: FieldScope;
  type: string; // text | password | email | number | date | textarea | checkbox | select
  required?: boolean;
  unique_field?: boolean;
  validation_regex?: string | null;
  min_length?: number | null;
  max_length?: number | null;
  options?: string[] | null;
  default_value?: string | null;
  order_index?: number;
  system?: boolean;
  write_to?: 'core' | 'attributes';
  visible?: boolean;
  help_text?: string | null;
};

type Props = { scope: FieldScope };

export default function FormFieldsManager({ scope }: Props) {
  const [adminToken, setAdminToken] = React.useState('');
  const [fields, setFields] = React.useState<FormField[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const [editing, setEditing] = React.useState<FormField | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [status, setStatus] = React.useState('');

  const [scopes, setScopes] = React.useState<Record<FieldScope, boolean>>({
    registration: false,
    login: false,
    profile: false,
  });

  // hydrate token from localStorage
  React.useEffect(() => {
    const t = localStorage.getItem('adminToken') || '';
    setAdminToken(t);
  }, []);

  // load fields for this scope
  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let data: any;
      if (scope === 'registration') data = await api.form.registration();
      else if (scope === 'login') data = await api.form.login();
      else data = await api.form.profile();

      const list = Array.isArray(data?.fields) ? data.fields as FormField[] : [];
      setFields(list.sort((a,b) => (a.order_index ?? 0) - (b.order_index ?? 0)));
    } catch (e: any) {
      setError(e?.message || 'Failed to load fields');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  React.useEffect(() => { load(); }, [load]);

  const beginCreate = () => {
    setEditing({
      key: '',
      label: '',
      scope,
      type: 'text',
      required: false,
      write_to: 'attributes',
      visible: true,
      options: null,
      help_text: null,
    });
    setScopes({ registration: false, login: false, profile: false, [scope]: true } as Record<FieldScope, boolean>);
  };

  const beginEdit = async (f: FormField) => {
    setEditing({ ...f, options: f.options ? [...f.options] : null });
    try {
      const existing = await fetchByKeyAllScopes(f.key);
      setScopes({
        registration: !!existing.registration,
        login:        !!existing.login,
        profile:      !!existing.profile,
      });
    } catch {
      // fallback: at least check the current record's scope
      setScopes({ registration: false, login: false, profile: false, [f.scope]: true } as Record<FieldScope, boolean>);
    }
  };

  const cancelEdit = () => setEditing(null);

  const fetchByKeyAllScopes = React.useCallback(async (key: string) => {
    const out: Partial<Record<FieldScope, FormField>> = {};
    try {
      const [r, l, p] = await Promise.all([
        api.form.registration(),
        api.form.login(),
        api.form.profile(),
      ]);
      const push = (list: any, s: FieldScope) => {
        const arr = Array.isArray(list?.fields) ? (list.fields as FormField[]) : [];
        const hit = arr.find((ff) => ff.key === key);
        if (hit) out[s] = hit;
      };
      push(r, 'registration');
      push(l, 'login');
      push(p, 'profile');
    } catch (e) {
      // ignore, best-effort
    }
    return out as Record<FieldScope, FormField>;
  }, []);

  const saveEdit = async () => {
    if (!editing) return;
    if (!adminToken) {
      alert('Admin token required');
      return;
    }
    if (!editing.key || typeof editing.key !== 'string') {
      alert('Key is required');
      return;
    }
    setIsSaving(true);
    setStatus('Saving…');

    const payloadBase: any = {
      key: editing.key,
      label: editing.label,
      type: editing.type,
      required: !!editing.required,
      unique_field: !!editing.unique_field,
      validation_regex: editing.validation_regex || null,
      min_length: editing.min_length ?? null,
      max_length: editing.max_length ?? null,
      options: editing.options && editing.options.length ? editing.options : null,
      default_value: editing.default_value ?? null,
      write_to: editing.write_to || 'attributes',
      visible: editing.visible !== false,
      help_text: editing.help_text ?? null,
    };

    try {
      // Determine target scopes from checkboxes
      const targetScopes = (ALL_SCOPES.filter((s) => scopes[s]) as FieldScope[]);
      if (targetScopes.length === 0) {
        alert('Select at least one scope');
        return;
      }

      // For upsert we need to know if a same-key exists in each scope
      const existingByScope = await fetchByKeyAllScopes(editing.key);

      // Always update current record if its scope is among targets
      // Otherwise leave it alone (user can uncheck current scope to avoid overwriting it)
      for (const s of targetScopes) {
        const payload = { ...payloadBase, scope: s };
        const existing = existingByScope[s];

        if (existing) {
          await api.admin.updateField(existing.id!, payload, adminToken);
        } else if (editing.id && editing.scope === s) {
          // Editing an existing record for the same scope
          await api.admin.updateField(editing.id, payload, adminToken);
        } else {
          // Create new record for this scope
          await api.admin.createField(payload, adminToken);
        }
      }

      setStatus('Saved');
      setEditing(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatus(''), 1200);
    }
  };

  const remove = async (id?: string) => {
    if (!id) return;
    if (!adminToken) return alert('Admin token required');
    if (!confirm('Delete this field?')) return;
    try {
      await api.admin.deleteField(id, adminToken);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    setFields((prev) => {
      const arr = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return prev;
      const tmp = arr[idx];
      arr[idx] = arr[j];
      arr[j] = tmp;
      return arr;
    });
  };

  const saveOrder = async () => {
    if (!adminToken) return alert('Admin token required');
    try {
      const items = fields.map((f, i) => ({ id: f.id!, order_index: i * 10 }));
      const res = await fetch(
        `/__api/v0/admin/form-fields/reorder?scope=${encodeURIComponent(scope)}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify({ items }),
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Reorder failed (${res.status})`);
      }
      setStatus('Order saved');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Reorder failed');
    } finally {
      setTimeout(() => setStatus(''), 1200);
    }
  };

  const duplicateTo = async (f: FormField, targets: FieldScope[]) => {
    if (!adminToken) return alert('Admin token required');
    try {
      for (const t of targets) {
        if (t === f.scope) continue;
        const copy = { ...f, id: undefined, scope: t } as any;
        await api.admin.createField(copy, adminToken);
      }
      setStatus('Duplicated');
      setTimeout(() => setStatus(''), 1200);
    } catch (e: any) {
      setError(e?.message || 'Duplicate failed');
    }
  };

  const onEditChange = (patch: Partial<FormField>) => {
    setEditing((e) => (e ? { ...e, ...patch } : e));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          type="password"
          value={adminToken}
          onChange={(e) => {
            setAdminToken(e.target.value);
            localStorage.setItem('adminToken', e.target.value);
          }}
          placeholder="Admin token"
          style={{ flex: '0 0 360px' }}
        />
        <button onClick={load}>Reload</button>
        {status && <span style={{ marginLeft: 8, color: '#065f46' }}>{status}</span>}
        {error && <span style={{ marginLeft: 8, color: 'crimson' }}>{error}</span>}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
          {/* List & order */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Fields ({scope})</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={beginCreate}>Add field</button>
                <button onClick={saveOrder}>Save order</button>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {fields.map((f, i) => (
                <li key={f.id || f.key} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{f.label} <span style={{ opacity: 0.6 }}>({f.key})</span></div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{f.type}{f.required ? ' · required' : ''} · write_to: {f.write_to || 'attributes'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                    <button onClick={() => move(i, +1)} disabled={i === fields.length - 1}>↓</button>
                    <button onClick={() => beginEdit(f)}>Edit</button>
                    <button onClick={() => duplicateTo(f, ['registration','login','profile'].filter(s => s !== f.scope) as FieldScope[])}>Duplicate…</button>
                    <button onClick={() => remove(f.id)} disabled={!!f.system}>Delete</button>
                  </div>
                </li>
              ))}
              {fields.length === 0 && <li style={{ opacity: 0.7 }}>No fields yet</li>}
            </ul>
          </div>

          {/* Editor */}
          <div>
            {editing ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                <h3 style={{ marginTop: 0 }}>{editing.id ? 'Edit field' : 'New field'}</h3>

                <div style={{ display: 'grid', gap: 8 }}>
                  <label>
                    <div>Key *</div>
                    <input value={editing.key} onChange={(e) => onEditChange({ key: e.target.value })} />
                  </label>

                  <label>
                    <div>Label</div>
                    <input value={editing.label} onChange={(e) => onEditChange({ label: e.target.value })} />
                  </label>

                  <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
                    <legend style={{ padding: '0 6px' }}>Scopes</legend>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={scopes.registration} onChange={(e) => setScopes((m) => ({ ...m, registration: e.target.checked }))} />
                      Registration
                    </label>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={scopes.login} onChange={(e) => setScopes((m) => ({ ...m, login: e.target.checked }))} />
                      Login
                    </label>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={scopes.profile} onChange={(e) => setScopes((m) => ({ ...m, profile: e.target.checked }))} />
                      Profile
                    </label>
                    <p style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                      Tip: selecting multiple scopes creates/updates one config per scope with the <code>same key</code>. User data is stored on the profile (core/attributes), so a value entered during registration will appear on the profile form automatically.
                    </p>
                  </fieldset>

                  <label>
                    <div>Type</div>
                    <select value={editing.type} onChange={(e) => onEditChange({ type: e.target.value })}>
                      <option value="text">text</option>
                      <option value="password">password</option>
                      <option value="email">email</option>
                      <option value="number">number</option>
                      <option value="date">date</option>
                      <option value="textarea">textarea</option>
                      <option value="checkbox">checkbox</option>
                      <option value="select">select</option>
                    </select>
                  </label>

                  <label>
                    <input type="checkbox" checked={!!editing.required} onChange={(e) => onEditChange({ required: e.target.checked })} /> Required
                  </label>

                  <label>
                    <input type="checkbox" checked={!!editing.visible} onChange={(e) => onEditChange({ visible: e.target.checked })} /> Visible
                  </label>

                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    Values are saved on the user profile (<code>write_to</code>), not tied to a single form.
                  </div>

                  <label>
                    <div>Write to</div>
                    <select value={editing.write_to || 'attributes'} onChange={(e) => onEditChange({ write_to: e.target.value as any })}>
                      <option value="attributes">attributes</option>
                      <option value="core">core</option>
                    </select>
                  </label>

                  <label>
                    <div>Help text</div>
                    <input value={editing.help_text || ''} onChange={(e) => onEditChange({ help_text: e.target.value })} />
                  </label>

                  <label>
                    <div>Options (comma-separated, for select)</div>
                    <input
                      value={(editing.options || []).join(',')}
                      onChange={(e) => onEditChange({ options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button disabled={isSaving} onClick={saveEdit}>{isSaving ? 'Saving…' : 'Save'}</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ opacity: 0.7 }}>Select a field to edit, or click "Add field".</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
