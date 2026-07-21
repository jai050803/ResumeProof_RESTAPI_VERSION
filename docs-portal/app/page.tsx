import Link from 'next/link';
import { ctaSection, featureGrid, heroVariants, howItWorks, socialProof } from '@/lib/siteCopy';

export default function Home() {
  const hero = heroVariants[0];

  return (
    <main className="min-h-screen bg-pub-bg text-pub-text-main selection:bg-pub-accent/30 font-sans">
      <header className="sticky top-0 z-50 border-b border-zinc-800/70 bg-pub-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
            <span className="pub-gradient-text font-pub-display">ResumeProof</span>
            <span className="text-pub-text-main">API</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm sm:gap-6">
            <Link href="/docs" className="hidden text-pub-text-muted transition hover:text-pub-text-main sm:inline-flex">Docs</Link>
            <Link href="/dashboard" className="hidden text-pub-text-muted transition hover:text-pub-text-main sm:inline-flex">Dashboard</Link>
            <Link href="/register" className="inline-flex items-center justify-center rounded-lg bg-pub-accent px-4 py-2 font-medium text-white transition hover:bg-indigo-400">
              Create API key
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.10),transparent_28%)]" />
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="relative z-10 max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-pub-text-muted">ResumeProof verification API</p>
            <h1 className="mt-4 max-w-xl font-pub-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {hero.h1}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-pub-text-muted sm:text-xl">
              {hero.subheading}
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 text-pub-text-muted">
              {hero.supporting}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center rounded-xl bg-pub-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-400">
                {ctaSection.primaryLabel}
              </Link>
              <Link href="/docs" className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-pub-surface px-6 py-3 text-sm font-medium text-pub-text-main transition hover:border-zinc-600">
                {ctaSection.secondaryLabel}
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-pub-text-muted sm:grid-cols-2 xl:grid-cols-4">
              {socialProof.map((item) => (
                <div key={item} className="rounded-2xl border border-zinc-800 bg-pub-surface/70 px-4 py-3 text-center">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 rounded-3xl border border-zinc-800 bg-[#0d1117] shadow-2xl shadow-black/30">
            <div className="flex items-center gap-2 border-b border-zinc-800 bg-[#161b22] px-4 py-3 text-xs text-pub-text-muted">
              <span className="h-3 w-3 rounded-full bg-zinc-600" />
              <span className="h-3 w-3 rounded-full bg-zinc-600" />
              <span className="h-3 w-3 rounded-full bg-zinc-600" />
              <span className="ml-2 font-pub-mono">POST /v1/verify</span>
            </div>
            <div className="grid gap-px overflow-hidden rounded-b-3xl border-t border-zinc-800 md:grid-cols-2">
              <div className="bg-[#0f141b] p-5 sm:p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-pub-text-muted">Request</p>
                <pre className="mt-4 overflow-x-auto font-pub-mono text-xs leading-6 text-zinc-300 sm:text-sm">
{`curl -X POST https://api.resumeproof.online/v1/verify \\
  -H "x-api-key: rp_live_..." \\
  -F "githubUsername=torvalds" \\
  -F "resume=@/path/to/resume.pdf"`}
                </pre>
              </div>
              <div className="bg-[#0f141b] p-5 sm:p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-pub-text-muted">Response</p>
                <pre className="mt-4 overflow-x-auto font-pub-mono text-xs leading-6 text-zinc-300 sm:text-sm">
{`{
  "transactionId": "cm6v5a1bx000008j4c2m8f3z9",
  "trackingId": "req_f8b3c1a9e4d2",
  "status": "queued",
  "message": "Verification job queued. Webhook will fire when complete."
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20">
        <div className="flex flex-col gap-3 sm:items-start">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-pub-text-muted">How it works</p>
          <h2 className="font-pub-display text-3xl font-semibold tracking-tight sm:text-4xl">Three steps from upload to webhook.</h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {howItWorks.map((step, index) => (
            <div key={step} className="rounded-3xl border border-zinc-800 bg-pub-surface/70 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pub-accent/15 text-sm font-semibold text-pub-accent">
                0{index + 1}
              </div>
              <p className="mt-5 text-sm leading-7 text-pub-text-muted sm:text-base">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20">
        <div className="flex flex-col gap-3 sm:items-start">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-pub-text-muted">Feature grid</p>
          <h2 className="font-pub-display text-3xl font-semibold tracking-tight sm:text-4xl">Built for the checks hiring teams actually need.</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureGrid.map((feature) => (
            <article key={feature.title} className="rounded-3xl border border-zinc-800 bg-pub-surface/70 p-6">
              <h3 className="font-pub-display text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-pub-text-muted sm:text-base">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20">
        <div className="rounded-3xl border border-zinc-800 bg-pub-surface/60 p-6 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-pub-text-muted">Social proof</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {socialProof.map((item) => (
              <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-4 text-sm font-medium text-pub-text-main sm:text-center">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20">
        <div className="rounded-[2rem] border border-zinc-800 bg-[linear-gradient(135deg,rgba(99,102,241,0.18),rgba(9,9,11,0.95)_55%)] p-8 sm:p-10 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-pub-text-muted">Call to action</p>
            <h2 className="mt-4 font-pub-display text-3xl font-semibold tracking-tight sm:text-4xl">{ctaSection.headline}</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-pub-text-muted sm:text-lg">{ctaSection.subtext}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 lg:mt-0 lg:min-w-64">
            <Link href="/register" className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200">
              {ctaSection.primaryLabel}
            </Link>
            <Link href="/docs" className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950/40 px-6 py-3 text-sm font-medium text-pub-text-main transition hover:border-zinc-500">
              {ctaSection.secondaryLabel}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-800/70 py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 text-sm text-pub-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>ResumeProof API</p>
          <p>Built for teams that need a real signal before interviews.</p>
        </div>
      </footer>
    </main>
  );
}
