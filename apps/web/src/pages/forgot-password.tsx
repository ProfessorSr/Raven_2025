import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import supabase from '@/lib/supabaseClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Sending reset email...'); setError('');
    try {
      const redirectTo = window.location.origin + '/reset-password';
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setStatus('Password reset email sent! Check your inbox.');
    } catch (e: any) {
      setError(e.message || 'Failed to send reset email'); setStatus('');
    }
  };

  return (
    <>
      <Header />
      <main style={{ maxWidth: 520, margin: '40px auto', padding: 16 }}>
        <h1>Forgot password</h1>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit">Send reset link</button>
        </form>
        {status && <p style={{ color: 'green' }}>{status}</p>}
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </main>
      <Footer />
    </>
  );
}
