'use client';
import React from 'react';

interface UsageMeterProps {
  currentUsage: number;
  limit: number;
  planName: string;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({ currentUsage, limit, planName }) => {
  const percentage = Math.min((currentUsage / limit) * 100, 100);
  const isNearLimit = percentage >= 80;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">API Usage</h3>
          <p className="text-sm text-zinc-400">Current billing cycle</p>
        </div>
        <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium capitalize">
          {planName} Plan
        </div>
      </div>

      <div className="mb-2 flex justify-between text-sm">
        <span className="text-zinc-400">
          <strong className="text-white">{currentUsage.toLocaleString()}</strong> requests
        </span>
        <span className="text-zinc-500">{limit.toLocaleString()} limit</span>
      </div>

      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? 'bg-red-500' : 'bg-indigo-500'}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      {isNearLimit && (
        <p className="mt-4 text-xs text-red-400 flex items-center space-x-1">
          <span>⚠️</span>
          <span>You are approaching your rate limit. Consider upgrading your plan.</span>
        </p>
      )}
    </div>
  );
};
