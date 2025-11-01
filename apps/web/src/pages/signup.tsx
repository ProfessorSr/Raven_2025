import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import { DynamicForm } from '@/components/DynamicForm';

export default function SignupPage() {
  const [fields, setFields] = React.useState<any[]>([]);
  const [values, setValues] = React.useState<Record<string, any>>({ email: '', password: '' });
  const [status, setStatus] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  const [loadingFields, setLoadingFields] = React.useState<boolean>(true);
  const [showPassword, setShowPassword] = React.useState<boolean>(false);

  const loadFields = React.useCallback(async () => {
    setLoadingFields(true);
    setError('');
    try {
      const d = await api.form.registration();
      const raw: any[] = (d && (d as any).fields) || [];
      // filter to visible + registration/both, then sort by order_index
      const usable = raw
        .filter((f) => f?.visible !== false)
        .sort((a, b) => (a?.order_index ?? 0) - (b?.order_index ?? 0))
        .map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          required: !!f.required,
          options: Array.isArray(f.options) ? f.options : null,
          help_text: f.help_text ?? null,
        }));
      setFields(usable);
      // eslint-disable-next-line no-console
      console.debug('[signup] loaded fields', { total: raw.length, usable: usable.length, sample: usable.slice(0, 3) });
    } catch (e: any) {
      setError(e?.message || 'Failed to load registration fields');
      // eslint-disable-next-line no-console
      console.error('[signup] load fields error', e);
    } finally {
      setLoadingFields(false);
    }
  }, []);

  React.useEffect(() => {
    loadFields();
  }, [loadFields]);

  const onChange = (k: string, v: any) => setValues((s) => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Submitting...');
    setError('');
    try {
      const body = { ...values };
      if (!body.email || !body.password) throw new Error('email and password are required');
      const resp = await api.auth.signup(body);
      if (resp && resp.pendingVerification) {
        setStatus('We\'ve sent a verification link to your email. Please verify to continue.');
        return;
      }
      setStatus('Success! Redirecting to profile...');
      window.location.href = '/profile';
    } catch (err: any) {
      setError(err?.message || 'Failed');
      setStatus('');
    }
  };

  return (
    <>
      <Header />
      <main style={{ maxWidth: 520, margin: '40px auto', padding: 16 }}>
        <h1>Sign up</h1>
        <p><small>API: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}</small></p>

        {loadingFields ? (
          <p style={{ opacity: 0.8 }}>Loading form fields…</p>
        ) : (
          <p style={{ opacity: 0.8 }}>
            Loaded <b>{fields.length}</b> dynamic field{fields.length === 1 ? '' : 's'}
          </p>
        )}

        {error && (
          <p style={{ color: 'crimson' }}>Error: {error} <button onClick={loadFields} type="button">Retry</button></p>
        )}

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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={values.password || ''}
                onChange={(e) => onChange('password', e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Dynamic extra fields */}
          <DynamicForm fields={fields} values={values} onChange={onChange} />

          <button type="submit" disabled={loadingFields || status === 'Submitting...'}>Create account</button>
        </form>

        {status && <p style={{ color: 'green' }}>{status}</p>}
        {error && !loadingFields && <p style={{ color: 'crimson' }}>{error}</p>}

        <p style={{ marginTop: 16 }}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
