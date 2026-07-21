const highlights = [
  { label: "GitHub Verified", icon: "🔍" },
  { label: "AI Analysis", icon: "🤖" },
  { label: "Instant Results", icon: "⚡" },
];

export function HomeHighlights() {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center shadow-xl shadow-black/10 backdrop-blur"
          >
            <div className="mb-2 text-3xl">{item.icon}</div>
            <div className="text-sm font-medium text-slate-300">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}