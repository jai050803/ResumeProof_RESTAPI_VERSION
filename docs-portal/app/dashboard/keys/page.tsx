'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { KeyCard } from '@/components/KeyCard';
import { GenerateKeyModal } from '@/components/GenerateKeyModal';

interface ApiKey {
  id: string;
  label: string;
  prefix: string;
  environment: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/keys');
      setKeys(res.data);
    } catch (err) {
      console.error('Failed to fetch keys', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      await api.delete(`/v1/keys/${id}`);
      // Refresh the list to reflect revocation
      fetchKeys();
    } catch (err) {
      alert('Failed to revoke key');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Keys</h1>
          <p className="text-zinc-400">Manage your API keys for programmatic access to ResumeProof.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition whitespace-nowrap"
        >
          + Generate New Key
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : keys.length === 0 ? (
        <div className="border border-zinc-800 border-dashed rounded-2xl p-12 text-center bg-zinc-900/30">
          <div className="text-4xl mb-4">🔑</div>
          <h3 className="text-lg font-medium text-white mb-2">No API keys found</h3>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">Generate a test key to start experimenting, or a live key for production traffic.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
          >
            Generate Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => (
            <KeyCard 
              key={key.id}
              {...key}
              onRevoke={handleRevoke}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <GenerateKeyModal 
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchKeys();
          }}
        />
      )}
    </div>
  );
}
