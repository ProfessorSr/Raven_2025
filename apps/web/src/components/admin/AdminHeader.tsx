import React from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';

export type AdminHeaderProps = {
  title?: string;
};

type Me = {
  id: string;
  email?: string | null;
  display_name?: string | null;
  role?: string | null;
};

const badgeStyles: Record<string, { fg: string; bg: string }> = {
  PROD: { fg: '#b91c1c', bg: '#fee2e2' },
  STAGING: { fg: '#92400e', bg: '#fef3c7' },
  DEV: { fg: '#1e40af', bg: '#dbeafe' },
};

export default function AdminHeader({ title }: AdminHeaderProps) {
  const router = useRouter();
  const [me, setMe] = React.useState<Me | null>(null);
  const [envLabel, setEnvLabel] = React.useState<'PROD' | 'STAGING' | 'DEV'>('DEV');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    // environment badge
    const env = (process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development').toLowerCase();
    const label = env === 'production' ? 'PROD' : env === 'staging' ? 'STAGING' : 'DEV';
    setEnvLabel(label as 'PROD' | 'STAGING' | 'DEV');

    // fetch current session user (ignore errors; Guard handles access)
    (async () => {
      try {
        const res: any = await api.get('/v0/auth/me', { credentials: 'include' });
        if (res && (res.email || res.display_name || res.id)) setMe(res as Me);
      } catch {}
    })();
  }, []);

  async function onLogout() {
    try {
      setBusy(true);
      await api.post('/v0/auth/logout', {}, { credentials: 'include' });
      router.push('/login');
    } catch {
      setBusy(false);
    }
  }

  const bs = badgeStyles[envLabel];

  return (
    <header
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#ffffff',
        position: 'sticky', top: 0, zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Logo / Wordmark */}
        <div style={{
          width: 28, height: 28, borderRadius: 6, background: '#111827', color: '#fff',
          display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14
        }}>R</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Raven Admin</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{title || 'Site control panel'}</div>
        </div>
        <span style={{
          marginLeft: 10, fontSize: 11, fontWeight: 600,
          color: bs.fg,
          background: bs.bg,
          border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 6px'
        }}>{envLabel}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {me ? (
          <>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#111827' }}>{me.display_name || me.email || 'Admin'}</div>
              {me.role && <div style={{ fontSize: 11, color: '#6b7280' }}>{me.role}</div>}
            </div>
            <button
              onClick={onLogout}
              disabled={busy}
              style={{
                background: '#111827', color: '#fff', border: '1px solid #111827', cursor: 'pointer',
                padding: '6px 10px', borderRadius: 6, fontSize: 13
              }}
            >{busy ? 'Signing out…' : 'Logout'}</button>
          </>
        ) : (
          <button
            onClick={() => router.push('/login')}
            style={{
              background: '#111827', color: '#fff', border: '1px solid #111827', cursor: 'pointer',
              padding: '6px 10px', borderRadius: 6, fontSize: 13
            }}
          >Login</button>
        )}
      </div>
    </header>
  );
}
