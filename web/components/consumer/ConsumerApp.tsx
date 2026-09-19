'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Send, Check, RefreshCw, X, ArrowUpRight, Plus, 
  MessageSquare, Activity, Sparkles, Settings, 
  LogOut, ShieldCheck, Download, ExternalLink, Globe, 
  Sun, Moon, Copy, Camera, Mic, Sliders, ChevronRight, User as UserIcon
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MultimodalAnalysisResponse, RewriteOption, BehaviorSummary, ChatMessage } from '../../types';
import { CheckinModal } from '../CheckinModal';
import { SettingsModal } from '../SettingsModal';
import { getCurrentUser, signOutUser, getSupabaseAuthClient } from '../../lib/supabaseAuth';
import { LandingPage } from './LandingPage';

const CONFLICT_PRESETS = [
  {
    id: 'client',
    tag: '⚡ Angry Client',
    text: 'You made a massive mistake on our deployment and ruined our entire quarterly release.'
  },
  {
    id: 'coworker',
    tag: '🛡️ Coworker Blame',
    text: 'Why do you always ignore my messages and act so careless with our project deadlines?'
  },
  {
    id: 'boundary',
    tag: '⏱️ Boundary Setting',
    text: 'I am sick and tired of you dumping last-minute work on me every Friday evening without warning.'
  },
  {
    id: 'feedback',
    tag: '💬 Harsh Critique',
    text: 'Your contribution to this presentation was completely incompetent and embarrassed our team.'
  }
];

export const ConsumerApp: React.FC = () => {
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'workspace' | 'trends' | 'coach'>('workspace');
  const [draft, setDraft] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MultimodalAnalysisResponse | null>(null);
  const [showIntervention, setShowIntervention] = useState(false);
  const [selectedRewrite, setSelectedRewrite] = useState<RewriteOption | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [showAdminFeatures, setShowAdminFeatures] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('admin=true')) {
      setShowAdminFeatures(true);
    }
  }, []);

  // Multimodal Sensor Toggles
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [stressContextScore, setStressContextScore] = useState(0.70);

  // User state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // 20s cooling pause timer
  const [timerSeconds, setTimerSeconds] = useState(20);
  const [timerRunning, setTimerRunning] = useState(false);

  // Session History Log
  const [historyLogs, setHistoryLogs] = useState<Array<{ original: string; rewrite: string; time: string }>>([]);

  // Behavior summary state
  const [behaviorData, setBehaviorData] = useState<BehaviorSummary | null>(null);

  // Coach chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'I am your HumanLens Reflection Coach. If you are experiencing workplace friction or drafting a sensitive message, ask me how to respond constructively.',
      timestamp: 'Now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Theme synchronization
  useEffect(() => {
    const savedTheme = localStorage.getItem('hl_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('hl_theme', next);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(next);
  };

  // User session tracking
  useEffect(() => {
    getCurrentUser()
      .then((u) => setCurrentUser(u))
      .catch(() => {})
      .finally(() => setAuthReady(true));

    try {
      const supabase = getSupabaseAuthClient();
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user || null);
        setAuthReady(true);
      });
      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch {
      setAuthReady(true); // Fallback gracefully
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
            stressScore: stressContextScore,
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
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draft, stressContextScore]);

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
    if (selectedRewrite) {
      setHistoryLogs((prev) => [
        { original: draft, rewrite: selectedRewrite.text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ...prev.slice(0, 4)
      ]);
    }

    setTimeout(() => {
      setDraft('');
      setAnalysis(null);
      setSelectedRewrite(null);
      setShowIntervention(false);
      setSentSuccess(false);
    }, 1600);
  };

  const applyRewrite = (rw: RewriteOption) => {
    setDraft(rw.text);
    setSelectedRewrite(rw);
    setShowIntervention(false);
    setTimerRunning(false);
    performAnalysis(rw.text);
  };

  const handleCopyRewrite = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setUserDropdownOpen(false);
    router.push('/login');
  };

  // Chat send
  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: 'Now'
    };
    setMessages((prev) => [...prev, userMsg]);
    const toSend = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: toSend })
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply || 'Let us step back and look at the underlying needs behind this message.',
          timestamp: 'Now',
          citations: data.citations
        }
      ]);
    } catch {
    } finally {
      setChatLoading(false);
    }
  };

  const getBreathingPhase = () => {
    const s = timerSeconds % 8;
    return s >= 4 ? 'Inhale slowly...' : 'Exhale gently...';
  };

  // ── Auth gate ──
  // While we check if the user is logged in, show a minimal loading screen
  if (!authReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 rounded-[14px] bg-white/[0.07] border border-white/[0.1] flex items-center justify-center">
            <span className="text-white font-semibold text-sm">HL</span>
          </div>
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Not signed in → show the landing/marketing page
  if (!currentUser) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* ── Ambient background (matches landing page) ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-white/[0.025] blur-[120px]" />
      </div>

      {/* ── NAVBAR ── */}
      <header className="relative z-50 sticky top-0 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-7 h-7 rounded-[10px] bg-white flex items-center justify-center text-black font-bold text-[11px]">
                HL
              </div>
              <span className="text-[14px] font-semibold tracking-tight text-white">HumanLens</span>
            </Link>
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ML Active</span>
            </span>
          </div>

          {/* Nav tabs */}
          <nav className="flex items-center p-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
            {[
              { id: 'workspace', label: 'Workspace', Icon: MessageSquare },
              { id: 'trends',    label: 'Trends',    Icon: Activity },
              { id: 'coach',     label: 'Coach',     Icon: Sparkles },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  activeTab === id
                    ? 'bg-white text-black shadow-sm'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center space-x-2">
            {showAdminFeatures && (
              <button
                onClick={() => setIsExtensionModalOpen(true)}
                className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-white/40 hover:text-white border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Extension</span>
              </button>
            )}

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-white text-black font-bold text-[10px] flex items-center justify-center shrink-0">
                  {(currentUser.email?.[0] || 'U').toUpperCase()}
                </div>
                <span className="max-w-[80px] truncate text-white/70 text-[12px] font-medium">
                  {currentUser.user_metadata?.full_name?.split(' ')[0] || currentUser.email?.split('@')[0]}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 py-2 bg-[#111113] border border-white/[0.1] rounded-2xl shadow-2xl z-50 text-xs animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-white/[0.06] space-y-0.5">
                    <div className="font-medium text-white truncate">{currentUser.email}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">Authenticated</div>
                  </div>
                  <div className="px-2 py-1.5 space-y-0.5">
                    {showAdminFeatures && (
                      <button
                        onClick={() => { setIsSettingsOpen(true); setUserDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left text-white/50 hover:text-white hover:bg-white/[0.05] rounded-xl flex items-center space-x-2 transition-all"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>AI Settings</span>
                      </button>
                    )}
                    {showAdminFeatures && (
                      <Link
                        href="/research"
                        className="w-full px-3 py-2 text-left text-white/50 hover:text-white hover:bg-white/[0.05] rounded-xl flex items-center space-x-2 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Research Studio</span>
                      </Link>
                    )}
                  </div>
                  <div className="px-2 pt-1 border-t border-white/[0.06]">
                    <button
                      onClick={handleSignOut}
                      className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center space-x-2 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── WORKSPACE TAB ── */}
      {activeTab === 'workspace' && (
        <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 py-10 space-y-6 animate-fade-in">

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-white">
                De-escalation Workspace
              </h1>
              <p className="text-[13px] text-white/35 mt-1">
                Draft, analyze, and defuse sensitive messages in real time.
              </p>
            </div>

            {/* Scenario pills */}
            <div className="flex items-center flex-wrap gap-2">
              {CONFLICT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.text)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white border border-white/[0.07] transition-all"
                >
                  {p.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

            {/* Left — Composer */}
            <div className="lg:col-span-7 space-y-3">
              {/* Draft card */}
              <div className="rounded-3xl bg-white/[0.04] border border-white/[0.08] p-5 sm:p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4 text-xs">
                  <span className="text-white/30 font-medium tracking-wide uppercase text-[11px]">Draft</span>
                  {analysis && (
                    <div className="flex items-center space-x-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${analysis.intervention.triggered ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
                      <span className="text-white/60 font-medium">
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
                  placeholder="Type an email, Slack reply, or difficult message…"
                  rows={7}
                  className="w-full bg-transparent text-white placeholder-white/20 text-[14px] focus:outline-none resize-none leading-relaxed"
                />

                <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setCameraActive(!cameraActive)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                        cameraActive
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                          : 'bg-white/[0.04] border-white/[0.08] text-white/35 hover:text-white'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Face {cameraActive ? 'On' : 'Off'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMicActive(!micActive)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                        micActive
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                          : 'bg-white/[0.04] border-white/[0.08] text-white/35 hover:text-white'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Voice {micActive ? 'On' : 'Off'}</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] text-white/20 font-mono">{draft.length}</span>
                    <button
                      onClick={handleSend}
                      disabled={!draft.trim() || isAnalyzing}
                      className={`px-5 py-2 rounded-full text-[12px] font-semibold flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-25 ${
                        sentSuccess
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10'
                      }`}
                    >
                      {isAnalyzing ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Analyzing…</span></>
                      ) : sentSuccess ? (
                        <><Check className="w-3.5 h-3.5" /><span>Protected</span></>
                      ) : (
                        <><Send className="w-3.5 h-3.5" /><span>Analyze & Defuse</span></>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stress slider */}
              <div className="px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-3.5 h-3.5 text-white/25" />
                  <span className="text-[12px] text-white/40 font-medium">Context Stress Level</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.1" max="1.0" step="0.05"
                    value={stressContextScore}
                    onChange={(e) => setStressContextScore(parseFloat(e.target.value))}
                    className="w-24 accent-white cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                  />
                  <span className="font-mono text-white/50 text-[12px] w-8 text-right">
                    {Math.round(stressContextScore * 100)}%
                  </span>
                </div>
              </div>

              {/* History */}
              {historyLogs.length > 0 && (
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/60 font-semibold tracking-wide uppercase">Recent Transforms</span>
                    <span className="text-white/25 font-mono">{historyLogs.length} protected</span>
                  </div>
                  <div className="space-y-2">
                    {historyLogs.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="line-through text-rose-400/60 truncate max-w-[70%]">&ldquo;{item.original}&rdquo;</span>
                          <span className="font-mono text-white/20 shrink-0">{item.time}</span>
                        </div>
                        <div className="text-[12px] text-white/70">&ldquo;{item.rewrite}&rdquo;</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right — Analysis panel */}
            <div className="lg:col-span-5">
              {analysis?.intervention ? (
                <div className="rounded-3xl bg-white/[0.04] border border-white/[0.08] p-6 space-y-5 animate-fade-in backdrop-blur-sm">
                  {/* Perception banner */}
                  <div className="pb-4 border-b border-white/[0.06] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-widest uppercase text-white/25">Perception</span>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold">
                        {analysis.riskLevel}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-white">{analysis.perception?.toneTag}</h3>
                    <p className="text-[12px] text-white/40 leading-relaxed">{analysis.perception?.recipientImpact}</p>
                  </div>

                  {/* Breathing timer */}
                  <div className="px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center font-mono font-bold text-white text-[13px]">
                        {timerSeconds}s
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold text-white">
                          {timerSeconds > 0 ? getBreathingPhase() : 'Pause complete'}
                        </div>
                        <div className="text-[10px] text-white/25 font-mono">Physiological downregulation</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setTimerRunning(!timerRunning)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-medium text-white/40 hover:text-white bg-white/[0.05] border border-white/[0.08] transition-all"
                    >
                      {timerRunning ? 'Pause' : 'Resume'}
                    </button>
                  </div>

                  {/* Rewrites */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/30 font-semibold tracking-widest uppercase">Alternatives</span>
                      <span className="text-white/20 font-mono">Stanford · Gottman</span>
                    </div>
                    {analysis.intervention.rewrites.map((rw, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all space-y-2 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-emerald-400">{rw.style}</span>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleCopyRewrite(rw.text, i)}
                              className="text-white/25 hover:text-white transition-colors"
                            >
                              {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => applyRewrite(rw)}
                              className="text-[11px] text-white/30 hover:text-white font-medium transition-colors"
                            >
                              Apply →
                            </button>
                          </div>
                        </div>
                        <p className="text-[12px] text-white/60 leading-relaxed">&ldquo;{rw.text}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl bg-white/[0.03] border border-white/[0.07] p-8 text-center space-y-4 backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-white mb-1">Live Buffer Ready</h3>
                    <p className="text-[12px] text-white/30 leading-relaxed max-w-[200px] mx-auto">
                      Type a message. The ML engine will analyze tone automatically.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ── TRENDS TAB ── */}
      {activeTab === 'trends' && (
        <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 py-10 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-white">Behavioral Trends</h1>
              <p className="text-[13px] text-white/35 mt-1">Stress, sleep, and communication friction over time.</p>
            </div>
            <button
              onClick={() => setIsCheckinOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white text-black text-[12px] font-semibold hover:bg-white/90 transition-all active:scale-95 shadow-lg shadow-white/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Today</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Sleep Avg', value: `${behaviorData?.avgSleep || 5.7}`, unit: 'hrs', note: '-1.3h under target' },
              { label: 'Stress',    value: `${behaviorData?.avgStress || 6.9}`, unit: '/10', note: 'Peak mid-week' },
              { label: 'Affect',    value: `${behaviorData?.avgMood || 2.6}`, unit: '/5', note: 'Moderate flux' },
              { label: 'Impulse',   value: 'High', unit: '', note: 'Higher friction risk' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-white/25 tracking-wider">{stat.label}</span>
                <div className="text-2xl font-semibold text-white">
                  {stat.value}<span className="text-xs font-normal text-white/25 ml-1">{stat.unit}</span>
                </div>
                <p className="text-[11px] text-white/25">{stat.note}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-3xl bg-white/[0.04] border border-white/[0.07] p-6 space-y-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-white/70">Stress & Sleep Correlation (7 Days)</span>
              <div className="flex items-center space-x-4 text-[11px] text-white/25 font-mono">
                <span className="flex items-center gap-1.5"><span className="w-4 h-px bg-white/60" /> Stress</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-px bg-white/25" /> Sleep</span>
              </div>
            </div>
            <div className="h-64 w-full">
              {behaviorData?.trends && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={behaviorData.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gStress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gSleep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.06} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} domain={[0, 10]} />
                    <Tooltip
                      content={({ active, payload, label }: any) => {
                        if (active && payload?.length) return (
                          <div className="p-3 rounded-xl bg-[#111] border border-white/10 text-xs space-y-1 shadow-xl">
                            <div className="font-semibold text-white">{label}</div>
                            <div className="text-white/50 font-mono">Stress: {payload[0]?.value}/10</div>
                            <div className="text-white/30 font-mono">Sleep: {payload[1]?.value}hrs</div>
                          </div>
                        );
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="stress" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} fillOpacity={1} fill="url(#gStress)" />
                    <Area type="monotone" dataKey="sleep" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={1} fill="url(#gSleep)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ── COACH TAB ── */}
      {activeTab === 'coach' && (
        <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-5 sm:px-8 py-10 flex flex-col h-[82vh] animate-fade-in">
          <div className="text-center pb-5 border-b border-white/[0.06] mb-4">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Reflection Coach</h1>
            <p className="text-[13px] text-white/35 mt-1">Evidence-based communication advisor.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-white text-black rounded-tr-sm'
                    : 'bg-white/[0.05] border border-white/[0.08] text-white/80 rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] w-fit">
                {[0, 200, 400].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="pt-3">
            <div className="rounded-full bg-white/[0.05] border border-white/[0.1] p-1.5 pl-5 pr-1.5 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                placeholder="Describe a tense message or disagreement…"
                className="flex-1 bg-transparent text-[13px] text-white placeholder-white/25 focus:outline-none"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || chatLoading}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all disabled:opacity-25 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ── MODALS ── */}
      <CheckinModal isOpen={isCheckinOpen} onClose={() => setIsCheckinOpen(false)} onCheckinSuccess={() => {}} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} apiKey="" onSaveApiKey={() => {}} />

      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#111113] border border-white/[0.1] p-7 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-white">HumanLens for Chrome</h3>
                  <p className="text-[12px] text-white/35">Real-time de-escalation in the browser</p>
                </div>
              </div>
              <button onClick={() => setIsExtensionModalOpen(false)} className="p-1.5 rounded-full text-white/30 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2.5 text-[12px] text-white/50 leading-relaxed">
              <div className="font-semibold text-white/70">Setup in 3 steps</div>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Open Chrome → <code className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white font-mono text-[11px]">chrome://extensions</code></li>
                <li>Enable <strong className="text-white/70">Developer Mode</strong></li>
                <li>Click <strong className="text-white/70">Load unpacked</strong> → select the <code className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white font-mono text-[11px]">extension</code> folder</li>
              </ol>
            </div>
            <button
              onClick={() => setIsExtensionModalOpen(false)}
              className="w-full py-3 rounded-full bg-white text-black font-semibold text-[13px] hover:bg-white/90 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/[0.06] max-w-6xl mx-auto w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-[11px] text-white/20">
          <div className="w-4 h-4 rounded-md bg-white flex items-center justify-center text-black font-bold text-[8px]">HL</div>
          <span>© {new Date().getFullYear()} HumanLens AI · Zero Keystroke Logging</span>
        </div>
        {showAdminFeatures && (
          <Link
            href="/research"
            className="text-[11px] text-white/20 hover:text-white/60 transition-colors font-mono flex items-center space-x-1"
          >
            <span>Research Studio</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </footer>
    </div>
  );
};

