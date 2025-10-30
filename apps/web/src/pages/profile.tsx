import React from 'react';
import { api } from '../lib/api';
import { DynamicForm } from '../components/DynamicForm';

export default function ProfilePage() {
  const [fields, setFields] = React.useState<any[]>([]);
  const [values, setValues] = React.useState<Record<string, any>>({});
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api.auth.me().catch(() => { window.location.href = '/login'; });
    api.form.profile().then((d) => setFields(d.fields || [])).catch((e) => setError(e.message));
    api.profile.get().then((d) => {
      const p = d.profile || {};
      setValues({
        display_name: p.display_name || '',
        avatar_url: p.avatar_url || '',
        bio: p.bio || '',
        ...(p.attributes || {}),
      });
    }).catch(() => {});
  }, []);

  const onChange = (k: string, v: any) => setValues((s) => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Saving...');
    setError('');
    try {
      await api.profile.update(values);
      setStatus('Saved!');
    } catch (e: any) {
      setError(e.message || 'Failed');
      setStatus('');
    }
  };

  return (
    <main style={{ maxWidth: 640, margin: '40px auto', padding: 16 }}>
      <h1>My Profile</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
        <DynamicForm fields={fields} values={values} onChange={onChange} />
        <button type="submit">Save</button>
      </form>
      {status && <p style={{ color: 'green' }}>{status}</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </main>
  );
}
