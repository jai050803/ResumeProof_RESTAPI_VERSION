'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { UsageMeter } from '@/components/UsageMeter';

interface Profile {
  name: string;
  email: string;
  plan: string;
  isVerified: boolean;
  webhookUrl?: string;
}

interface Usage {
  used: number;
  quota: number;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileRes, usageRes] = await Promise.all([
          api.get('/v1/settings/profile'),
          api.get('/v1/usage')
        ]);
        setProfile(profileRes.data);
        setUsage(usageRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile || !usage) {
    return <div className="text-red-400 p-6 bg-red-500/10 rounded-xl">Failed to load dashboard data.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Overview</h1>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <UsageMeter 
          currentUsage={usage.used} 
          limit={usage.quota} 
          planName={profile.plan} 
        />

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Profile</h3>
              {profile.isVerified ? (
                <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs font-medium border border-green-500/20">Verified</span>
              ) : (
                <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-xs font-medium border border-yellow-500/20">Unverified</span>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Organization</div>
                <div className="text-white font-medium">{profile.name}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Email</div>
                <div className="text-white font-medium">{profile.email}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <a href="/dashboard/settings" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition">
              Manage Settings &rarr;
            </a>
          </div>
        </div>
      </div>
      
      {/* Webhook Status Widget */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-2">Webhook Configuration</h3>
        {profile.webhookUrl ? (
          <div>
            <div className="flex items-center space-x-2 text-sm text-zinc-400 mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>Delivering payloads to: <strong className="text-white">{profile.webhookUrl}</strong></span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-400 mb-4">
            No webhook configured. You will need to poll the API for verification results.
          </div>
        )}
        <a href="/dashboard/settings" className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg transition border border-zinc-700 inline-block">
          Configure Webhook
        </a>
      </div>
    </div>
  );
}
