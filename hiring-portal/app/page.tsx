import { HomeHero } from "@/components/home/HomeHero";
import { HomeHighlights } from "@/components/home/HomeHighlights";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <HomeHero />
      <HomeHighlights />
    </main>
  );
}
