//
//  index.tsx
//
//
//  Created by Calvin Fowler on 10/29/25.
//


import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function HomePage() {
  const [me, setMe] = React.useState<any>(null);

  React.useEffect(() => {
    api.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  return (
    <>
      <Header />
      <main style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
        <h1>Raven</h1>
        <p><small>API: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}</small></p>

        <section style={{ marginTop: 16 }}>
          <h2>Quick links</h2>
          <ul>
            <li><Link href="/signup">Sign up</Link></li>
            <li><Link href="/login">Log in</Link></li>
            <li><Link href="/profile">My profile</Link></li>
            <li><Link href="/admin/forms">Admin → Form fields</Link></li>
          </ul>
        </section>

        <section style={{ marginTop: 16 }}>
          <h2>Status</h2>
          {me?.user ? (
            <p>Signed in as <b>{me.user.email}</b></p>
          ) : (
            <p>Not signed in.</p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
