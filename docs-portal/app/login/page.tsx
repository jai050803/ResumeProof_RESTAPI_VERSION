'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setTokens } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/v1/auth/login', { email, password });
      setTokens(response.data.accessToken, response.data.refreshToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as any;
      if (error.response?.status === 401) {
        setError('Invalid email or password.');
      } else if (error.response?.status === 403) {
        setError('Please verify your email address before logging in.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="bg-zinc-900/50 border border-zinc-800 p-10 rounded-2xl max-w-md w-full shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Welcome back</h1>
        <p className="text-zinc-400 text-sm text-center mb-8">Log in to manage your API keys and verification jobs.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm font-medium mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-zinc-400 text-sm font-medium">Password</label>
              <a href="#" className="text-indigo-400 text-sm hover:text-indigo-300">Forgot password?</a>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 pr-16 text-white focus:outline-none focus:border-indigo-500 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 hover:text-white font-medium focus:outline-none"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition mt-4 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-400">
          Don't have an account? <Link href="/register" className="text-indigo-400 hover:text-indigo-300">Register</Link>
        </p>
      </div>
    </main>
  );
}
