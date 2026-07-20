"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const ROLES = [
  "Software Engineer",
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "Data Engineer",
];

type FormState = "idle" | "loading" | "success" | "error";

export default function ApplyPage() {
  const [state, setState] = useState<FormState>("idle");
  const [trackingId, setTrackingId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/apply", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Submission failed");
        setState("error");
        return;
      }
      setTrackingId(json.trackingId);
      setState("success");
    } catch {
      setErrorMsg("Network error — please try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            We&apos;ll review your profile and get back to you. Your verification is in progress.
          </p>
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">Tracking ID</p>
            <p className="text-violet-400 font-mono text-sm break-all">{trackingId}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href={`/status/${trackingId}`}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all"
            >
              Check Status →
            </Link>
            <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center gap-1 mb-6">
            ← Back
          </Link>
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 tracking-widest uppercase">
            AI-Verified Applications
          </div>
          <h1 className="text-3xl font-black text-white">Apply to TechCorp</h1>
          <p className="text-gray-400 mt-2">
            Your GitHub profile will be automatically verified by{" "}
            <a href="https://docs.resumeproof.online" target="_blank" className="text-violet-400 hover:underline">
              ResumeProof
            </a>
            .
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl">
          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name <span className="text-red-400">*</span></label>
              <input name="name" required placeholder="Jane Smith" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-600 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email <span className="text-red-400">*</span></label>
              <input name="email" type="email" required placeholder="jane@example.com" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-600 transition-all" />
            </div>
          </div>

          {/* Phone + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone</label>
              <input name="phone" type="tel" placeholder="+91 98765 43210" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-600 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Role Applying For <span className="text-red-400">*</span></label>
              <select name="role" required defaultValue="" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all">
                <option value="" disabled>Select role</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* GitHub + LinkedIn */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">GitHub Username <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                <input name="githubUsername" required placeholder="janedoe" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-600 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">LinkedIn URL</label>
              <input name="linkedinUrl" type="url" placeholder="linkedin.com/in/jane" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-600 transition-all" />
            </div>
          </div>

          {/* Resume upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Resume (PDF, max 5MB) <span className="text-red-400">*</span></label>
            <div
              className="w-full bg-gray-800 border-2 border-dashed border-gray-700 hover:border-violet-500/60 rounded-lg p-6 text-center cursor-pointer transition-all group"
              onClick={() => fileRef.current?.click()}
            >
              {fileName ? (
                <p className="text-violet-400 font-medium text-sm">📄 {fileName}</p>
              ) : (
                <>
                  <p className="text-gray-400 text-sm group-hover:text-gray-300">Click to upload PDF</p>
                  <p className="text-gray-600 text-xs mt-1">Max 5MB</p>
                </>
              )}
              <input
                ref={fileRef}
                name="resume"
                type="file"
                accept=".pdf,application/pdf"
                required
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
            </div>
          </div>

          {/* Cover Note */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Cover Note (optional)</label>
            <textarea name="coverNote" rows={3} placeholder="Tell us why you're a great fit..." className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-600 transition-all resize-none" />
          </div>

          {state === "error" && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={state === "loading"}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-violet-900/40 flex items-center justify-center gap-2"
          >
            {state === "loading" ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application →"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
