import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-2xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Powered by ResumeProof
        </div>

        <h1 className="text-5xl font-black text-white mb-4 leading-tight">
          TechCorp<br />
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Hiring Portal
          </span>
        </h1>

        <p className="text-gray-400 text-lg mb-10 leading-relaxed">
          AI-powered resume verification built into every application.
          We verify GitHub activity, skill authenticity, and project claims — automatically.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/apply"
            className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-violet-900/40 hover:shadow-violet-700/40 hover:-translate-y-0.5"
          >
            Apply for a Role →
          </Link>
          <Link
            href="/admin"
            className="px-8 py-3.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-200 font-semibold rounded-xl transition-all duration-200"
          >
            Admin Dashboard
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-center">
          {[
            { label: "GitHub Verified", icon: "🔍" },
            { label: "AI Analysis", icon: "🤖" },
            { label: "Instant Results", icon: "⚡" },
          ].map((f) => (
            <div key={f.label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-sm text-gray-400 font-medium">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
