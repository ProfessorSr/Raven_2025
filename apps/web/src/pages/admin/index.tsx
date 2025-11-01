import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

export default function AdminIndex() {
  return (
    <AdminLayout title="Admin Dashboard">
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 24,
        maxWidth: 960,
      }}>
        <h2 style={{ marginTop: 0, fontSize: 24 }}>Welcome to Raven Admin</h2>
        <p style={{ fontSize: 16, lineHeight: 1.6 }}>
          Thanks for choosing <b>Raven</b> — a developer‑friendly CMS engine designed to keep up with your ideas.
          Build fast, ship safely, and customize everything: forms, pages, layout, styles, and more.
        </p>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: 16 }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Forms</h3>
            <p>Manage fields for <i>Registration</i>, <i>Login</i>, and <i>Profile</i>. Reorder, validate, and duplicate across scopes.</p>
            <Link href="/admin/forms" style={{ textDecoration: 'none', fontWeight: 600 }}>Go to Forms →</Link>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Pages</h3>
            <p>Compose pages with blocks and control layout and visibility. (Coming next.)</p>
            <Link href="/admin/pages" style={{ textDecoration: 'none', fontWeight: 600 }}>Go to Pages →</Link>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Styles & Settings</h3>
            <p>Theme, typography, brand colors, and site‑wide options. (Roadmap.)</p>
            <Link href="/admin/settings" style={{ textDecoration: 'none', fontWeight: 600 }}>Open Settings →</Link>
          </div>
        </div>

        <hr style={{ margin: '24px 0' }} />
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <b>Quick tips</b>
            <ul style={{ margin: '8px 0 0 18px' }}>
              <li>Use <code>Forms</code> to add or reorder fields for each user flow.</li>
              <li>All API calls go through <code>/__api</code> for reliable cookies in dev and prod.</li>
              <li>Admins are determined by <code>profiles.role = 'admin'</code> (and can be configured via env).</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
