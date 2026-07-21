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
    <div className="flex min-w-27.5 items-center gap-2">
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

const DASHBOARD_NAV = [
  { label: "Overview", href: "#overview" },
  { label: "Candidates", href: "#candidates" },
  { label: "Apply", href: "/apply" },
  { label: "Home", href: "/" },
  { label: "Docs", href: "https://docs.resumeproof.online", external: true },
];

function DashboardSidebar({
  total,
  verified,
  flagged,
  pending,
  onNavigate,
}: {
  total: number;
  verified: number;
  flagged: number;
  pending: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-400">ResumeProof</p>
        <h2 className="mt-2 text-2xl font-black text-white">Hiring Portal</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Review candidate verification results from one place, with a mobile-safe navigation surface.
        </p>
      </div>

      <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        {[
          { label: "Total", value: total },
          { label: "Verified", value: verified },
          { label: "Flagged", value: flagged },
          { label: "Pending", value: pending },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-4 py-3">
            <span className="text-xs uppercase tracking-widest text-slate-500">{item.label}</span>
            <span className="text-lg font-black text-white">{item.value}</span>
          </div>
        ))}
      </div>

      <nav className="space-y-2">
        {DASHBOARD_NAV.map((item) => {
          const baseClass = "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors";
          if (item.external) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={`${baseClass} text-slate-300 hover:bg-white/5 hover:text-white`}
                onClick={onNavigate}
              >
                <span>{item.label}</span>
                <span className="text-xs text-slate-500">↗</span>
              </a>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`${baseClass} text-slate-300 hover:bg-white/5 hover:text-white`}
              onClick={onNavigate}
            >
              <span>{item.label}</span>
              <span className="text-xs text-slate-500">→</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-violet-500/20 bg-linear-to-br from-violet-500/10 to-indigo-500/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">Quick action</p>
        <p className="mt-2 text-sm text-slate-300">Invite candidates into the verification flow.</p>
        <Link
          href="/apply"
          onClick={onNavigate}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-violet-500 hover:to-indigo-500"
        >
          Open Application Form
        </Link>
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
  onOpenDetails,
}: {
  candidate: Candidate;
  onOpenDetails: () => void;
}) {
  const result = candidate.verificationResult;
  const matchedCount = result?.matchedSkills?.length ?? 0;
  const totalClaimed = (result?.matchedSkills?.length ?? 0) + (result?.missingSkills?.length ?? 0);

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/10 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{candidate.name}</h3>
          <p className="text-sm text-slate-400">{candidate.role}</p>
        </div>
        <StatusBadge status={candidate.verificationStatus} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">GitHub</p>
          <a
            href={`https://github.com/${candidate.githubUsername}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block break-all text-sm font-mono text-violet-300 hover:text-violet-200"
          >
            @{candidate.githubUsername}
          </a>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">Score</p>
          <div className="mt-2">{result ? <ScoreBar score={result.confidenceScore} /> : <span className="text-xs text-slate-500">Pending</span>}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-400">
        <span>{result ? `${matchedCount}/${totalClaimed} skills` : "Verification pending"}</span>
        <span>{new Date(candidate.appliedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
      </div>

      {result?.flags?.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {result.flags.slice(0, 3).map((flag) => (
            <span key={flag} className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300">
              {flag.length > 18 ? `${flag.slice(0, 16)}…` : flag}
            </span>
          ))}
        </div>
      ) : null}

      <button
        onClick={onOpenDetails}
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/20 hover:bg-white/10"
      >
        View Details
      </button>
    </article>
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      <main className="min-h-screen bg-slate-950 px-4 text-slate-100">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute bottom-20 right-1/4 h-72 w-72 rounded-full bg-cyan-600/10 blur-3xl" />
        </div>
        <div className="relative mx-auto flex min-h-screen w-full max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-indigo-500 text-white font-black">
                TC
              </div>
              <h1 className="text-2xl font-black text-white">Admin Access</h1>
              <p className="mt-1 text-sm text-slate-400">Enter your admin key to continue</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Admin key..."
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {authError && <p className="text-sm text-red-400">Invalid key</p>}
              <button
                type="submit"
                className="w-full rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 py-3 font-semibold text-white transition-all hover:from-violet-500 hover:to-indigo-500"
              >
                Access Dashboard →
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const total = candidates.length;
  const verified = candidates.filter((c) => c.verificationStatus === "verified").length;
  const flagged = candidates.filter((c) => c.verificationStatus === "flagged").length;
  const other = total - verified - flagged;
  const summary = { total, verified, flagged, pending: other };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden lg:flex w-80 shrink-0 border-r border-white/10 bg-slate-950/85 backdrop-blur-xl">
          <DashboardSidebar {...summary} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10 lg:hidden"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open dashboard navigation"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-400">TechCorp Hiring Portal</p>
                  <h1 className="text-lg font-black text-white sm:text-2xl">Candidate Verification Dashboard</h1>
                </div>
              </div>

              <a
                href="https://docs.resumeproof.online"
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/20 sm:inline-flex"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                Powered by ResumeProof
              </a>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
            <div className="grid gap-5">
              <section id="overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total Candidates" value={total} color="border-white/10" />
                <StatCard label="Verified" value={verified} color="border-emerald-500/30" />
                <StatCard label="Flagged" value={flagged} color="border-yellow-500/30" />
                <StatCard label="Rejected / Pending" value={other} color="border-slate-700" />
              </section>

              <section id="candidates" className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/15 backdrop-blur">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Candidates</h2>
                    <p className="mt-1 text-xs text-slate-500">Auto-refreshes every 30 seconds</p>
                  </div>
                  <Link href="/apply" className="text-sm font-medium text-violet-300 hover:text-violet-200">
                    Invite candidates
                  </Link>
                </div>

                {candidates.length === 0 ? (
                  <div className="px-6 py-20 text-center">
                    <p className="text-sm text-slate-500">No candidates yet.</p>
                    <Link href="/apply" className="mt-2 inline-block text-sm font-medium text-violet-300 hover:text-violet-200">
                      Open the application form →
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            {["Name", "Role", "GitHub", "Score", "Status", "Skills Match", "Flags", "Applied At", "Actions"].map((h) => (
                              <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {candidates.map((c) => {
                            const result = c.verificationResult;
                            const matchedCount = result?.matchedSkills?.length ?? 0;
                            const totalClaimed = (result?.matchedSkills?.length ?? 0) + (result?.missingSkills?.length ?? 0);
                            return (
                              <tr key={c.id} className="transition-colors hover:bg-white/3">
                                <td className="whitespace-nowrap px-4 py-3.5 font-medium text-white">{c.name}</td>
                                <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-400">{c.role}</td>
                                <td className="px-4 py-3.5">
                                  <a href={`https://github.com/${c.githubUsername}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-violet-300 hover:text-violet-200 hover:underline">
                                    @{c.githubUsername}
                                  </a>
                                </td>
                                <td className="px-4 py-3.5">{result ? <ScoreBar score={result.confidenceScore} /> : <span className="text-xs text-slate-500">Pending</span>}</td>
                                <td className="px-4 py-3.5">
                                  <StatusBadge status={c.verificationStatus} />
                                </td>
                                <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-400">{result ? `${matchedCount}/${totalClaimed} skills` : "—"}</td>
                                <td className="px-4 py-3.5">
                                  <div className="flex max-w-45 flex-wrap gap-1.5">
                                    {(result?.flags ?? []).slice(0, 3).map((f) => (
                                      <span key={f} className="whitespace-nowrap rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                                        {f.length > 18 ? `${f.slice(0, 16)}…` : f}
                                      </span>
                                    ))}
                                    {(result?.flags?.length ?? 0) > 3 && <span className="text-xs text-slate-500">+{(result?.flags?.length ?? 0) - 3}</span>}
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                                  {new Date(c.appliedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </td>
                                <td className="px-4 py-3.5">
                                  <button
                                    onClick={() => setSelectedCandidate(c)}
                                    className="whitespace-nowrap rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:border-violet-500/50 hover:bg-violet-500/15"
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

                    <div className="space-y-3 p-4 md:hidden">
                      {candidates.map((c) => (
                        <CandidateCard key={c.id} candidate={c} onOpenDetails={() => setSelectedCandidate(c)} />
                      ))}
                    </div>
                  </>
                )}
              </section>
            </div>
          </main>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[85vw] max-w-xs border-r border-white/10 bg-slate-950/95 shadow-2xl shadow-black/40">
            <DashboardSidebar {...summary} onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}

      {selectedCandidate && <DetailPanel candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />}
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
