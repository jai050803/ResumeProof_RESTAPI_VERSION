'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function RegisterPage() {
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/v1/auth/register', { orgName, email, password });
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as any;
      if (error.response?.status === 409) {
        setError('An account with this email is already registered.');
      } else {
        setError('Registration failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-zinc-900/50 border border-zinc-800 p-10 rounded-2xl max-w-md w-full">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Check your inbox</h2>
          <p className="text-zinc-400 mb-8">We've sent an email verification link to {email}. Please click the link to activate your account.</p>
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="bg-zinc-900/50 border border-zinc-800 p-10 rounded-2xl max-w-md w-full shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Create your account</h1>
        <p className="text-zinc-400 text-sm text-center mb-8">Start verifying technical claims today.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm font-medium mb-1">Organization Name</label>
            <input 
              type="text" 
              required
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
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
            <label className="block text-zinc-400 text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                minLength={8}
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
          <div>
            <label className="block text-zinc-400 text-sm font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                required
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 pr-16 text-white focus:outline-none focus:border-indigo-500 transition"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 hover:text-white font-medium focus:outline-none"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition mt-4 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-zinc-800"></div>
          <span className="px-3 text-zinc-500 text-sm">OR</span>
          <div className="flex-1 border-t border-zinc-800"></div>
        </div>

        <button 
          disabled
          className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-500 font-medium py-2.5 rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <span>Continue with Google</span>
          <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">Coming Soon</span>
        </button>

        <p className="mt-8 text-center text-sm text-zinc-400">
          Already have an account? <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Log in</Link>
        </p>
      </div>
    </main>
  );
}
