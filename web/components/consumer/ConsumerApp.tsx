'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Send, Check, RefreshCw, X, ArrowUpRight, Plus, 
  MessageSquare, Activity, Sparkles, Settings, 
  LogOut, ShieldCheck, Download, ExternalLink, Globe, ArrowDown
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MultimodalAnalysisResponse, RewriteOption, BehaviorSummary } from '../../types';
import { CheckinModal } from '../CheckinModal';
import { SettingsModal } from '../SettingsModal';
import { AuthModal } from '../auth/AuthModal';
import { getCurrentUser, signOutUser, getSupabaseAuthClient } from '../../lib/supabaseAuth';

const CONFLICT_PRESETS = [
  {
    id: 'client',
    tag: 'Angry Client',
    text: 'You made a massive mistake on our deployment and ruined our entire quarterly release.'
  },
  {
    id: 'coworker',
    tag: 'Coworker Blame',
    text: 'Why do you always ignore my messages and act so careless with our project deadlines?'
  },
  {
    id: 'boundary',
    tag: 'Boundary Setting',
    text: 'I am sick and tired of you dumping last-minute work on me every Friday evening without warning.'
  },
  {
    id: 'feedback',
    tag: 'Harsh Critique',
    text: 'Your contribution to this presentation was completely incompetent and embarrassed our team.'
  }
];

export const ConsumerApp: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'trends'>('overview');
  const [draft, setDraft] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MultimodalAnalysisResponse | null>(null);
  const [showIntervention, setShowIntervention] = useState(false);
  const [selectedRewrite, setSelectedRewrite] = useState<RewriteOption | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  // User state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // 20s cooling pause timer
  const [timerSeconds, setTimerSeconds] = useState(20);
  const [timerRunning, setTimerRunning] = useState(false);

  // Behavior summary state
  const [behaviorData, setBehaviorData] = useState<BehaviorSummary | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const sandboxRef = useRef<HTMLDivElement | null>(null);

  // User session tracking
  useEffect(() => {
    getCurrentUser().then((u) => setCurrentUser(u)).catch(() => {});

    try {
      const supabase = getSupabaseAuthClient();
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user || null);
      });
      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch {
      // Fallback gracefully
    }
  }, []);

  // Fetch behavior trends
  useEffect(() => {
    fetch('/api/behavior/summary')
      .then((r) => r.json())
      .then((d) => setBehaviorData(d))
      .catch(() => {});
  }, []);

  // Analysis worker
  const performAnalysis = async (text: string): Promise<MultimodalAnalysisResponse | null> => {
    if (!text.trim()) return null;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          behaviorContext: {
            stressScore: 0.75,
            sleepDeficitScore: 0.80,
            academicStrainScore: 0.70
          }
        })
      });
      const data: MultimodalAnalysisResponse = await res.json();
      setAnalysis(data);
      return data;
    } catch {
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Live background debounced check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!draft.trim()) {
      setAnalysis(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performAnalysis(draft);
    }, 700);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draft]);

  // Cooling timer countdown
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((s) => s - 1), 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const handleSelectPreset = async (presetText: string) => {
    setDraft(presetText);
    setSelectedRewrite(null);
    setSentSuccess(false);
    const result = await performAnalysis(presetText);
    if (result?.intervention?.triggered) {
      setShowIntervention(true);
      setTimerSeconds(20);
      setTimerRunning(true);
    }
  };

  const handleSend = async () => {
    if (!draft.trim() || isAnalyzing) return;

    const data = await performAnalysis(draft);

    if (data?.intervention?.triggered && !selectedRewrite) {
      setShowIntervention(true);
      setTimerSeconds(20);
      setTimerRunning(true);
      return;
    }

    setSentSuccess(true);
    setTimeout(() => {
      setDraft('');
      setAnalysis(null);
      setSelectedRewrite(null);
      setShowIntervention(false);
      setSentSuccess(false);
    }, 1800);
  };

  const applyRewrite = (rw: RewriteOption) => {
    setDraft(rw.text);
    setSelectedRewrite(rw);
    setShowIntervention(false);
    setTimerRunning(false);
    performAnalysis(rw.text);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setUserDropdownOpen(false);
  };

  const scrollToSandbox = () => {
    setActiveSection('overview');
    setTimeout(() => {
      sandboxRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getBreathingPhase = () => {
    const s = timerSeconds % 8;
    return s >= 4 ? 'Inhale slowly...' : 'Exhale gently...';
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] selection:bg-white selection:text-black">
      {/* 1. MINIMAL APPLE NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#000000]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-black font-bold text-[10px] tracking-tight">
              HL
            </div>
            <span className="text-[14px] font-medium tracking-tight text-white group-hover:text-zinc-300 transition-colors">
              HumanLens
            </span>
          </Link>

          {/* Clean Text Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-[13px] text-zinc-400">
            <button
              onClick={() => { setActiveSection('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`hover:text-white transition-colors ${activeSection === 'overview' ? 'text-white font-medium' : ''}`}
            >
              Overview
            </button>
            <button
              onClick={scrollToSandbox}
              className="hover:text-white transition-colors"
            >
              Sandbox
            </button>
            <button
              onClick={() => { setActiveSection('trends'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`hover:text-white transition-colors ${activeSection === 'trends' ? 'text-white font-medium' : ''}`}
            >
              Health Trends
            </button>
            <Link
              href="/research"
              className="hover:text-white transition-colors flex items-center space-x-1"
            >
              <span>Research</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-500" />
            </Link>
          </nav>

          {/* Right Action */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsExtensionModalOpen(true)}
              className="text-[12px] text-zinc-300 hover:text-white transition-colors hidden sm:inline"
            >
              Chrome Extension
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 py-1 px-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-xs transition-all"
                >
                  <div className="w-4 h-4 rounded-full bg-white text-black font-bold text-[9px] flex items-center justify-center">
                    {(currentUser.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <span className="max-w-[80px] truncate text-zinc-200">
                    {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 py-1.5 bg-[#121214] border border-white/[0.12] rounded-2xl shadow-2xl z-50 text-xs">
                    <div className="px-3 py-1 text-zinc-400 truncate border-b border-white/[0.06] mb-1">
                      {currentUser.email}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-white/[0.04] flex items-center space-x-2"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-all active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN CONSUMER VIEWS */}
      {activeSection === 'overview' ? (
        <main className="pt-28 sm:pt-36">
          {/* HERO SECTION */}
          <section className="max-w-4xl mx-auto px-6 text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-400 font-mono tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>HumanLens 1.0 • Communication Intelligence</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight text-white leading-[1.08]">
              Never send a message<br />you&apos;ll regret.
            </h1>

            <p className="text-lg sm:text-xl text-[#86868b] max-w-2xl mx-auto font-normal leading-relaxed">
              A real-time psychological firewall for high-stakes conversations across Gmail, Slack, and WhatsApp.
            </p>

            {/* Apple Minimal CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsExtensionModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-black text-[13px] font-semibold flex items-center justify-center space-x-2 transition-all shadow-xl active:scale-[0.98]"
              >
                <Globe className="w-4 h-4 text-black" />
                <span>Add to Chrome &mdash; Free</span>
              </button>

              <button
                onClick={scrollToSandbox}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white text-[13px] font-medium border border-white/[0.1] flex items-center justify-center space-x-2 transition-all"
              >
                <span>Try Interactive Sandbox</span>
                <ArrowDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>

            {/* VISUAL PRODUCT SHOWCASE (MOCKUP OF EXTENSION IN ACTION) */}
            <div className="pt-12 sm:pt-16 max-w-3xl mx-auto">
              <div className="rounded-3xl bg-[#0d0d0f] border border-white/[0.1] p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden">
                {/* Mock compose header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] text-xs text-zinc-400">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
                    <span className="text-zinc-400 font-mono ml-2">Slack &bull; #engineering-leads</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Protected by HumanLens
                  </span>
                </div>

                {/* Mock message before/after */}
                <div className="py-6 space-y-4">
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
                      <span>Original Impulsive Draft (Intercepted)</span>
                    </div>
                    <p className="text-sm sm:text-base text-zinc-400 line-through decoration-rose-500/60 font-mono leading-relaxed">
                      &ldquo;You completely screwed up our deployment and ignored everything I told you yesterday.&rdquo;
                    </p>
                  </div>

                  {/* Transformed rewrite */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-semibold text-[11px] tracking-tight">
                        &bull; Recommended De-escalation (Preserves Intent &amp; Accountability)
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">1-Tap Replaced</span>
                    </div>
                    <p className="text-sm sm:text-base text-zinc-100 font-normal leading-relaxed">
                      &ldquo;I have serious concerns about the stability of yesterday&apos;s rollout. Let&apos;s walk through what broke so we can prevent this on the next sprint.&rdquo;
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Stanford Behavioral Science &bull; Gottman De-escalation Protocol</span>
                  <span className="font-mono">Tension: 0.88 &rarr; 0.05</span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. INTERACTIVE SANDBOX SECTION */}
          <section ref={sandboxRef} id="sandbox" className="pt-32 pb-24 max-w-3xl mx-auto px-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                Interactive Sandbox
              </h2>
              <p className="text-sm text-zinc-400 max-w-md mx-auto">
                Test any sensitive email, Slack reply, or difficult message before sending.
              </p>
            </div>

            {/* Subtle Scenario Chips */}
            <div className="flex items-center justify-center flex-wrap gap-2 mb-4">
              {CONFLICT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.text)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] transition-all active:scale-95"
                >
                  {p.tag}
                </button>
              ))}
            </div>

            {/* Focused Composer Canvas */}
            <div className="rounded-3xl bg-[#09090b] border border-white/[0.1] p-6 sm:p-8 shadow-2xl transition-all relative">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4 text-xs">
                <span className="text-zinc-400 font-medium">
                  Draft Canvas
                </span>

                {analysis && (
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${analysis.intervention.triggered ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span className="text-zinc-300 font-medium">
                      {analysis.perception?.toneTag || (analysis.intervention.triggered ? 'Needs Reflection' : 'Clear & Constructive')}
                    </span>
                  </div>
                )}
              </div>

              <textarea
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (sentSuccess) setSentSuccess(false);
                }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSend();
                }}
                placeholder="Draft a difficult message to test its tone..."
                rows={5}
                className="w-full bg-transparent text-white placeholder-zinc-600 text-base sm:text-lg focus:outline-none resize-none leading-relaxed tracking-tight"
              />

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] mt-4">
                <span className="text-xs text-zinc-400 font-mono">
                  {draft.length} chars
                </span>

                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || isAnalyzing}
                  className={`px-5 py-2 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-30 ${
                    sentSuccess ? 'bg-emerald-400 text-black' : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : sentSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Protected</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Simulate Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* 4. APPLE BENTO GRID: 3 CORE PILLARS */}
          <section className="py-24 max-w-5xl mx-auto px-6 border-t border-white/[0.06]">
            <div className="text-center space-y-2 mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                Engineered for clarity under pressure.
              </h2>
              <p className="text-sm text-zinc-400 max-w-lg mx-auto">
                HumanLens pairs clinical conflict research with real-time browser intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="rounded-3xl bg-[#09090b] border border-white/[0.08] p-8 space-y-4 hover:border-white/20 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white">
                  <Globe className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  Seamless Keyboard Interception
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  No copy-pasting required. A discreet floating pill appears beside compose boxes in Gmail, Slack Web, and WhatsApp, defusing messages before you send.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-3xl bg-[#09090b] border border-white/[0.08] p-8 space-y-4 hover:border-white/20 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  Autonomic Regulation
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Grounded in Stanford neuroscience, the 20-second cooling pause activates physiological sigh downregulation to suppress autonomic fight-or-flight reactivity.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-3xl bg-[#09090b] border border-white/[0.08] p-8 space-y-4 hover:border-white/20 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  Zero-Knowledge Privacy
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Biometrics and facial action units are analyzed purely inside your local browser memory. Zero raw video, audio, or keystrokes are ever stored.
                </p>
              </div>
            </div>
          </section>
        </main>
      ) : (
        /* TRENDS VIEW (APPLE HEALTH STYLE) */
        <main className="pt-28 sm:pt-36 max-w-4xl mx-auto px-6 space-y-8 animate-fade-in pb-24">
          <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Behavioral Health Trends
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                How biological strain and sleep debt correlate with your communication friction.
              </p>
            </div>

            <button
              onClick={() => setIsCheckinOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Today</span>
            </button>
          </div>

          {/* Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#09090b] border border-white/[0.08] p-4 space-y-1">
              <span className="text-[11px] font-mono uppercase text-zinc-400">Sleep Average</span>
              <div className="text-2xl font-semibold text-white">
                {behaviorData?.avgSleep || 5.7}<span className="text-xs font-normal text-zinc-400 ml-1">hrs</span>
              </div>
              <p className="text-[11px] text-zinc-400">-1.3h under personal target</p>
            </div>

            <div className="rounded-2xl bg-[#09090b] border border-white/[0.08] p-4 space-y-1">
              <span className="text-[11px] font-mono uppercase text-zinc-400">Stress Level</span>
              <div className="text-2xl font-semibold text-white">
                {behaviorData?.avgStress || 6.9}<span className="text-xs font-normal text-zinc-400 ml-1">/10</span>
              </div>
              <p className="text-[11px] text-zinc-400">Peak observed mid-week</p>
            </div>

            <div className="rounded-2xl bg-[#09090b] border border-white/[0.08] p-4 space-y-1">
              <span className="text-[11px] font-mono uppercase text-zinc-400">Daily Affect</span>
              <div className="text-2xl font-semibold text-white">
                {behaviorData?.avgMood || 2.6}<span className="text-xs font-normal text-zinc-400 ml-1">/5</span>
              </div>
              <p className="text-[11px] text-zinc-400">Moderate fluctuation</p>
            </div>

            <div className="rounded-2xl bg-[#09090b] border border-white/[0.08] p-4 space-y-1">
              <span className="text-[11px] font-mono uppercase text-zinc-400">Impulse Risk</span>
              <div className="text-2xl font-semibold text-white">
                Elevated
              </div>
              <p className="text-[11px] text-zinc-400">Higher friction probability</p>
            </div>
          </div>

          {/* Area Chart */}
          <div className="rounded-3xl bg-[#09090b] border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Stress &amp; Sleep Correlation (7 Days)</span>
              <div className="flex items-center space-x-4 text-[11px] text-zinc-400 font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-white"></span> Stress</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-zinc-500"></span> Sleep</span>
              </div>
            </div>

            <div className="h-60 w-full">
              {behaviorData?.trends && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={behaviorData.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cStress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cSleep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#71717a" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={11} tickLine={false} domain={[0, 10]} />
                    <Tooltip
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-2.5 rounded-xl bg-[#18181b] border border-white/20 text-xs space-y-1 shadow-2xl">
                              <div className="font-medium text-white">{label}</div>
                              <div className="text-zinc-300 font-mono">Stress: {payload[0]?.value} / 10</div>
                              <div className="text-zinc-400 font-mono">Sleep: {payload[1]?.value} hrs</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="stress" stroke="#ffffff" strokeWidth={1.5} fillOpacity={1} fill="url(#cStress)" />
                    <Area type="monotone" dataKey="sleep" stroke="#71717a" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={1} fill="url(#cSleep)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </main>
      )}

      {/* 5. MINIMAL DE-ESCALATION OVERLAY */}
      {showIntervention && analysis?.intervention && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-[#0d0d0f] p-7 sm:p-8 space-y-6 max-h-[88vh] overflow-y-auto border border-white/[0.14] shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                  Communication Buffer
                </span>
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  Pause &amp; Reflect
                </h2>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-md pt-0.5">
                  {analysis.perception?.recipientImpact}
                </p>
              </div>

              <button
                onClick={() => setShowIntervention(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 20s Cooling Pause */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                  <span className="text-base font-mono font-medium text-white">
                    {timerSeconds}s
                  </span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    {timerSeconds > 0 ? getBreathingPhase() : 'Pause complete'}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    20s Cooling Pause &bull; Box Breathing
                  </div>
                </div>
              </div>

              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="px-3 py-1 rounded-full text-[11px] font-medium text-zinc-300 hover:text-white bg-white/[0.05] border border-white/10"
              >
                {timerRunning ? 'Pause' : 'Resume'}
              </button>
            </div>

            {/* Rewrites */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                Constructive Alternatives (1-Tap Replace)
              </span>

              {analysis.intervention.rewrites.map((rw, i) => (
                <div
                  key={i}
                  onClick={() => applyRewrite(rw)}
                  className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-300 mb-1">
                    <span>{rw.style}</span>
                    <span className="text-[11px] text-zinc-400 group-hover:text-white flex items-center gap-0.5">
                      Apply <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed font-normal">
                    &ldquo;{rw.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs">
              <span className="text-[11px] text-zinc-400">
                You maintain complete autonomy to send your original.
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowIntervention(false);
                    setSentSuccess(true);
                    setTimeout(() => {
                      setDraft('');
                      setAnalysis(null);
                      setSelectedRewrite(null);
                      setSentSuccess(false);
                    }, 1800);
                  }}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white transition-colors"
                >
                  Send Original
                </button>
                <button
                  onClick={() => setShowIntervention(false)}
                  className="px-4 py-1.5 rounded-full font-semibold bg-white text-black hover:bg-zinc-200 transition-all"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. CHROME EXTENSION MODAL */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0d0d0f] p-7 space-y-5 border border-white/[0.12] shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white">
                  <Globe className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">HumanLens for Chrome</h3>
                  <p className="text-xs text-zinc-400">Real-time typing de-escalation</p>
                </div>
              </div>
              <button
                onClick={() => setIsExtensionModalOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5 text-xs text-zinc-300 leading-relaxed">
              <div className="font-semibold text-white">Setup in 3 Steps:</div>
              <ol className="list-decimal list-inside space-y-1.5 text-zinc-400">
                <li>Open Chrome: <code className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white font-mono">chrome://extensions</code></li>
                <li>Turn on <strong>Developer Mode</strong> (top-right).</li>
                <li>Click <strong>Load unpacked</strong> and select the <code className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white font-mono">extension</code> folder from your project.</li>
              </ol>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-400">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Active across Gmail, Slack Web &amp; WhatsApp Web</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Pre-wired to your live cloud API</span>
              </div>
            </div>

            <button
              onClick={() => setIsExtensionModalOpen(false)}
              className="w-full py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Daily Check-in Modal */}
      <CheckinModal
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        onCheckinSuccess={() => {}}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey=""
        onSaveApiKey={() => {}}
      />

      {/* Supabase Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />

      {/* 7. APPLE MINIMAL FOOTER */}
      <footer className="mt-32 border-t border-white/[0.06] max-w-5xl mx-auto w-full px-6 py-10 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
        <div className="flex items-center space-x-3">
          <span>&copy; {new Date().getFullYear()} HumanLens AI</span>
          <span>&bull;</span>
          <span>Zero Keystroke Logging</span>
        </div>

        <Link
          href="/research"
          className="flex items-center space-x-1 text-zinc-400 hover:text-white transition-colors font-mono text-[11px]"
        >
          <span>Research &amp; ML Evaluation Studio</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </footer>
    </div>
  );
};
