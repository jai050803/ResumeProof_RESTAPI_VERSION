import React from 'react';
import { MarketingNav } from '@/components/home/MarketingNav';
import { MarketingFooter } from '@/components/home/MarketingFooter';
import { Hero } from '@/components/home/Hero';
import { ProblemSection } from '@/components/home/ProblemSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-pub-bg text-pub-text-main selection:bg-pub-accent/30 font-sans">
      <MarketingNav />
      
      <Hero />
      
      <ProblemSection />
      
      <MarketingFooter />
    </main>
  );
}
