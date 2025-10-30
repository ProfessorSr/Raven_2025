import React from 'react';
import Link from 'next/link';
import { api } from '../lib/api';

export default function Header() {
  const [me, setMe] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string>('');

  React.useEffect(() => {
    let mounted = true;
    api.auth.me()
      .then((d) => { if (mounted) setMe(d?.user || null); })
      .catch(() => { if (mounted) setMe(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const onLogout = async () => {
    try {
      await api.auth.logout();
      // Redirect to login and force a reload to clear any client state
      window.location.href = '/login';
    } catch (e: any) {
      setErr(e?.message || 'Logout failed');
    }
  };

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', borderBottom: '1px solid #e5e7eb',
    }}>
      <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/">Home</Link>
        <Link href="/signup">Sign up</Link>
        <Link href="/login">Log in</Link>
        <Link href="/profile">Profile</Link>
        <Link href="/admin/forms">Admin</Link>
      </nav>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {loading ? (
          <span style={{ opacity: 0.7 }}>…</span>
        ) : me ? (
          <>
            <span style={{ opacity: 0.85 }}>Signed in as <b>{me.email}</b></span>
            <button onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <span style={{ opacity: 0.7 }}>Not signed in</span>
        )}
      </div>

      {err && <p style={{ color: 'crimson', marginLeft: 12 }}>{err}</p>}
    </header>
  );
}
