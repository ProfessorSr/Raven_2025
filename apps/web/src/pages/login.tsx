import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import DynamicForm from '@/components/DynamicForm';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [fields, setFields] = React.useState<any[]>([]);
  const [values, setValues] = React.useState<Record<string, any>>({});
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const router = useRouter();

  // Core, non-negotiable login fields
  const coreFields = [
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'password', label: 'Password', type: showPassword ? 'text' : 'password', required: true },
    { key: 'remember_me', label: 'Remember Me', type: 'select', required: false, options: ['true', 'false'] },
  ];

  React.useEffect(() => {
    (async () => {
      try {
        // Fetch admin-defined login fields (if any)
        const data = await api.form.login().catch(() => ({ fields: [] }));
        const arr = Array.isArray((data as any)?.fields) ? (data as any).fields : [];

        // Remove any admin-defined attempts to override core fields
        const extras = arr.filter((f: any) => !['email', 'password', 'remember_me'].includes(String(f?.key)));

        // Merge: core first, then extras
        const merged = [...coreFields, ...extras];
        setFields(merged);

        // Initialize values for all fields (preserve any existing)
        setValues((prev) => {
          const next: Record<string, any> = { ...prev };
          for (const f of merged) {
            if (!(f.key in next)) {
              if (f.key === 'remember_me') next[f.key] = 'false';
              else next[f.key] = '';
            }
          }
          return next;
        });
      } catch (e: any) {
        console.error(e);
        const fallback = coreFields;
        setFields(fallback);
        setValues({ email: '', password: '', remember_me: 'false' });
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPassword]); // re-run to retype password field when toggled

  const onChange = (key: string, value: any) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const onSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setStatus('Logging in…');
    setError('');
    try {
      const email = String(values.email || '').trim();
      const password = String(values.password || '');
      const remember = values.remember_me === true || values.remember_me === 'true';

      if (!email || !password) {
        setStatus('');
        setError('Email and password are required');
        return;
      }

      // Perform login (sets cookie)
      await api.auth.login({ email, password, remember });

      // Fetch current user and decide destination
      try {
        const me = await api.auth.me();
        const isAdmin = (me?.profile?.role === 'admin') || (me?.user?.email === 'dev@example.com');
        if (isAdmin) {
          window.location.assign('/admin');
          return;
        }
        window.location.assign('/profile');
        return;
      } catch {
        window.location.assign('/profile');
        return;
      }
    } catch (e: any) {
      setError(e?.message || 'Login failed');
      setStatus('');
    }
  };

  return (
    <>
      <Header />
      <main style={{ maxWidth: 520, margin: '40px auto', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0 }}>Log in</h1>
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            style={{
              fontSize: 14,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
            }}
            aria-pressed={showPassword}
          >
            {showPassword ? 'Hide password' : 'Show password'}
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <DynamicForm fields={fields} values={values} onChange={onChange} />
          <div style={{ marginTop: 16 }}>
            <button
              type="submit"
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: '1px solid #111827',
                background: '#111827',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Log in
            </button>
          </div>
        </form>

        {status && <p style={{ color: 'green' }}>{status}</p>}
        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <p style={{ marginTop: 8 }}>
          <Link href="/forgot-password">Forgot your password?</Link>
        </p>
        <p>
          <Link href="/verify">Resend verification email</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
