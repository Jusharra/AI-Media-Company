'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [mode, setMode] = useState<'loading' | 'setup' | 'login'>('loading');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/setup')
      .then(r => r.json())
      .then(data => setMode(data.needsSetup ? 'setup' : 'login'))
      .catch(() => setMode('login'));
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Setup failed');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['HEALTHCARE', 'OIL & GAS', 'CONSTRUCTION', 'SIGNAL'].map((word, i) => (
          <div
            key={word}
            className="absolute text-zinc-900 font-heading text-8xl select-none"
            style={{ top: `${20 + i * 25}%`, left: `${-5 + i * 30}%`, transform: 'rotate(-15deg)' }}
          >
            {word}
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <h1 className="font-heading text-6xl text-amber-500 tracking-wider">SIGNAL</h1>
          <p className="text-zinc-400 text-sm mt-2 font-mono">The Authority Engine</p>
        </div>

        {mode === 'loading' && (
          <div className="text-center text-zinc-500 font-mono text-sm py-8">Initializing...</div>
        )}

        {mode === 'setup' && (
          <div className="bg-zinc-900 border border-amber-800 rounded-lg p-8">
            <h2 className="text-amber-400 font-heading text-2xl mb-1">FIRST-TIME SETUP</h2>
            <p className="text-zinc-500 text-xs font-mono mb-6">Create your admin account to get started.</p>

            {error && (
              <div className="bg-red-950 border border-red-800 text-red-400 rounded px-3 py-2 text-sm mb-4 font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <label className="text-zinc-400 text-xs font-mono uppercase tracking-wider block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  required
                  minLength={3}
                  autoComplete="username"
                  placeholder="e.g. admin"
                />
              </div>

              <div>
                <label className="text-zinc-400 text-xs font-mono uppercase tracking-wider block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Min 8 characters"
                />
              </div>

              <div>
                <label className="text-zinc-400 text-xs font-mono uppercase tracking-wider block mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  required
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-heading text-xl py-2.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>
            </form>
          </div>
        )}

        {mode === 'login' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
            <h2 className="text-zinc-100 font-heading text-2xl mb-6">COMMAND CENTER</h2>

            {error && (
              <div className="bg-red-950 border border-red-800 text-red-400 rounded px-3 py-2 text-sm mb-4 font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-zinc-400 text-xs font-mono uppercase tracking-wider block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="text-zinc-400 text-xs font-mono uppercase tracking-wider block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-heading text-xl py-2.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'AUTHENTICATING...' : 'ENTER'}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-zinc-600 text-xs font-mono mt-6">
          SIGNAL Media Engine v1.0 — Restricted Access
        </p>
      </motion.div>
    </div>
  );
}
