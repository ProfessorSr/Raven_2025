import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import supabase from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Updating password...'); setError('');
    try {
      if (password.length < 8) throw new Error('Password must be at least 8 characters');
      if (password !== confirm) throw new Error('Passwords do not match');
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus('Password updated! You can close this tab and log in again.');
    } catch (e: any) {
      setError(e.message || 'Failed to update password'); setStatus('');
    }
  };

  return (
    <>
      <Header />
      <main style={{ maxWidth: 520, margin: '40px auto', padding: 16 }}>
        <h1>Reset password</h1>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <button type="submit">Update password</button>
        </form>
        {status && <p style={{ color: 'green' }}>{status}</p>}
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </main>
      <Footer />
    </>
  );
}
