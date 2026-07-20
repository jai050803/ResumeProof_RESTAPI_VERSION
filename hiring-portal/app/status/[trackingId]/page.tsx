"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Candidate } from "@/lib/types";

export default function StatusPage() {
  const { trackingId } = useParams<{ trackingId: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/status?trackingId=${trackingId}`);
      if (!res.ok) { setError("Tracking ID not found."); return; }
      const data = await res.json();
      setCandidate(data);
    } catch {
      setError("Failed to load status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 10000); // poll every 10s
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingId]);

  if (loading) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </main>
  );

  if (error) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Link href="/" className="text-violet-400 hover:underline text-sm">← Home</Link>
      </div>
    </main>
  );

  if (!candidate) return null;

  const status = candidate.verificationStatus;
  const result = candidate.verificationResult;

  const statusConfig = {
    pending: { icon: "⏳", color: "text-gray-400", bg: "bg-gray-800", border: "border-gray-700", label: "Verification in progress..." },
    verified: { icon: "✅", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Profile Verified" },
    flagged: { icon: "⚠️", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", label: "Profile Flagged for Review" },
    rejected: { icon: "❌", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Profile Could Not Be Verified" },
    error: { icon: "🔴", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Verification Error" },
  }[status] ?? { icon: "⏳", color: "text-gray-400", bg: "bg-gray-800", border: "border-gray-700", label: "Pending" };

  return (
    <main className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center gap-1 mb-6">← Home</Link>

        <div className={`${statusConfig.bg} border ${statusConfig.border} rounded-2xl p-8 text-center mb-6 shadow-xl`}>
          <div className="text-5xl mb-4">
            {status === "pending" ? (
              <div className="w-12 h-12 border-2 border-gray-600/40 border-t-gray-400 rounded-full animate-spin mx-auto" />
            ) : statusConfig.icon}
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${statusConfig.color}`}>{statusConfig.label}</h1>
          <p className="text-gray-500 text-sm">Tracking ID: <span className="font-mono text-gray-400">{trackingId}</span></p>
        </div>

        {result && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl">
            {/* Score */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400 font-medium">Confidence Score</span>
                <span className={`text-lg font-bold ${result.confidenceScore >= 75 ? "text-emerald-400" : result.confidenceScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                  {result.confidenceScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${result.confidenceScore >= 75 ? "bg-emerald-500" : result.confidenceScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${result.confidenceScore}%` }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Repos Found", value: result.reposFound },
                { label: "Projects Verified", value: `${result.verifiedProjects}/${result.claimedProjects}` },
                { label: "Skill Alignment", value: `${result.skillAlignment}%` },
              ].map((s) => (
                <div key={s.label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-white">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Matched skills */}
            {result.matchedSkills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Verified Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedSkills.map((s) => (
                    <span key={s} className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* AI summary */}
            {result.aiAnalysis?.summary && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">AI Assessment</p>
                <p className="text-sm text-gray-300 leading-relaxed">{result.aiAnalysis.summary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
