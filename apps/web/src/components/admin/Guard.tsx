import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function Guard({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<'loading' | 'ok' | 'denied' | 'error'>('loading');
  const [err, setErr] = React.useState<string>('');

  React.useEffect(() => {
    (async () => {
      try {
        const me = await api.auth.me();
        const isAdmin = !!me?.profile && me.profile.role === 'admin';
        if (isAdmin) {
          setState('ok');
        } else {
          setState('denied');
        }
      } catch (e: any) {
        setErr(e?.message || 'No session');
        setState('denied');
      }
    })();
  }, []);

  if (state === 'loading') return <p style={{ padding: 16 }}>Checking admin access…</p>;
  if (state === 'denied') {
    return (
      <div style={{ padding: 24 }}>
        <h2>Admin access required</h2>
        <p>You must be signed in as an admin to access this section.</p>
        <p>
          <Link href="/login">Go to Login</Link>
        </p>
        {err && <p style={{ color: 'crimson' }}>{err}</p>}
      </div>
    );
  }
  if (state === 'error') return <p style={{ color: 'crimson', padding: 16 }}>{err || 'Auth failed'}</p>;
  return <>{children}</>;
}
