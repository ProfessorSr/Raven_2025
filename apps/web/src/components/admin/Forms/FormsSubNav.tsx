import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function FormsSubNav() {
  const router = useRouter();
  const path = router?.pathname || '';

  const items = [
    { href: '/admin/forms/registration', label: 'Registration' },
    { href: '/admin/forms/login', label: 'Login' },
    { href: '/admin/forms/profile', label: 'Profile' },
  ];

  return (
    <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      {items.map((item) => {
        const active = path === item.href;
        return (
          <Link key={item.href} href={item.href} legacyBehavior>
            <a
              aria-current={active ? 'page' : undefined}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                textDecoration: 'none',
                border: '1px solid #e5e7eb',
                background: active ? '#dbeafe' : '#fff',
                color: active ? '#1d4ed8' : '#374151',
                fontWeight: active ? 600 : 500,
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = active ? '#dbeafe' : '#f9fafb')}
              onMouseLeave={(e) => (e.currentTarget.style.background = active ? '#dbeafe' : '#fff')}
            >
              {item.label}
            </a>
          </Link>
        );
      })}
    </nav>
  );
}
