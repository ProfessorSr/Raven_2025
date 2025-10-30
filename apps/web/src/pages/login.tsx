import React from 'react';
import { api } from '../lib/api';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !loading;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setStatus('Signing in...');
    setError('');
    try {
      await api.auth.login({ email: email.trim(), password });
      setStatus('Success! Redirecting...');
      window.location.href = '/profile';
    } catch (e: any) {
      setError(e.message || 'Login failed');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 520, margin: '40px auto', padding: 16 }}>
      <h1>Log in</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="email" style={{ fontWeight: 600 }}>Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="password" style={{ fontWeight: 600 }}>Password</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-pressed={showPassword}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <small style={{ opacity: 0.75 }}>Minimum 6 characters.</small>
        </div>

        <button type="submit" disabled={!canSubmit}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {status && <p style={{ color: 'green', marginTop: 12 }}>{status}</p>}
      {error && <p style={{ color: 'crimson', marginTop: 12 }}>{error}</p>}

      <p style={{ marginTop: 16 }}>
        No account? <Link href="/signup">Create one</Link>
      </p>
    </main>
  );
}
