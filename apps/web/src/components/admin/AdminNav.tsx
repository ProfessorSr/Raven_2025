import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { adminSections } from '@/lib/adminSections';

const items = adminSections.map(s => ({ href: s.href, label: s.label }));

export default function AdminNav() {
  const { asPath } = useRouter();
  // Derive stable section from URL: "/admin", "/admin/forms", "/admin/pages"
  const cleanPath = React.useMemo(() => {
    const noQuery = asPath.split('?')[0].split('#')[0];
    return noQuery.replace(/\/+$/, ''); // strip trailing slash
  }, [asPath]);

  const section = React.useMemo(() => {
    const segs = cleanPath.split('/').filter(Boolean); // ["admin", "forms", ...]
    if (!segs.length) return '/';
    // Take "/admin" or "/admin/<sub>"
    const base = '/' + segs[0];
    return segs[1] ? `${base}/${segs[1]}` : base;
  }, [cleanPath]);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <nav style={{ display: 'grid', gap: 8 }}>
      {items.map(it => {
        const active = section === it.href;
        const baseStyle = {
          padding: '8px 10px',
          borderRadius: 8,
          textDecoration: 'none',
          background: active ? '#ffffff' : '#eff6ff',
          color: active ? '#1e40af' : '#1e3a8a',
          border: active ? '1px solid #c7d2fe' : '1px solid #bfdbfe',
          boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        };
        const hoverStyle = !active && hovered === it.href ? { background: '#dbeafe' } : {};
        const style = { ...baseStyle, ...hoverStyle };

        return (
          <Link key={it.href} href={it.href} legacyBehavior>
            <a
              style={style}
              onMouseEnter={() => setHovered(it.href)}
              onMouseLeave={() => setHovered(null)}
            >
              {it.label}
            </a>
          </Link>
        );
      })}
    </nav>
  );
}
