'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Check, RefreshCw, X, ArrowUpRight, Plus, Moon, Brain, MessageSquare, Activity, Sparkles, Settings } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MultimodalAnalysisResponse, RewriteOption, BehaviorSummary, ChatMessage } from '../../types';
import { CheckinModal } from '../CheckinModal';
import { SettingsModal } from '../SettingsModal';

interface ConsumerAppProps {
  apiKey?: string;
  onSaveApiKey?: (key: string) => void;
  onSwitchToDev: () => void;
}

export const ConsumerApp: React.FC<ConsumerAppProps> = ({ apiKey, onSaveApiKey, onSwitchToDev }) => {
  const [activeTab, setActiveTab] = useState<'write' | 'trends' | 'coach'>('write');
  const [draft, setDraft] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MultimodalAnalysisResponse | null>(null);
  const [showIntervention, setShowIntervention] = useState(false);
  const [selectedRewrite, setSelectedRewrite] = useState<RewriteOption | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      content: 'I am your HumanLens Reflection Coach. If you are experiencing friction with a teammate or feeling overwhelmed, ask me how to respond constructively.',
      timestamp: 'Now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
    }, 500);

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

  // Intercepting Send
  const handleSend = async () => {
    if (!draft.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    const data = await performAnalysis(draft);
    setIsAnalyzing(false);

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
      {/* Floating Apple Header */}
      <header className="sticky top-5 z-40 w-full max-w-4xl mx-auto px-4">
        <div className="apple-panel rounded-full px-4 py-2 flex items-center justify-between shadow-2xl transition-all">
          {/* Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-black font-semibold text-[11px] tracking-tight">
              HL
            </div>
            <span className="text-[13px] font-medium tracking-tight text-white">
              HumanLens
            </span>
          </div>

          {/* 3 Core Consumer Tabs */}
          <nav className="flex items-center p-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('write')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'write' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Write</span>
            </button>

            <button
              onClick={() => setActiveTab('trends')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'trends' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Trends</span>
            </button>

            <button
              onClick={() => setActiveTab('coach')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'coach' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coach</span>
            </button>
          </nav>

          {/* Right Controls: Settings, Mode Switcher & Log */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCheckinOpen(true)}
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.08] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Day</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Cloud & Database Settings"
              className="p-1.5 rounded-full text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Showcase Mode Switcher Button */}
            <button
              onClick={onSwitchToDev}
              title="Switch to Developer & Research ML Studio"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-[11px] font-mono text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="hidden sm:inline">⚡ Dev Studio</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONSUMER VIEWS */}
      <main className="flex-1 px-4 sm:px-6">
        {/* 1. WRITE VIEW (PURE MINIMALIST CANVAS) */}
        {activeTab === 'write' && (
          <div className="w-full max-w-2xl mx-auto space-y-8 pt-10 animate-fade-in">
            <div className="text-center space-y-2">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
                Think before you send.
              </h1>
              <p className="text-[15px] text-[#86868b] max-w-md mx-auto font-normal leading-relaxed">
                An intelligent buffer that protects your relationships and helps you communicate with clarity.
              </p>
            </div>

            {/* Clean Apple Composer */}
            <div className="apple-panel rounded-3xl p-6 sm:p-7 shadow-2xl transition-all relative">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                <span className="text-[12px] font-medium text-zinc-400">
                  New Message
                </span>

                {analysis && (
                  <div className="flex items-center space-x-2 animate-fade-in">
                    <span className={`w-2 h-2 rounded-full ${analysis.intervention.triggered ? 'bg-amber-400 animate-pulse' : 'bg-zinc-400'}`} />
                    <span className="text-[12px] font-medium text-zinc-300 tracking-tight">
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
                placeholder="Draft message, email, or Slack reply..."
                rows={6}
                className="w-full bg-transparent text-white placeholder-zinc-600 text-lg sm:text-xl font-normal focus:outline-none resize-none leading-relaxed tracking-tight"
              />

              {/* Single Sleek Send Action */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] mt-4">
                <span className="text-xs text-zinc-500 font-mono">
                  {draft.length} chars
                </span>

                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || isAnalyzing}
                  className={`px-6 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-30 ${
                    sentSuccess ? 'bg-white text-black' : 'bg-white text-black hover:bg-zinc-200'
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
                      <span>Sent</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. TRENDS VIEW (APPLE HEALTH STYLE) */}
        {activeTab === 'trends' && (
          <div className="w-full max-w-3xl mx-auto space-y-8 pt-10 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  Behavioral Trends
                </h1>
                <p className="text-[13px] text-[#86868b] mt-0.5">
                  How biological strain and workload correlate with your communication patterns.
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

            {/* Monochrome Area Chart */}
            <div className="apple-panel rounded-3xl p-6 space-y-4">
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

        {/* 3. COACH VIEW (MINIMAL MESSAGES CHAT) */}
        {activeTab === 'coach' && (
          <div className="w-full max-w-2xl mx-auto space-y-4 pt-10 flex flex-col h-[76vh] animate-fade-in">
            <div className="text-center space-y-1 pb-3 border-b border-white/[0.06]">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Reflection Coach
              </h1>
              <p className="text-[13px] text-[#86868b]">
                Evidence-grounded communication guidance.
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
                  placeholder="Ask a question or describe an argument..."
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

      {/* CONSUMER DE-ESCALATION MODAL (FOCUSED & PUNCHY) */}
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
    </div>
  );
};
