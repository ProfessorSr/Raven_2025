import React from 'react';
import { api } from '../lib/api';
import { DynamicForm } from '../components/DynamicForm';
import Link from 'next/link';

export default function SignupPage() {
  const [fields, setFields] = React.useState<any[]>([]);
  const [values, setValues] = React.useState<Record<string, any>>({ email: '', password: '' });
  const [status, setStatus] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    api.form.registration().then((d) => setFields(d.fields || [])).catch((e) => setError(e.message));
  }, []);

  const onChange = (k: string, v: any) => setValues((s) => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Submitting...');
    setError('');
    try {
      const body = { ...values };
      if (!body.email || !body.password) throw new Error('email and password are required');
      await api.auth.signup(body);
      setStatus('Success! Redirecting to profile...');
      window.location.href = '/profile';
    } catch (err: any) {
      setError(err.message || 'Failed');
      setStatus('');
    }
  };

  return (
    <main style={{ maxWidth: 520, margin: '40px auto', padding: 16 }}>
      <h1>Sign up</h1>
      <p><small>API: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}</small></p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="email" style={{ fontWeight: 600 }}>Email *</label>
          <input
            id="email"
            type="email"
            value={values.email || ''}
            onChange={(e) => onChange('email', e.target.value)}
            required
          />
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="password" style={{ fontWeight: 600 }}>Password *</label>
          <input
            id="password"
            type="password"
            value={values.password || ''}
            onChange={(e) => onChange('password', e.target.value)}
            required
          />
        </div>
        <DynamicForm fields={fields} values={values} onChange={onChange} />
        <button type="submit">Create account</button>
      </form>
      {status && <p style={{ color: 'green' }}>{status}</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <p style={{ marginTop: 16 }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
