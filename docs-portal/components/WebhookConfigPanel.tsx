'use client';
import React, { useState } from 'react';
import api from '@/lib/api';

export function WebhookConfigPanel({ initialWebhookUrl }: { initialWebhookUrl?: string }) {
  const [url, setUrl] = useState(initialWebhookUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [secret, setSecret] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSecret('');

    if (!url.startsWith('https://') && !url.includes('localhost')) {
      setError('Webhook URL must use HTTPS.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/v1/settings/webhook', { webhookUrl: url });
      setSecret(res.data.webhookSecret);
      setSuccess('Webhook configured successfully! Save your signing secret below.');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      if (err.response?.data?.message === 'webhook_endpoint_unreachable') {
        setError("We couldn't reach that URL — check it's publicly accessible and returns a 2xx response.");
      } else {
        setError(err.response?.data?.message || 'Failed to configure webhook.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl shadow-xl">
      <h2 className="text-xl font-bold text-white mb-2">Webhook Configuration</h2>
      <p className="text-zinc-400 text-sm mb-6">Receive real-time HTTP POST payloads when verification jobs complete.</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {success && !secret && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-zinc-400 text-sm font-medium mb-1">Endpoint URL</label>
          <input 
            type="url"
            required
            placeholder="https://api.yourdomain.com/webhooks/resumeproof"
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Testing & Saving...' : 'Save Webhook'}
        </button>
      </form>

      {secret && (
        <div className="mt-8 p-6 bg-zinc-950 border border-indigo-500/30 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <h3 className="text-lg font-bold text-white mb-2">Webhook Signing Secret</h3>
          <p className="text-red-400 text-sm mb-4 font-medium flex items-center gap-2">
            ⚠️ Please copy this secret now. For your security, it will never be shown again!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <code className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-lg text-indigo-300 font-mono text-sm break-all">
              {secret}
            </code>
            <button
              onClick={handleCopy}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy Secret'}
            </button>
          </div>
          
          <button
            onClick={() => setSecret('')}
            className="mt-6 w-full text-zinc-500 hover:text-white text-sm font-medium transition bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg"
          >
            I have saved it safely
          </button>
        </div>
      )}
    </div>
  );
}
