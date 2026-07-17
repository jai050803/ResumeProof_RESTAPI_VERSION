'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      setIsReady(true);
    }
  }, [router]);

  const navItems = [
    { label: 'Overview', href: '/dashboard' },
    { label: 'API Keys', href: '/dashboard/keys' },
    { label: 'Settings', href: '/dashboard/settings' },
  ];

  if (!isReady) {
    return null; // Don't render until client-side auth check completes
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl mx-auto w-full pt-8 px-6">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 mr-8 hidden md:block">
          <nav className="space-y-1 sticky top-24">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive 
                      ? 'bg-indigo-500/10 text-indigo-400' 
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pb-24">
          {children}
        </main>
      </div>
    </div>
  );
}
