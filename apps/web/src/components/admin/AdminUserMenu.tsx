import React from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';

export type AdminUser = {
  id?: string;
  email?: string | null;
  display_name?: string | null;
  role?: string | null;
};

type AdminUserMenuProps = {
  me?: AdminUser | null;
  onLogout?: () => Promise<void> | void;
};

export default function AdminUserMenu({ me, onLogout }: AdminUserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  async function handleLogout() {
    try {
      setBusy(true);
      if (onLogout) await onLogout();
      else await api.post('/v0/auth/logout', {}, { credentials: 'include' });
      router.push('/login');
    } catch (e) {
      setBusy(false);
    }
  }

  const name = me?.display_name || me?.email || 'Account';
  const initial = (name || 'A').trim().charAt(0).toUpperCase();

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8,
          padding: '6px 10px', cursor: 'pointer'
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: '#1f2937', color: '#fff',
          display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13
        }}>
          {initial}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, color: '#111827' }}>{name}</div>
          {me?.role && <div style={{ fontSize: 11, color: '#6b7280' }}>{me.role}</div>}
        </div>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M5 7l5 5 5-5" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div role="menu" style={{
          position: 'absolute', right: 0, marginTop: 6,
          background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8,
          boxShadow: '0 10px 20px rgba(0,0,0,0.08)', minWidth: 220, zIndex: 30
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Signed in as</div>
            <div style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{name}</div>
          </div>

          <button
            onClick={() => { setOpen(false); router.push('/profile'); }}
            role="menuitem"
            style={itemStyle}
          >Profile</button>

          {me?.role === 'admin' && (
            <button
              onClick={() => { setOpen(false); router.push('/admin'); }}
              role="menuitem"
              style={itemStyle}
            >Admin Dashboard</button>
          )}

          <div style={{ borderTop: '1px solid #f3f4f6', margin: '6px 0' }} />

          <button
            onClick={handleLogout}
            role="menuitem"
            disabled={busy}
            style={{
              ...itemStyle,
              color: '#b91c1c'
            }}
          >{busy ? 'Signing out…' : 'Logout'}</button>
        </div>
      )}
    </div>
  );
}

const itemStyle: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left',
  padding: '8px 12px', background: 'transparent', border: 'none',
  fontSize: 13, color: '#111827', cursor: 'pointer'
};
