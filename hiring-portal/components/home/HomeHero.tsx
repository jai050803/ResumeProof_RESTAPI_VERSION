import Link from "next/link";

const featurePills = [
  "GitHub-backed verification",
  "HMAC-signed webhooks",
  "Mobile-friendly application flow",
];

export function HomeHero() {
  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-10 sm:px-6 sm:pt-24 sm:pb-14 lg:pt-28">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-28 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-1/4 -right-28 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-violet-400">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          Powered by ResumeProof
        </div>

        <div className="max-w-3xl space-y-5">
          <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            TechCorp
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Hiring Portal
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            AI-powered resume verification built into every application. We
            verify GitHub activity, skill authenticity, and project claims
            automatically.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/apply"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-violet-900/40 transition-all duration-200 hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-700/40"
          >
            Apply for a Role →
          </Link>
          <Link
            href="/admin"
            className="rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 font-semibold text-slate-100 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
          >
            Admin Dashboard
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {featurePills.map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}