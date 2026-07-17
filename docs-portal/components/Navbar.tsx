'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearTokens } from '@/lib/auth';

export const Navbar: React.FC = () => {
  const router = useRouter();

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  return (
    <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="text-xl font-bold text-white flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-indigo-500">Resume</span>
            <span>Proof</span>
          </Link>
        </div>
        <div className="flex items-center space-x-6">
          <a href="/#api" className="text-sm text-zinc-400 hover:text-white transition">API Docs</a>
          <button 
            onClick={handleLogout}
            className="text-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-4 py-1.5 rounded-lg transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};
