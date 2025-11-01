import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';


export default function ProfilePage() {
  const [me, setMe] = React.useState<any>(null);
  const [err, setErr] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [tick, setTick] = React.useState(0); // to force a manual refetch

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await api.auth.me(); // goes through /__api with credentials
        if (!mounted) return;
        setMe(d);
        setErr('');
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[profile] me()', d);
        }
      } catch (e: any) {
        if (!mounted) return;
        setMe(null);
        setErr(e?.message || 'Not signed in');
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[profile] me() failed:', e?.message || e);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // re-run when tick changes (manual refresh)
  }, [tick]);

  const isAdmin = !!me?.profile && me.profile.role === 'admin';

  return (
    <>
      <Header />
      <main style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
        <h1>Profile</h1>

        {loading && <p>Loading…</p>}

        {!loading && !me && (
          <>
            <p style={{ color: 'crimson' }}>{err || 'You are not signed in.'}</p>
            <p><a href="/login">Log in</a></p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setTick((n) => n + 1);
              }}
              style={{ marginTop: 8 }}
            >
              Try again
            </button>
          </>
        )}

        {!loading && me && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <p><b>Email:</b> {me.user?.email}</p>
            {isAdmin ? (
              <p style={{ color: '#065f46' }}><b>Role:</b> admin — <a href="/admin">Go to Admin</a></p>
            ) : (
              <p><b>Role:</b> member</p>
            )}
            {/* Add any profile fields you want to display */}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
