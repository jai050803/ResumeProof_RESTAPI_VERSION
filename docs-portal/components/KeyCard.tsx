'use client';
import React, { useState } from 'react';

interface KeyCardProps {
  id: string;
  label: string;
  prefix: string;
  environment: string;
  lastUsed: string | null;
  isActive: boolean;
  createdAt: string;
  onRevoke: (id: string) => Promise<void>;
}

export const KeyCard: React.FC<KeyCardProps> = ({
  id, label, prefix, environment, lastUsed, isActive, createdAt, onRevoke
}) => {
  const [revoking, setRevoking] = useState(false);

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone and any integrations using this key will break immediately.')) {
      return;
    }
    setRevoking(true);
    await onRevoke(id);
    setRevoking(false);
  };

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  const lastUsedText = lastUsed 
    ? new Date(lastUsed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Never used';

  return (
    <div className={`border p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between transition ${isActive ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-950 border-zinc-900 opacity-60'}`}>
      <div className="flex-1 mb-4 md:mb-0">
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-white font-medium">{label}</h3>
          {isActive ? (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
          ) : (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Revoked</span>
          )}
          <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium border ${environment === 'live' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
            {environment}
          </span>
        </div>
        <div className="font-mono text-zinc-400 text-sm mb-3">
          {prefix}••••••••••••••••••••••••
        </div>
        <div className="flex space-x-6 text-xs text-zinc-500">
          <div>Created: {formattedDate}</div>
          <div>Last used: {lastUsedText}</div>
        </div>
      </div>
      
      {isActive && (
        <div className="flex items-center">
          <button 
            onClick={handleRevoke}
            disabled={revoking}
            className="text-sm bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-300 px-4 py-2 rounded-lg transition border border-zinc-700 hover:border-red-500/30 disabled:opacity-50"
          >
            {revoking ? 'Revoking...' : 'Revoke Key'}
          </button>
        </div>
      )}
    </div>
  );
};
