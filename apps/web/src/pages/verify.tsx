import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';

export default function VerifyPage() {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');

  const onResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Resending...'); setError('');
    try {
      await api.auth.resendVerification(email);
      setStatus('Verification email sent! Check your inbox.');
    } catch (e: any) {
      setError(e.message || 'Failed to resend'); setStatus('');
    }
  };

  return (
    <>
      <Header />
      <main style={{ maxWidth: 520, margin: '40px auto', padding: 16 }}>
        <h1>Verify your email</h1>
        <p>Enter your email address and we’ll resend the verification link.</p>
        <form onSubmit={onResend} style={{ display: 'grid', gap: 12 }}>
          <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit">Resend verification</button>
        </form>
        {status && <p style={{ color: 'green' }}>{status}</p>}
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </main>
      <Footer />
    </>
  );
}
