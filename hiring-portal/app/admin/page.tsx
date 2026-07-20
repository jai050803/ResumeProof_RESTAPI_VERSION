"use client";

import { Candidate, ProjectMatch } from "@/lib/types";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// ─── Sub-components ───────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  const textColor = score >= 75 ? "text-emerald-400" : score >= 50 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold ${textColor} w-7 text-right`}>{score}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: Candidate["verificationStatus"] }) {
  const map: Record<string, string> = {
    verified: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    flagged: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
    pending: "bg-gray-700/50 text-gray-400 border-gray-600",
    error: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const labels: Record<string, string> = {
    verified: "✓ Verified", flagged: "⚠ Flagged", rejected: "✕ Rejected", pending: "○ Pending", error: "! Error"
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? map.pending}`}>
      {labels[status] ?? "Pending"}
    </span>
  );
}

function VerdictBadge({ verdict }: { verdict: ProjectMatch["verdict"] }) {
  const map: Record<string, string> = {
    verified: "bg-emerald-500/15 text-emerald-400",
    partial: "bg-yellow-500/15 text-yellow-400",
    not_found: "bg-gray-700 text-gray-400",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${map[verdict] ?? map.not_found}`}>
      {verdict.replace("_", " ")}
    </span>
  );
}

// ─── Detail Slide-Over ───────────────────────────────────────────

function DetailPanel({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  const result = candidate.verificationResult;
  const ai = result?.aiAnalysis;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-gray-950 border-l border-gray-800 overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gray-950/95 border-b border-gray-800 px-6 py-4 flex items-center justify-between backdrop-blur">
          <div>
            <h2 className="text-white font-bold text-lg">{candidate.name}</h2>
            <p className="text-gray-400 text-sm">{candidate.role}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!result ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-2 border-gray-700 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Verification pending...</p>
            </div>
          ) : (
            <>
              {/* Score card */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Confidence Score</p>
                    <p className={`text-4xl font-black ${result.confidenceScore >= 75 ? "text-emerald-400" : result.confidenceScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                      {result.confidenceScore}<span className="text-xl text-gray-500">/100</span>
                    </p>
                  </div>
                  <StatusBadge status={result.status} />
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${result.confidenceScore >= 75 ? "bg-emerald-500" : result.confidenceScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${result.confidenceScore}%` }}
                  />
                </div>
              </div>

              {/* GitHub stats */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-3">GitHub Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Repos Found", value: result.reposFound },
                    { label: "Projects Claimed", value: result.claimedProjects },
                    { label: "Projects Verified", value: result.verifiedProjects },
                    { label: "Skill Alignment", value: `${result.skillAlignment}%` },
                    { label: "Commit Authorship", value: result.commitAuthorship ? "✓ Yes" : "✕ No" },
                    { label: "GitHub User", value: `@${result.githubUsername}` },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                      <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                      <div className="text-sm font-semibold text-white">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Summary */}
              {ai?.summary && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-3">AI Assessment</h3>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded font-medium bg-violet-500/15 text-violet-400">
                        {ai.overallVerdict?.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{ai.summary}</p>
                  </div>
                </div>
              )}

              {/* Project matches */}
              {ai?.projectMatches && ai.projectMatches.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-3">Project Verification</h3>
                  <div className="space-y-2">
                    {ai.projectMatches.map((pm, i) => (
                      <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-sm text-white font-medium leading-snug">{pm.claimedProject}</p>
                          <VerdictBadge verdict={pm.verdict} />
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          {pm.matchedRepo && <p>Repo: <span className="text-violet-400 font-mono">{pm.matchedRepo}</span></p>}
                          <p>Commits: <span className="text-gray-300">{pm.commitsByCandidate}</span> · Confidence: <span className="text-gray-300">{pm.matchConfidence}%</span></p>
                          {pm.techOverlap.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {pm.techOverlap.map((t) => <span key={t} className="bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded text-xs">{t}</span>)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-3">Skills</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-emerald-400 mb-2 font-medium">✓ Verified on GitHub</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchedSkills.map((s) => (
                        <span key={s} className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                      {result.matchedSkills.length === 0 && <span className="text-xs text-gray-600">None</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-red-400 mb-2 font-medium">✕ Missing from GitHub</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missingSkills.map((s) => (
                        <span key={s} className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                      {result.missingSkills.length === 0 && <span className="text-xs text-gray-600">None</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Flags */}
              {result.flags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-3">Flags</h3>
                  <div className="space-y-1.5">
                    {result.flags.map((f) => (
                      <div key={f} className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                        <span className="text-red-400 text-xs">⚑</span>
                        <span className="text-red-300 text-xs font-mono">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Card ──────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`bg-gray-900 border ${color} rounded-xl p-5 flex-1`}>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY; // Note: gate is server-side guarded via query param
  const [authed, setAuthed] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);

  // Check key from URL or input
  useEffect(() => {
    const urlKey = searchParams.get("key");
    if (urlKey) {
      // Validate against server — just store it and fetch; the API will validate
      setKeyInput(urlKey);
      setAuthed(true);
    }
  }, [searchParams]);

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/candidates?key=" + keyInput);
      if (!res.ok) { setAuthed(false); return; }
      const data = await res.json();
      setCandidates(data);
    } catch { /* ignore */ }
  }, [keyInput]);

  useEffect(() => {
    if (!authed) return;
    fetchCandidates();
    const iv = setInterval(fetchCandidates, 30000);
    return () => clearInterval(iv);
  }, [authed, fetchCandidates]);

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/admin?key=${keyInput}`);
    setAuthed(true);
    setAuthError(false);
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white">Admin Access</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your admin key to continue</p>
          </div>
          <form onSubmit={handleAuth} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Admin key..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-600"
            />
            {authError && <p className="text-red-400 text-sm">Invalid key</p>}
            <button type="submit" className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all">
              Access Dashboard →
            </button>
          </form>
        </div>
      </main>
    );
  }

  const total = candidates.length;
  const verified = candidates.filter((c) => c.verificationStatus === "verified").length;
  const flagged = candidates.filter((c) => c.verificationStatus === "flagged").length;
  const other = total - verified - flagged;

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-white">TechCorp Hiring Portal</h1>
            <p className="text-xs text-gray-500">Candidate Verification Dashboard</p>
          </div>
          <a
            href="https://docs.resumeproof.online"
            target="_blank"
            className="inline-flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-violet-500/20 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Powered by ResumeProof
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="flex gap-4 mb-8">
          <StatCard label="Total Candidates" value={total} color="border-gray-800" />
          <StatCard label="Verified" value={verified} color="border-emerald-500/30" />
          <StatCard label="Flagged" value={flagged} color="border-yellow-500/30" />
          <StatCard label="Rejected / Pending" value={other} color="border-gray-700" />
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">Candidates</h2>
            <span className="text-xs text-gray-600">Auto-refreshes every 30s</span>
          </div>

          {candidates.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-sm">No candidates yet.</p>
              <Link href="/apply" className="text-violet-400 text-sm hover:underline mt-2 inline-block">Invite candidates to apply →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {["Name", "Role", "GitHub", "Score", "Status", "Skills Match", "Flags", "Applied At", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {candidates.map((c) => {
                    const result = c.verificationResult;
                    const matchedCount = result?.matchedSkills?.length ?? 0;
                    const totalClaimed = (result?.matchedSkills?.length ?? 0) + (result?.missingSkills?.length ?? 0);
                    return (
                      <tr key={c.id} className="hover:bg-gray-800/30 transition-colors group">
                        <td className="px-4 py-3.5 font-medium text-white whitespace-nowrap">{c.name}</td>
                        <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap text-xs">{c.role}</td>
                        <td className="px-4 py-3.5">
                          <a href={`https://github.com/${c.githubUsername}`} target="_blank" className="text-violet-400 hover:underline text-xs font-mono">
                            @{c.githubUsername}
                          </a>
                        </td>
                        <td className="px-4 py-3.5">
                          {result ? <ScoreBar score={result.confidenceScore} /> : <span className="text-gray-600 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3.5"><StatusBadge status={c.verificationStatus} /></td>
                        <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                          {result ? `${matchedCount}/${totalClaimed} skills` : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {(result?.flags ?? []).slice(0, 3).map((f) => (
                              <span key={f} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                {f.length > 18 ? f.slice(0, 16) + "…" : f}
                              </span>
                            ))}
                            {(result?.flags?.length ?? 0) > 3 && (
                              <span className="text-xs text-gray-500">+{(result?.flags?.length ?? 0) - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(c.appliedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setSelectedCandidate(c)}
                            className="text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-500/60 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedCandidate && (
        <DetailPanel candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
      )}
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>}>
      <AdminContent />
    </Suspense>
  );
}
