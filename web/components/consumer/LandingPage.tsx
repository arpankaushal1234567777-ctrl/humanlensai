'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Brain, ShieldCheck, Activity, MessageSquare,
  Sparkles, Lock, Zap, Eye
} from 'lucide-react';

// Blurred "teaser" card — shows a glimpse but keeps it mysterious
const TeaserCard = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden group">
    {/* Locked overlay */}
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-md bg-black/40">
      <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center mb-2">
        <Lock className="w-3.5 h-3.5 text-white/50" />
      </div>
      <span className="text-white/40 text-[11px] font-medium">{label}</span>
    </div>
    {/* Blurred content behind */}
    <div className="opacity-40 pointer-events-none select-none">
      {children}
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">

      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-white/[0.025] blur-[130px]" />
        <div className="absolute top-[40%] left-[-200px] w-[500px] h-[500px] rounded-full bg-sky-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-violet-500/[0.04] blur-[120px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-50 flex items-center justify-between px-6 sm:px-10 py-5 max-w-6xl mx-auto">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-[10px] bg-white flex items-center justify-center text-black font-bold text-[11px]">
            HL
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">HumanLens</span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="text-[13px] text-white/50 hover:text-white transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-all active:scale-95 shadow-lg shadow-white/10"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-20 max-w-3xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.05] text-[12px] text-white/50 font-mono mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time AI · Runs locally · No data stored</span>
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-6 animate-fade-in"
          style={{ animationDelay: '80ms' }}
        >
          Stop sending<br />
          <span className="text-white/30">messages you&apos;ll regret.</span>
        </h1>

        {/* Subtext */}
        <p
          className="text-[16px] sm:text-[18px] text-white/40 leading-relaxed max-w-xl mb-10 animate-fade-in"
          style={{ animationDelay: '140ms' }}
        >
          HumanLens reads the emotional tone of your message in real time —
          and gives you a moment to breathe, reflect, and rewrite before you send.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in"
          style={{ animationDelay: '200ms' }}
        >
          <Link
            href="/signup"
            className="flex items-center space-x-2 px-6 py-3.5 rounded-full bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-all active:scale-95 shadow-xl shadow-white/10"
          >
            <span>Start for free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center space-x-2 px-6 py-3.5 rounded-full border border-white/[0.12] bg-white/[0.04] text-white text-[14px] font-medium hover:bg-white/[0.08] transition-all"
          >
            <span>Sign in</span>
          </Link>
        </div>

        <p className="mt-4 text-[12px] text-white/20 animate-fade-in" style={{ animationDelay: '240ms' }}>
          Free forever · No credit card · Works in your browser
        </p>
      </section>

      {/* ── Blurred App Preview ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        {/* Section label */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2 text-[12px] text-white/30 border border-white/[0.08] rounded-full px-4 py-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Sign in to unlock the full workspace</span>
          </div>
        </div>

        {/* Main teaser grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Big workspace teaser */}
          <TeaserCard label="De-escalation Workspace">
            <div className="p-5 space-y-3">
              <div className="text-xs text-white/40 font-mono">Draft Input Canvas</div>
              <div className="h-24 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-end p-3">
                <span className="text-white/20 text-xs">Type an email, Slack reply, or difficult message...</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <div className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.06] text-[10px] text-white/30">Face AUs Off</div>
                  <div className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.06] text-[10px] text-white/30">Voice Off</div>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white/[0.08] text-[10px] text-white/40 flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>Analyze & Defuse</span>
                </div>
              </div>
            </div>
          </TeaserCard>

          {/* Right column — two stacked cards */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <TeaserCard label="Emotional Score">
              <div className="p-5 space-y-2">
                <div className="text-[10px] text-white/30 font-mono">TONE ANALYSIS</div>
                <div className="flex items-end space-x-1 h-10">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm bg-white/10" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="text-xs text-white/20">Escalation risk: high</div>
              </div>
            </TeaserCard>
            <TeaserCard label="Behavioral Trends">
              <div className="p-5 space-y-2">
                <div className="text-[10px] text-white/30 font-mono">7-DAY WELLNESS</div>
                <div className="space-y-1.5">
                  {['Empathy', 'Reactivity', 'Clarity'].map((l) => (
                    <div key={l} className="flex items-center space-x-2">
                      <span className="text-[10px] text-white/20 w-16">{l}</span>
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full">
                        <div className="h-full rounded-full bg-white/20" style={{ width: `${Math.random() * 40 + 40}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TeaserCard>
          </div>

          {/* Coach teaser */}
          <div className="md:col-span-2">
            <TeaserCard label="Reflection Coach">
              <div className="p-5 space-y-3 h-full">
                <div className="text-[10px] text-white/30 font-mono">AI COACH</div>
                <div className="space-y-2">
                  <div className="flex justify-start">
                    <div className="bg-white/[0.06] rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] text-white/30 max-w-[85%]">
                      I&apos;m your HumanLens Reflection Coach. How can I help?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-white/[0.1] rounded-2xl rounded-tr-sm px-3 py-2 text-[11px] text-white/30 max-w-[85%]">
                      My coworker keeps ignoring my messages…
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white/[0.06] rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] text-white/30 max-w-[85%]">
                      Let&apos;s look at the underlying need here...
                    </div>
                  </div>
                </div>
              </div>
            </TeaserCard>
          </div>
        </div>
      </section>

      {/* ── 3 value props ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: Brain,
              title: 'Reads between the lines',
              desc: 'Detects escalation, blame-shifting, and emotional charge before you hit send.',
            },
            {
              icon: ShieldCheck,
              title: 'Intervenes in the moment',
              desc: 'A 20-second breathing pause with rewritten alternatives — not a lecture.',
            },
            {
              icon: Activity,
              title: 'Tracks patterns over time',
              desc: 'Weekly communication health reports so you grow, not just react.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white/50" />
                </div>
                <h3 className="text-[15px] font-semibold text-white/80 tracking-tight">{item.title}</h3>
                <p className="text-[13px] text-white/35 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pb-24">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white/80 mb-4">
          Ready to communicate better?
        </h2>
        <p className="text-white/35 text-[15px] mb-8 max-w-sm">
          It takes 30 seconds to set up. No integrations required.
        </p>
        <Link
          href="/signup"
          className="flex items-center space-x-2 px-7 py-4 rounded-full bg-white text-black text-[15px] font-semibold hover:bg-white/90 transition-all active:scale-95 shadow-2xl shadow-white/10"
        >
          <span>Create free account</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-6 max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center text-black font-bold text-[9px]">HL</div>
          <span className="text-white/25 text-[12px]">© 2026 HumanLens AI</span>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] text-white/20">
          <Lock className="w-3 h-3" />
          <span>Zero keystroke logging · End-to-end encrypted</span>
        </div>
      </footer>
    </div>
  );
};
