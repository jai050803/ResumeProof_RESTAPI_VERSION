import React from 'react';
import Link from 'next/link';
import { ApiCodeBlock } from '@/components/ApiCodeBlock';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300 selection:bg-indigo-500/30">
      {/* Navbar Placeholder */}
      <header className="border-b border-zinc-800/60 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 md:py-0 md:h-16 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <div className="text-xl font-bold text-white flex items-center space-x-2">
            <span className="text-indigo-500">Resume</span>
            <span>Proof</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 md:space-x-6 text-sm">
            <a href="#how-it-works" className="hover:text-white transition">How it Works</a>
            <a href="#api" className="hover:text-white transition">API Reference</a>
            <Link href="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-sm mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span>v1.0 API is now live</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 max-w-4xl">
          Automated Developer <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Verification</span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Verify technical claims by cross-referencing resumes against actual GitHub commit history, powered by deterministic analysis and intelligent skill matching.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:space-x-4">
          <Link href="/register" className="bg-white text-zinc-950 hover:bg-zinc-200 px-6 py-3 rounded-lg font-semibold transition w-full sm:w-auto text-center">
            Start Verifying
          </Link>
          <a href="#api" className="px-6 py-3 border border-zinc-700 hover:border-zinc-500 hover:text-white rounded-lg font-semibold transition w-full sm:w-auto text-center">
            Read the Docs
          </a>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-zinc-800/60 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How it works</h2>
            <p className="text-zinc-400">Three simple steps to integrate resume verification into your pipeline.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center font-bold text-xl mb-6">1</div>
              <h3 className="text-xl font-semibold text-white mb-3">Submit PDF</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Upload a candidate&apos;s resume PDF and provide their GitHub URL via a secure multipart request.</p>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center font-bold text-xl mb-6">2</div>
              <h3 className="text-xl font-semibold text-white mb-3">Background Analysis</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Our worker instances extract text, scrape GitHub repositories, and execute deterministic cross-checks.</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center font-bold text-xl mb-6">3</div>
              <h3 className="text-xl font-semibold text-white mb-3">Receive Webhook</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Get a secure HMAC-signed webhook delivery as soon as the verification job completes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section id="api" className="border-t border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">API Reference</h2>
            <p className="text-zinc-400">Integrate deeply using our REST APIs. All endpoints require your secret API key passed via the <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">x-api-key</code> header.</p>
          </div>

          <div className="space-y-24">
            {/* Quick Setup */}
            <div>
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-bold font-mono">SETUP</span>
                  <h3 className="text-xl font-semibold text-white">Environment Configuration</h3>
                </div>
                <p className="text-zinc-400 text-sm mb-4">After generating your keys from the dashboard, you must configure your backend environment variables to securely connect to ResumeProof and receive webhook events.</p>
              </div>
              <div className="bg-[#0d1117] border border-zinc-800 rounded-xl overflow-hidden font-mono text-sm">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-[#161b22]">
                  <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">.env</span>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-zinc-300">
                    <code className="block"><span className="text-indigo-400">RESUMEPROOF_API_KEY</span>=&quot;rp_live_...&quot;</code>
                    <code className="block"><span className="text-indigo-400">RESUMEPROOF_API_URL</span>=&quot;https://api.resumeproof.online&quot;</code>
                    <code className="block"><span className="text-indigo-400">WEBHOOK_SECRET</span>=&quot;your_generated_webhook_secret&quot;</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Verify Endpoint */}
            <div>
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold font-mono">POST</span>
                  <h3 className="text-xl font-semibold text-white">/v1/verify</h3>
                </div>
                <p className="text-zinc-400 text-sm">Initiate a new resume verification job. The PDF payload must be sent as <code className="text-zinc-300">multipart/form-data</code> with a maximum size of 10MB.</p>
              </div>
              <ApiCodeBlock 
                requestMethod="POST"
                requestPath="/v1/verify"
                requestHeaders={{
                  'x-api-key': 'rp_live_LPiiu...',
                  'Content-Type': 'multipart/form-data; boundary=---WebKitFormBoundary7MA4YWxkTrZu0gW'
                }}
                requestBody={{
                  githubUrl: "https://github.com/torvalds",
                  resume: "(binary PDF data)"
                }}
                responseStatus={202}
                responseBody={{
                  transactionId: "cm6v5a1bx...",
                  trackingId: "req_f8b3c1a9...",
                  status: "queued"
                }}
              />
            </div>

            {/* Poll Endpoint */}
            <div>
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-bold font-mono">GET</span>
                  <h3 className="text-xl font-semibold text-white">/v1/verify/:trackingId</h3>
                </div>
                <p className="text-zinc-400 text-sm">Poll for the status of a verification request if you aren&apos;t using webhooks.</p>
              </div>
              <ApiCodeBlock 
                requestMethod="GET"
                requestPath="/v1/verify/req_f8b3c1a9..."
                requestHeaders={{
                  'x-api-key': 'rp_live_LPiiu...'
                }}
                responseStatus={200}
                responseBody={{
                  trackingId: "req_f8b3c1a9...",
                  status: "done",
                  createdAt: "2026-07-16T22:00:00Z",
                  completedAt: "2026-07-16T22:01:15Z",
                  result: {
                    confidenceScore: 92,
                    status: "verified",
                    githubUsername: "torvalds",
                    reposFound: 45,
                    claimedProjects: 3,
                    verifiedProjects: 3,
                    commitAuthorship: "strong",
                    skillAlignment: 95,
                    matchedSkills: ["C", "Linux", "Git"],
                    missingSkills: [],
                    flags: [],
                    aiAnalysis: "The candidate demonstrates exceptional alignment with the claimed projects."
                  }
                }}
              />
            </div>

            {/* Webhook Payload */}
            <div>
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-bold font-mono">WEBHOOK</span>
                  <h3 className="text-xl font-semibold text-white">verification.completed</h3>
                </div>
                <p className="text-zinc-400 text-sm">Delivered to your configured webhook URL upon job completion. Verify the payload signature using your webhook secret and the <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">x-rp-signature</code> header (HMAC-SHA256).</p>
              </div>
              <ApiCodeBlock 
                requestMethod="POST"
                requestPath="/your-webhook-endpoint"
                requestHeaders={{
                  'Content-Type': 'application/json',
                  'x-rp-signature': 'a8b3... (HMAC hex string)'
                }}
                requestBody={{
                  event: "verification.completed",
                  data: {
                    transactionId: "cm6v5a1bx...",
                    confidenceScore: 92,
                    status: "verified",
                    githubUsername: "torvalds",
                    reposFound: 45,
                    claimedProjects: 3,
                    verifiedProjects: 3,
                    commitAuthorship: "strong",
                    skillAlignment: 95,
                    matchedSkills: ["C", "Linux", "Git"],
                    missingSkills: [],
                    flags: [],
                    aiAnalysis: "The candidate demonstrates exceptional alignment with the claimed projects."
                  }
                }}
                responseStatus={200}
                responseBody={{
                  received: true
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-800/60 py-12 text-center text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} ResumeProof. All rights reserved.</p>
      </footer>
    </main>
  );
}
