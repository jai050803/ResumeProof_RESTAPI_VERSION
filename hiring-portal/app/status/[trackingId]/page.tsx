"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Candidate } from "@/lib/types";

// SVG Icons
const IconPending = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400 animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const IconVerified = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconFlagged = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconRejected = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const IconError = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

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
    <div className="animate-fade-in">
      <main className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </main>
    </div>
  );

  if (error) return (
    <div className="animate-fade-in">
      <main className="min-h-screen bg-[#F8F9FC] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4 font-medium">{error}</p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 transition-colors duration-150 text-sm font-medium flex items-center gap-1 justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );

  if (!candidate) return null;

  const status = candidate.verificationStatus;
  const result = candidate.verificationResult;

  const statusConfig = {
    pending: { icon: <IconPending />, color: "text-indigo-600", label: "Verification in Progress" },
    verified: { icon: <IconVerified />, color: "text-emerald-600", label: "Profile Verified" },
    flagged: { icon: <IconFlagged />, color: "text-amber-600", label: "Flagged for Review" },
    rejected: { icon: <IconRejected />, color: "text-red-600", label: "Unable to Verify" },
    error: { icon: <IconError />, color: "text-red-500", label: "Verification Error" },
  }[status] ?? { icon: <IconPending />, color: "text-indigo-600", label: "Verification in Progress" };

  return (
    <div className="animate-fade-in">
      <main className="min-h-screen bg-[#F8F9FC] py-10 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-slate-500 hover:text-slate-700 text-sm transition-colors duration-150 flex items-center gap-1 mb-6 font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="15 18 9 12 15 6" /></svg>
            Back to Home
          </Link>

          {/* Status Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6 text-left relative overflow-hidden hover:shadow-md transition-shadow duration-150">
            <div className="flex items-center gap-6 relative z-10">
              <div className="shrink-0">{statusConfig.icon}</div>
              <div className="flex-1">
                <h1 className={`text-2xl font-bold mb-3 ${statusConfig.color}`}>{statusConfig.label}</h1>
                <div className="flex flex-wrap items-center gap-3">
                <div className="font-mono text-xs bg-slate-100 border border-slate-200 rounded px-2 py-1 text-slate-600">
                  {trackingId}
                </div>
                <div className="text-slate-400 text-xs">
                  Applied {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
          {status === "pending" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
              <div className="h-full bg-indigo-400 animate-[slide_2s_ease-in-out_infinite]" style={{ width: '50%', transform: 'translateX(-100%)' }} />
              <style>{`
                @keyframes slide {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(200%); }
                }
              `}</style>
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Confidence Score */}
              <div className="col-span-1 md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Confidence Score</div>
                    <div className={`text-4xl font-black ${result.confidenceScore >= 75 ? "text-emerald-600" : result.confidenceScore >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {result.confidenceScore}
                    </div>
                  </div>
                  <div className={`text-sm font-semibold px-3 py-1 rounded-full ${result.confidenceScore >= 75 ? "bg-emerald-50 text-emerald-700" : result.confidenceScore >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                    {result.confidenceScore >= 75 ? "Strong Match" : result.confidenceScore >= 50 ? "Moderate Match" : "Weak Match"}
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${result.confidenceScore >= 75 ? "bg-emerald-600" : result.confidenceScore >= 50 ? "bg-amber-600" : "bg-red-600"}`}
                    style={{ width: `${result.confidenceScore}%` }}
                  />
                </div>
              </div>

              {/* Repos Found */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150 relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 absolute top-6 right-6">
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-1.22-1.82A2 2 0 0 0 9.53 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                  <polyline points="10 12 8 14 10 16" />
                  <polyline points="14 12 16 14 14 16" />
                </svg>
                <div className="text-3xl font-bold text-slate-900 mb-1">{result.reposFound}</div>
                <div className="text-sm font-medium text-slate-500">Repos Found</div>
              </div>

              {/* Projects Verified */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150 relative">
                <div className="absolute top-6 right-6 w-8 h-8">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <path className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-emerald-500" strokeWidth="4" strokeDasharray={`${(result.verifiedProjects / Math.max(result.claimedProjects, 1)) * 100}, 100`} stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{result.verifiedProjects} <span className="text-lg text-slate-400">/ {result.claimedProjects}</span></div>
                <div className="text-sm font-medium text-slate-500">Projects Verified</div>
              </div>

              {/* Skill Alignment */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150">
                <div className={`text-3xl font-bold mb-1 ${result.skillAlignment >= 75 ? "text-emerald-600" : result.skillAlignment >= 50 ? "text-amber-600" : "text-red-600"}`}>{result.skillAlignment}%</div>
                <div className="text-sm font-medium text-slate-500 mb-3">Skill Alignment</div>
                <div className="flex gap-1 h-1.5 w-full">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex-1 rounded-sm ${i < Math.round(result.skillAlignment / 20) ? (result.skillAlignment >= 75 ? "bg-emerald-500" : result.skillAlignment >= 50 ? "bg-amber-500" : "bg-red-500") : "bg-slate-100"}`} />
                  ))}
                </div>
              </div>

              {/* Commit Authorship */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150 flex flex-col justify-center">
                <div className="text-sm font-medium text-slate-500 mb-2">Commit Authorship</div>
                <div className="flex items-center gap-2">
                  {result.reposFound > 0 ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span className="text-base font-bold text-emerald-700">Confirmed</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span className="text-base font-bold text-slate-600">Not Confirmed</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Verified Skills */}
            {result.matchedSkills && result.matchedSkills.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150">
                <h3 className="text-base font-semibold text-slate-900 mb-3">Verified Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {result.matchedSkills.map((s) => (
                    <span key={s} className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {result.missingSkills && result.missingSkills.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150">
                <h3 className="text-base font-semibold text-slate-900 mb-3">Skills Not Found in GitHub</h3>
                <div className="flex flex-wrap gap-2">
                  {result.missingSkills.map((s) => (
                    <span key={s} className="bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium px-3 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Flags */}
            {result.flags && result.flags.length > 0 && (
              <div className="bg-amber-50/30 border border-amber-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150">
                <h3 className="flex items-center gap-2 font-semibold text-base text-amber-700 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Review Flags
                </h3>
                <ul className="space-y-2">
                  {result.flags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-amber-800 text-sm">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Assessment */}
            {result.aiAnalysis?.summary && (
              <div className="bg-indigo-50/20 border border-indigo-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-150">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                  </svg>
                  <h3 className="text-indigo-700 text-xs uppercase tracking-widest font-semibold">AI Assessment</h3>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">{result.aiAnalysis.summary}</p>
                {result.aiAnalysis.overallVerdict && (
                  <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {result.aiAnalysis.overallVerdict}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Auto Refresh */}
        {status === "pending" && (
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21v-5h5" />
            </svg>
            Auto-refreshing every 10 seconds
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
