'use client';

import React, { useState } from 'react';
// import { supabase } from '../../../lib/supabaseClient';
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {

      // const { error } = await supabase.auth.signInWithPassword({ email, password });
      // if (error) throw error;
      // const { data: sessionData } = await supabase.auth.getSession();
      // const access_token = sessionData?.session?.access_token;
      // if (access_token) {
      //   await fetch('/api/auth/set-session', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ access_token }),
      //   });
      // }

      const base = process.env.NEXT_PUBLIC_BACKEND_URL as string;
      const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json?.status) {
        throw new Error(json?.message || 'Login failed');
      }
      const token: string | undefined = json?.data?.token;
      if (!token) throw new Error('No token returned from server');
      try {
        localStorage.setItem('auth_token', token);
      } catch {}
      // Set HttpOnly cookie so middleware recognizes the session
      await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token }),
      });
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="card">
        <div className="card-header">Login</div>
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
