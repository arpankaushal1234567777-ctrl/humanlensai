'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Send, Check, RefreshCw, X, ArrowUpRight, Plus, Moon, Brain, 
  MessageSquare, Activity, Sparkles, Settings, User as UserIcon, 
  LogOut, ShieldCheck, Download, AlertTriangle, ChevronRight,
  ExternalLink, Globe, Zap
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MultimodalAnalysisResponse, RewriteOption, BehaviorSummary, ChatMessage } from '../../types';
import { CheckinModal } from '../CheckinModal';
import { SettingsModal } from '../SettingsModal';
import { AuthModal } from '../auth/AuthModal';
import { getCurrentUser, signOutUser, getSupabaseAuthClient } from '../../lib/supabaseAuth';

interface ConsumerAppProps {
  apiKey?: string;
  onSaveApiKey?: (key: string) => void;
  onSwitchToDev?: () => void;
}

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
    tag: '⏱️ Boundary Pushback',
    text: 'I am sick and tired of you dumping last-minute work on me every Friday evening without warning.'
  },
  {
    id: 'feedback',
    tag: '💬 Harsh Critique',
    text: 'Your contribution to this presentation was completely incompetent and embarrassed our team.'
  }
];

export const ConsumerApp: React.FC<ConsumerAppProps> = ({ apiKey, onSaveApiKey }) => {
  const [activeTab, setActiveTab] = useState<'write' | 'trends' | 'coach'>('write');
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

  // Coach chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'I am your HumanLens Reflection Coach. If you are experiencing workplace friction or drafting a sensitive email, paste it here and I will help you communicate with clarity and boundary.',
      timestamp: 'Now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initial user fetch & auth listener
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
          geminiApiKey: apiKey,
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

  // Live silent background tone check
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

  // Handle Preset Select
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

  // Intercepting Send
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
        body: JSON.stringify({ message: toSend, geminiApiKey: apiKey })
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

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Sleek Floating Apple Header */}
      <header className="sticky top-4 z-40 w-full max-w-5xl mx-auto px-4">
        <div className="apple-panel rounded-full px-4 sm:px-5 py-2 flex items-center justify-between shadow-2xl transition-all border border-white/[0.08]">
          {/* Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-black font-bold text-xs tracking-tight shadow-md">
              HL
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold tracking-tight text-white leading-tight">
                HumanLens
              </span>
              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline leading-none">
                AI Conflict Firewall
              </span>
            </div>
          </div>

          {/* 3 Main Navigation Tabs */}
          <nav className="flex items-center p-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('write')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'write' ? 'bg-white text-black shadow-sm font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('trends')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'trends' ? 'bg-white text-black shadow-sm font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Trends</span>
            </button>

            <button
              onClick={() => setActiveTab('coach')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'coach' ? 'bg-white text-black shadow-sm font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coach</span>
            </button>
          </nav>

          {/* Right Controls: User Auth, Extension Button, Log Day & Settings */}
          <div className="flex items-center space-x-2">
            {/* Chrome Extension Pill */}
            <button
              onClick={() => setIsExtensionModalOpen(true)}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Extension</span>
            </button>

            {/* Daily Check-in */}
            <button
              onClick={() => setIsCheckinOpen(true)}
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.08] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Check-in</span>
            </button>

            {/* Settings Gear */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Cloud & ML Settings"
              className="p-1.5 rounded-full text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Supabase User Authentication */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                    {(currentUser.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <span className="text-[11px] text-zinc-200 hidden sm:inline max-w-[90px] truncate">
                    {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-[#121215] border border-white/[0.1] rounded-2xl shadow-2xl z-50 animate-fade-in text-xs">
                    <div className="px-3 py-1.5 border-b border-white/[0.06] text-zinc-400">
                      <div className="font-semibold text-white truncate">{currentUser.email}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">Protected Account</div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-3 py-2 text-left text-rose-400 hover:bg-white/[0.04] flex items-center space-x-2 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all shadow-sm active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONSUMER VIEWS */}
      <main className="flex-1 px-4 sm:px-6">
        {/* 1. CONFLICT SIMULATOR & WORKSPACE */}
        {activeTab === 'write' && (
          <div className="w-full max-w-3xl mx-auto space-y-8 pt-8 animate-fade-in">
            {/* Hero Value Framing */}
            <div className="text-center space-y-2.5 max-w-xl mx-auto">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Live ML Cloud Inference Active</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
                Never send a message you&apos;ll regret.
              </h1>
              <p className="text-[14px] text-zinc-400 font-normal leading-relaxed">
                Test sensitive drafts in this private sandbox, or install our Chrome Extension to intercept tension live inside Gmail, Slack, and WhatsApp.
              </p>
            </div>

            {/* Quick Conflict Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                <span className="font-mono uppercase tracking-wider">Test high-stakes scenarios:</span>
                <span className="text-zinc-500">Click any scenario to simulate</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CONFLICT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.text)}
                    className="p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/20 text-left transition-all group"
                  >
                    <div className="text-[11px] font-semibold text-zinc-200 group-hover:text-white mb-1">
                      {p.tag}
                    </div>
                    <div className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                      &ldquo;{p.text}&rdquo;
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Clean Apple Message Composer */}
            <div className="apple-panel rounded-3xl p-6 sm:p-7 shadow-2xl transition-all relative border border-white/[0.08]">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-[12px] font-medium text-zinc-400">
                    Draft Simulation Canvas
                  </span>
                  {selectedRewrite && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                      Rewritten ({selectedRewrite.style})
                    </span>
                  )}
                </div>

                {analysis && (
                  <div className="flex items-center space-x-2 animate-fade-in">
                    <span className={`w-2 h-2 rounded-full ${analysis.intervention.triggered ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span className="text-[12px] font-medium text-zinc-300 tracking-tight">
                      {analysis.perception?.toneTag || (analysis.intervention.triggered ? 'Needs Reflection' : 'Constructive & Clear')}
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
                placeholder="Type an email, Slack reply, or critical message to analyze tone..."
                rows={5}
                className="w-full bg-transparent text-white placeholder-zinc-600 text-base sm:text-lg font-normal focus:outline-none resize-none leading-relaxed tracking-tight"
              />

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] mt-4">
                <div className="flex items-center space-x-3 text-xs text-zinc-500 font-mono">
                  <span>{draft.length} chars</span>
                  {analysis?.pythonMl?.active && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Cloud ML: Active
                    </span>
                  )}
                </div>

                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || isAnalyzing}
                  className={`px-6 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-30 ${
                    sentSuccess ? 'bg-emerald-400 text-black' : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing...</span>
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

            {/* Chrome Extension Promo Banner */}
            <div className="apple-panel rounded-3xl p-6 sm:p-7 border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="space-y-1 max-w-lg">
                <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                  <Globe className="w-4 h-4 text-sky-400" />
                  <span>Use HumanLens inside your everyday apps</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  You don&apos;t have to copy-paste. Our Chrome Extension floats beside active textboxes in <strong>Gmail</strong>, <strong>Slack Web</strong>, and <strong>WhatsApp Web</strong> to catch sharp replies right where you type.
                </p>
              </div>

              <button
                onClick={() => setIsExtensionModalOpen(true)}
                className="px-4 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold flex items-center space-x-2 border border-white/[0.1] transition-all shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Get Chrome Extension</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. TRENDS VIEW (APPLE HEALTH STYLE) */}
        {activeTab === 'trends' && (
          <div className="w-full max-w-3xl mx-auto space-y-8 pt-8 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  Behavioral Health &amp; Tone Trends
                </h1>
                <p className="text-[13px] text-[#86868b] mt-0.5">
                  How biological strain, sleep deficit, and workload correlate with your communication friction.
                </p>
              </div>

              <button
                onClick={() => setIsCheckinOpen(true)}
                className="flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-all active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Today</span>
              </button>
            </div>

            {/* Apple Stat Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="apple-panel p-4 rounded-2xl space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Sleep Average</span>
                <div className="text-2xl font-semibold tracking-tight text-white">
                  {behaviorData?.avgSleep || 5.7}<span className="text-xs font-normal text-zinc-500 ml-1">hrs</span>
                </div>
                <p className="text-[11px] text-zinc-400">-1.3h under personal target</p>
              </div>

              <div className="apple-panel p-4 rounded-2xl space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Stress Level</span>
                <div className="text-2xl font-semibold tracking-tight text-white">
                  {behaviorData?.avgStress || 6.9}<span className="text-xs font-normal text-zinc-500 ml-1">/10</span>
                </div>
                <p className="text-[11px] text-zinc-400">Peak observed mid-week</p>
              </div>

              <div className="apple-panel p-4 rounded-2xl space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Daily Affect</span>
                <div className="text-2xl font-semibold tracking-tight text-white">
                  {behaviorData?.avgMood || 2.6}<span className="text-xs font-normal text-zinc-500 ml-1">/5</span>
                </div>
                <p className="text-[11px] text-zinc-400">Moderate fluctuation</p>
              </div>

              <div className="apple-panel p-4 rounded-2xl space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Impulse Risk</span>
                <div className="text-2xl font-semibold tracking-tight text-white">
                  Elevated
                </div>
                <p className="text-[11px] text-zinc-400">Higher chance of sharp replies</p>
              </div>
            </div>

            {/* Area Chart */}
            <div className="apple-panel rounded-3xl p-6 space-y-4 border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white tracking-tight">
                  Stress &amp; Sleep Correlation
                </span>
                <div className="flex items-center space-x-4 text-[11px] text-zinc-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-0.5 bg-white"></span> Stress
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-0.5 bg-zinc-500"></span> Sleep
                  </span>
                </div>
              </div>

              <div className="h-56 w-full">
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
                              <div className="apple-panel-elevated p-2.5 rounded-xl border border-white/20 text-xs space-y-1 shadow-2xl">
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
          </div>
        )}

        {/* 3. COACH VIEW */}
        {activeTab === 'coach' && (
          <div className="w-full max-w-2xl mx-auto space-y-4 pt-8 flex flex-col h-[76vh] animate-fade-in">
            <div className="text-center space-y-1 pb-3 border-b border-white/[0.06]">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Reflection Coach
              </h1>
              <p className="text-[13px] text-[#86868b]">
                Evidence-grounded conflict resolution and communication guidance.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 px-1 py-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed tracking-tight ${
                      m.role === 'user' ? 'bg-white text-black font-normal rounded-tr-sm' : 'apple-panel text-zinc-100 rounded-tl-sm space-y-2 border border-white/[0.08]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center space-x-1.5 p-3 rounded-2xl apple-panel w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="pt-1">
              <div className="apple-panel rounded-full p-1 pl-4 pr-1.5 flex items-center gap-2 border border-white/[0.12]">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendChat();
                  }}
                  placeholder="Ask for advice on an email or difficult conversation..."
                  className="flex-1 bg-transparent text-[13px] text-white placeholder-zinc-500 focus:outline-none"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || chatLoading}
                  className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-all disabled:opacity-30 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CONSUMER DE-ESCALATION MODAL */}
      {showIntervention && analysis?.intervention && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
          <div className="apple-panel-elevated w-full max-w-xl rounded-3xl p-7 sm:p-8 space-y-6 max-h-[88vh] overflow-y-auto border border-white/[0.14] shadow-2xl">
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
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Circular Breathing Timer */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative w-14 h-14 rounded-full border border-white/20 flex items-center justify-center">
                  <span className="text-lg font-mono font-medium text-white">
                    {timerSeconds}s
                  </span>
                  <div className="absolute inset-0 rounded-full border border-white/40 animate-breathe-ring pointer-events-none" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    {timerSeconds > 0 ? getBreathingPhase() : 'Pause complete'}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono">
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

            {/* 3 Constructive Alternatives */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                Constructive Alternatives (One-tap replace)
              </span>

              <div className="space-y-2">
                {analysis.intervention.rewrites.map((rw, i) => (
                  <div
                    key={i}
                    onClick={() => applyRewrite(rw)}
                    className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-zinc-300 mb-1">
                      <span>{rw.style}</span>
                      <span className="text-[11px] text-zinc-500 group-hover:text-white flex items-center gap-0.5">
                        Apply <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                    <p className="text-sm text-zinc-100 leading-relaxed font-normal">
                      &ldquo;{rw.text}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Autonomy Preserving Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <span className="text-[11px] text-zinc-500">
                You maintain complete freedom to send your original text.
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
                  className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Send Original
                </button>
                <button
                  onClick={() => setShowIntervention(false)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all"
                >
                  Edit Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chrome Extension Modal / Instructions */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
          <div className="apple-panel-elevated w-full max-w-lg rounded-3xl p-7 sm:p-8 space-y-5 border border-white/[0.12] shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">HumanLens Chrome Extension</h3>
                  <p className="text-xs text-zinc-400">Real-time typing de-escalation inside your browser</p>
                </div>
              </div>
              <button
                onClick={() => setIsExtensionModalOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 text-xs leading-relaxed text-zinc-300">
              <div className="font-semibold text-white">Easy 3-Step Setup:</div>
              <ol className="list-decimal list-inside space-y-1.5 text-zinc-300">
                <li>Open Chrome and navigate to <code className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white font-mono">chrome://extensions</code></li>
                <li>Turn on <strong>Developer Mode</strong> in the top-right corner.</li>
                <li>Click <strong>Load unpacked</strong> and choose the <code className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white font-mono">extension</code> folder from your project repository.</li>
              </ol>
            </div>

            <div className="space-y-2 text-xs text-zinc-400">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Zero configuration — pre-wired to your live cloud API</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Active on Gmail, Slack Web, and WhatsApp Web</span>
              </div>
            </div>

            <button
              onClick={() => setIsExtensionModalOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all"
            >
              Got it
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

      {/* Cloud & Database Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey || ''}
        onSaveApiKey={(key) => {
          if (onSaveApiKey) onSaveApiKey(key);
        }}
      />

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />

      {/* Minimalist Consumer Footer with Discrete Academic Defense Link */}
      <footer className="mt-auto pt-16 border-t border-white/[0.06] max-w-5xl mx-auto w-full px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-4">
        <div className="flex items-center space-x-4">
          <span>&copy; {new Date().getFullYear()} HumanLens AI. All rights reserved.</span>
          <span>&bull;</span>
          <span className="text-zinc-400">Zero Keystroke Logging</span>
        </div>

        {/* Subtle, Discrete Academic Defense Link */}
        <Link
          href="/research"
          className="flex items-center space-x-1 text-zinc-500 hover:text-zinc-300 font-mono transition-colors"
        >
          <span>Research &amp; ML Evaluation Studio</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </footer>
    </div>
  );
};
