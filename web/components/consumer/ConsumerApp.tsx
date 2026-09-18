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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col transition-colors duration-300">
      {/* 1. APP TOP BAR */}
      <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/85 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand & Live Indicator */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-[10px] tracking-tight transition-colors">
                HL
              </div>
              <span className="text-[14px] font-semibold tracking-tight text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                HumanLens
              </span>
            </Link>

            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ML Engine Active</span>
            </span>
          </div>

          {/* Core App Navigation Tabs */}
          <nav className="flex items-center p-1 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'workspace' 
                  ? 'bg-white dark:bg-[#18181b] text-black dark:text-white shadow-sm font-semibold' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>

            <button
              onClick={() => setActiveTab('trends')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'trends' 
                  ? 'bg-white dark:bg-[#18181b] text-black dark:text-white shadow-sm font-semibold' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Trends</span>
            </button>

            <button
              onClick={() => setActiveTab('coach')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'coach' 
                  ? 'bg-white dark:bg-[#18181b] text-black dark:text-white shadow-sm font-semibold' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coach</span>
            </button>
          </nav>

          {/* Right Controls: Theme Toggle, Extension, Profile/Logout */}
          <div className="flex items-center space-x-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] transition-all active:scale-95"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-700" />}
            </button>

            {/* Extension Pill */}
            <button
              onClick={() => setIsExtensionModalOpen(true)}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-sky-500" />
              <span>Extension</span>
            </button>

            {/* User Account / Logout */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 py-1 px-2.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] border border-black/[0.08] dark:border-white/[0.1] text-xs transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-[10px] flex items-center justify-center">
                    {(currentUser.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <span className="max-w-[85px] truncate text-zinc-800 dark:text-zinc-200 font-medium">
                    {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 py-2 bg-white dark:bg-[#121215] border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-xl dark:shadow-2xl z-50 text-xs animate-fade-in">
                    <div className="px-3.5 py-2 border-b border-black/[0.06] dark:border-white/[0.06] space-y-0.5">
                      <div className="font-semibold text-zinc-900 dark:text-white truncate">{currentUser.email}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Authenticated Account</div>
                    </div>

                    <div className="px-1.5 py-1">
                      <button
                        onClick={() => { setIsSettingsOpen(true); setUserDropdownOpen(false); }}
                        className="w-full px-2.5 py-1.5 text-left text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-xl flex items-center space-x-2"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Cloud AI Settings</span>
                      </button>
                      <Link
                        href="/research"
                        className="w-full px-2.5 py-1.5 text-left text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-xl flex items-center space-x-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ML Research Studio</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-black/[0.06] dark:border-white/[0.06] px-1.5">
                      <button
                        onClick={handleSignOut}
                        className="w-full px-2.5 py-1.5 text-left text-rose-500 hover:bg-rose-500/10 rounded-xl flex items-center space-x-2 font-medium transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="group flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white dark:bg-white text-black hover:bg-zinc-100 transition-all active:scale-95 shadow-md"
              >
                <span>Sign In</span>
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN APPLICATION WORKSPACE */}
      {activeTab === 'workspace' && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
          {/* Workspace Subheader */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                De-escalation Workspace
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Real-time emotional intelligence buffer. Draft, test, and defuse sensitive messages.
              </p>
            </div>

            {/* Quick Scenario Preset Chips */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 mr-1 hidden md:inline">Quick Scenarios:</span>
              {CONFLICT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.text)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white border border-black/[0.06] dark:border-white/[0.08] transition-all"
                >
                  {p.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Two-Column App Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Composer & Multimodal Sensors (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Composer Box */}
              <div className="rounded-3xl bg-white dark:bg-[#0d0d0f] border border-black/[0.08] dark:border-white/[0.1] p-5 sm:p-6 shadow-sm dark:shadow-2xl transition-all">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06] mb-3 text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                    Draft Input Canvas
                  </span>

                  {analysis && (
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${analysis.intervention.triggered ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <span className="text-zinc-800 dark:text-zinc-300 font-medium">
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
                  placeholder="Type an email, Slack reply, or difficult message to analyze tone in real-time..."
                  rows={6}
                  className="w-full bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 text-base focus:outline-none resize-none leading-relaxed tracking-tight"
                />

                {/* Multimodal Sensors Control Bar */}
                <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setCameraActive(!cameraActive)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                        cameraActive 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] text-zinc-500 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Face AUs {cameraActive ? 'On' : 'Off'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMicActive(!micActive)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                        micActive 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] text-zinc-500 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Voice Strain {micActive ? 'On' : 'Off'}</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {draft.length} chars
                    </span>

                    <button
                      onClick={handleSend}
                      disabled={!draft.trim() || isAnalyzing}
                      className={`px-5 py-2 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-30 ${
                        sentSuccess 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm'
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
                          <span>Analyze &amp; Defuse</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stress Context Slider */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0d0d0f] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">Simulated Physiological Fatigue / Stress:</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={stressContextScore}
                    onChange={(e) => setStressContextScore(parseFloat(e.target.value))}
                    className="w-28 accent-black dark:accent-white cursor-pointer"
                  />
                  <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold w-10 text-right">
                    {Math.round(stressContextScore * 100)}%
                  </span>
                </div>
              </div>

              {/* Session Interceptions History */}
              {historyLogs.length > 0 && (
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0d0d0f] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-white">
                    <span>Recent Transformed Messages</span>
                    <span className="text-zinc-400 font-mono text-[10px]">{historyLogs.length} protected</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {historyLogs.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span className="line-through text-rose-500/80">&ldquo;{item.original}&rdquo;</span>
                          <span className="font-mono">{item.time}</span>
                        </div>
                        <div className="text-zinc-800 dark:text-zinc-200 font-medium">
                          &ldquo;{item.rewrite}&rdquo;
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Real-time De-escalation & Clinical Rewrites (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {analysis?.intervention ? (
                <div className="rounded-3xl bg-white dark:bg-[#0d0d0f] border border-black/[0.08] dark:border-white/[0.1] p-6 shadow-sm dark:shadow-2xl space-y-5 animate-fade-in">
                  {/* Perception Banner */}
                  <div className="space-y-1 pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
                        Perception Impact
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold">
                        {analysis.riskLevel} TENSION
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                      {analysis.perception?.toneTag}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {analysis.perception?.recipientImpact}
                    </p>
                  </div>

                  {/* 20s Cooling Pause */}
                  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-10 h-10 rounded-full border border-black/20 dark:border-white/20 flex items-center justify-center font-mono font-bold text-zinc-900 dark:text-white">
                        {timerSeconds}s
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-white">
                          {timerSeconds > 0 ? getBreathingPhase() : 'Pause complete'}
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                          Physiological Sigh Downregulation
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setTimerRunning(!timerRunning)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/10"
                    >
                      {timerRunning ? 'Pause' : 'Resume'}
                    </button>
                  </div>

                  {/* 3 Clinical Rewrites */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                      <span>Clinical Alternatives</span>
                      <span>Stanford &bull; Gottman</span>
                    </div>

                    <div className="space-y-2">
                      {analysis.intervention.rewrites.map((rw, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] transition-all space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                              {rw.style}
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleCopyRewrite(rw.text, i)}
                                title="Copy to clipboard"
                                className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                              >
                                {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => applyRewrite(rw)}
                                className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium flex items-center gap-0.5"
                              >
                                Apply &rarr;
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                            &ldquo;{rw.text}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl bg-white dark:bg-[#0d0d0f] border border-black/[0.08] dark:border-white/[0.1] p-7 text-center space-y-3 shadow-sm dark:shadow-2xl">
                  <div className="w-10 h-10 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center mx-auto text-zinc-400">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Live Buffer Ready
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                    Type a message or select a quick scenario. The ML engine will analyze tone and provide evidence-based rewrites automatically.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* 3. HEALTH TRENDS VIEW */}
      {activeTab === 'trends' && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                Behavioral Health &amp; Tone Trends
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                How physiological strain and sleep debt correlate with your communication friction.
              </p>
            </div>

            <button
              onClick={() => setIsCheckinOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Today</span>
            </button>
          </div>

          {/* Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white dark:bg-[#0d0d0f] border border-black/[0.08] dark:border-white/[0.08] p-4 space-y-1 shadow-sm dark:shadow-none">
              <span className="text-[11px] font-mono uppercase text-zinc-500">Sleep Average</span>
              <div className="text-2xl font-semibold text-zinc-900 dark:text-white">
                {behaviorData?.avgSleep || 5.7}<span className="text-xs font-normal text-zinc-500 ml-1">hrs</span>
              </div>
              <p className="text-[11px] text-zinc-500">-1.3h under personal target</p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#0d0d0f] border border-black/[0.08] dark:border-white/[0.08] p-4 space-y-1 shadow-sm dark:shadow-none">
              <span className="text-[11px] font-mono uppercase text-zinc-500">Stress Level</span>
              <div className="text-2xl font-semibold text-zinc-900 dark:text-white">
                {behaviorData?.avgStress || 6.9}<span className="text-xs font-normal text-zinc-500 ml-1">/10</span>
              </div>
              <p className="text-[11px] text-zinc-500">Peak observed mid-week</p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#0d0d0f] border border-black/[0.08] dark:border-white/[0.08] p-4 space-y-1 shadow-sm dark:shadow-none">
              <span className="text-[11px] font-mono uppercase text-zinc-500">Daily Affect</span>
              <div className="text-2xl font-semibold text-zinc-900 dark:text-white">
                {behaviorData?.avgMood || 2.6}<span className="text-xs font-normal text-zinc-500 ml-1">/5</span>
              </div>
              <p className="text-[11px] text-zinc-500">Moderate fluctuation</p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#0d0d0f] border border-black/[0.08] dark:border-white/[0.08] p-4 space-y-1 shadow-sm dark:shadow-none">
              <span className="text-[11px] font-mono uppercase text-zinc-500">Impulse Risk</span>
              <div className="text-2xl font-semibold text-zinc-900 dark:text-white">
                Elevated
              </div>
              <p className="text-[11px] text-zinc-500">Higher friction probability</p>
            </div>
          </div>

          {/* Area Chart */}
          <div className="rounded-3xl bg-white dark:bg-[#0d0d0f] border border-black/[0.08] dark:border-white/[0.08] p-6 space-y-4 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-900 dark:text-white">Stress &amp; Sleep Correlation (7 Days)</span>
              <div className="flex items-center space-x-4 text-[11px] text-zinc-500 font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-black dark:bg-white"></span> Stress</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-zinc-400 dark:bg-zinc-500"></span> Sleep</span>
              </div>
            </div>

            <div className="h-64 w-full">
              {behaviorData?.trends && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={behaviorData.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cStress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000000" stopOpacity={theme === 'dark' ? 0.25 : 0.08} />
                        <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cSleep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#71717a" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke={theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={[0, 10]} />
                    <Tooltip
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-black/[0.1] dark:border-white/20 text-xs space-y-1 shadow-xl">
                              <div className="font-semibold text-zinc-900 dark:text-white">{label}</div>
                              <div className="text-zinc-600 dark:text-zinc-300 font-mono">Stress: {payload[0]?.value} / 10</div>
                              <div className="text-zinc-500 dark:text-zinc-400 font-mono">Sleep: {payload[1]?.value} hrs</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="stress" stroke={theme === 'dark' ? '#ffffff' : '#000000'} strokeWidth={1.5} fillOpacity={1} fill="url(#cStress)" />
                    <Area type="monotone" dataKey="sleep" stroke="#71717a" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={1} fill="url(#cSleep)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </main>
      )}

      {/* 4. REFLECTION COACH VIEW */}
      {activeTab === 'coach' && (
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-4 flex flex-col h-[82vh] animate-fade-in">
          <div className="text-center space-y-1 pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Reflection Coach
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Evidence-based communication and conflict resolution advisor.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 px-1 py-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-black dark:bg-white text-white dark:text-black font-normal rounded-tr-sm shadow-sm' 
                      : 'bg-white dark:bg-[#0d0d0f] border border-black/[0.08] dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 rounded-tl-sm space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center space-x-1.5 p-3 rounded-2xl bg-white dark:bg-[#0d0d0f] border border-black/[0.08] dark:border-white/[0.08] w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="pt-2">
            <div className="rounded-full bg-white dark:bg-[#0d0d0f] border border-black/[0.08] dark:border-white/[0.1] p-1.5 pl-4 pr-1.5 flex items-center gap-2 shadow-sm">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendChat();
                }}
                placeholder="Describe a tense email or disagreement..."
                className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || chatLoading}
                className="w-7 h-7 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-80 transition-all disabled:opacity-30 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* 5. MODALS */}
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

      {/* Extension Modal */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0d0d0f] p-7 space-y-5 border border-black/[0.08] dark:border-white/[0.12] shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white">HumanLens for Chrome</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Real-time typing de-escalation</p>
                </div>
              </div>
              <button
                onClick={() => setIsExtensionModalOpen(false)}
                className="p-1 rounded-full text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              <div className="font-semibold text-zinc-900 dark:text-white">Setup in 3 Steps:</div>
              <ol className="list-decimal list-inside space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>Open Chrome: <code className="px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.08] text-zinc-900 dark:text-white font-mono">chrome://extensions</code></li>
                <li>Turn on <strong>Developer Mode</strong> (top-right).</li>
                <li>Click <strong>Load unpacked</strong> and select the <code className="px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.08] text-zinc-900 dark:text-white font-mono">extension</code> folder from your project.</li>
              </ol>
            </div>

            <button
              onClick={() => setIsExtensionModalOpen(false)}
              className="w-full py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black font-semibold text-xs hover:opacity-90 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-black/[0.06] dark:border-white/[0.06] max-w-6xl mx-auto w-full px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 gap-3 transition-colors">
        <div className="flex items-center space-x-3">
          <span>&copy; {new Date().getFullYear()} HumanLens AI</span>
          <span>&bull;</span>
          <span>Zero Keystroke Logging</span>
        </div>

        <Link
          href="/research"
          className="flex items-center space-x-1 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors font-mono text-[11px]"
        >
          <span>Research ML Studio</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </footer>
    </div>
  );
};
