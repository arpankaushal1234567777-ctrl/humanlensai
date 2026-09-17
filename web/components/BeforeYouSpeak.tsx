'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Check, RefreshCw, X, ArrowUpRight, ShieldCheck, Moon } from 'lucide-react';
import { MultimodalAnalysisResponse, RewriteOption } from '../types';

interface BeforeYouSpeakProps {
  apiKey?: string;
  isAdminMode?: boolean;
}

export const BeforeYouSpeak: React.FC<BeforeYouSpeakProps> = ({ apiKey, isAdminMode = false }) => {
  const [draft, setDraft] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MultimodalAnalysisResponse | null>(null);
  const [showIntervention, setShowIntervention] = useState(false);
  const [selectedRewrite, setSelectedRewrite] = useState<RewriteOption | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  // 20s cooling pause timer
  const [timerSeconds, setTimerSeconds] = useState(20);
  const [timerRunning, setTimerRunning] = useState(false);

  // Debounce ref for auto-scan as user types
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Scenario presets
  const presets = [
    { label: 'Project Blame', text: 'You complete idiot, stop ruining our project with your careless mistakes!' },
    { label: 'Hinglish Friction', text: 'Ye sab bakwaas hai, tum pagalon ki tarah code likh rahe ho!' },
    { label: 'Passive Sarcasm', text: 'As per my previous email which you clearly did not bother reading.' },
    { label: 'Neutral Baseline', text: 'Thanks for sending the updates. Let us review the test results tomorrow morning.' }
  ];

  // Core analysis worker
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
    } catch (err) {
      console.error('Analysis error:', err);
      return null;
    }
  };

  // Live background typing tone-check (Debounced 500ms)
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

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const applyRewrite = (rw: RewriteOption) => {
    setDraft(rw.text);
    setSelectedRewrite(rw);
    setShowIntervention(false);
    setTimerRunning(false);
    performAnalysis(rw.text);
  };

  // THE KEY INTERCEPTION: Intercepts send if tone is elevated!
  const handleSend = async () => {
    if (!draft.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    const data = await performAnalysis(draft);
    setIsAnalyzing(false);

    // If hostility/threat is detected, BLOCK SEND and trigger the reflection modal!
    if (data?.intervention?.triggered && !selectedRewrite) {
      setShowIntervention(true);
      setTimerSeconds(20);
      setTimerRunning(true);
      return; // Stop right here! Do not send!
    }

    // Otherwise safe, deliver message
    setSentSuccess(true);
    setTimeout(() => {
      setDraft('');
      setAnalysis(null);
      setSelectedRewrite(null);
      setShowIntervention(false);
      setSentSuccess(false);
    }, 2000);
  };

  const getBreathingPhase = () => {
    const s = timerSeconds % 8;
    if (s >= 4) return 'Inhale slowly...';
    return 'Exhale gently...';
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 pt-8">
      {/* Apple Minimal Hero */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
          Think before you send.
        </h1>
        <p className="text-[15px] text-[#86868b] max-w-md mx-auto font-normal leading-relaxed">
          Real-time tone interception. Protects your professional standing and helps you deliver firm, constructive feedback.
        </p>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
        <span className="text-[12px] text-zinc-500 mr-1.5 font-medium">Try scenario:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDraft(p.text);
              performAnalysis(p.text);
            }}
            className="px-3 py-1 text-xs rounded-full bg-white/[0.04] hover:bg-white/[0.09] text-zinc-300 border border-white/[0.06] transition-all hover:border-white/20 active:scale-95"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Composer Canvas */}
      <div className="apple-panel rounded-3xl p-6 sm:p-7 shadow-2xl transition-all relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
          <span className="text-[12px] font-medium text-zinc-400">
            Draft Message
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
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              handleSend();
            }
          }}
          placeholder="Compose message or email... (try typing an angry or sarcastic message to see it intercept)"
          rows={6}
          className="w-full bg-transparent text-white placeholder-zinc-600 text-lg sm:text-xl font-normal focus:outline-none resize-none leading-relaxed tracking-tight"
        />

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] mt-4">
          <span className="text-xs text-zinc-500 font-mono">
            {draft.length} chars
          </span>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => performAnalysis(draft)}
              disabled={isAnalyzing || !draft.trim()}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-30"
            >
              <span className="flex items-center gap-1.5">
                <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>Reflect Tone</span>
              </span>
            </button>

            <button
              onClick={handleSend}
              disabled={!draft.trim() || isAnalyzing}
              className={`px-5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-30 ${
                sentSuccess
                  ? 'bg-white text-black'
                  : 'bg-white text-black hover:bg-zinc-200'
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

      {/* CONSUMER DE-ESCALATION SHEET (AUTOMATICALLY INTERCEPTS ON SEND) */}
      {showIntervention && analysis?.intervention && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
          <div className="apple-panel-elevated w-full max-w-xl rounded-3xl p-7 sm:p-8 space-y-6 max-h-[88vh] overflow-y-auto border border-white/[0.14] shadow-2xl">
            {/* Sheet Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Perception &amp; Delivery Insight</span>
                </span>
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  Pause &amp; Reflect
                </h2>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-md pt-0.5">
                  {analysis.perception?.preservesIntentSummary}
                </p>
              </div>

              <button
                onClick={() => setShowIntervention(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Impact Callout */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
              <div className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
                <span>How this may be received:</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                &ldquo;{analysis.perception?.recipientImpact}&rdquo;
              </p>

              {/* Empathetic Fatigue/Stress Connection */}
              {analysis.perception?.behavioralContextHint && (
                <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-zinc-400">
                  <Moon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{analysis.perception.behavioralContextHint}</span>
                </div>
              )}
            </div>

            {/* Circular 20-Second Breathing Pause */}
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
                    Box Breathing Protocol &bull; 4s Inhale / 4s Exhale
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

            {/* ADMIN / INSPECTOR MODE EXPANDABLE */}
            {isAdminMode && (
              <div className="p-3 rounded-2xl bg-zinc-950 border border-white/10 space-y-2 font-mono text-[11px]">
                <div className="text-zinc-400 uppercase tracking-wider font-semibold">
                  🔬 Admin / Researcher Telemetry (Hidden from Users)
                </div>
                <div className="grid grid-cols-2 gap-2 text-zinc-300">
                  <div>Toxicity: {analysis.textAnalysis.toxicity}</div>
                  <div>Insult Score: {analysis.textAnalysis.insult}</div>
                  <div>Threat Score: {analysis.textAnalysis.threat}</div>
                  <div>Fusion Score: {analysis.overallScore} ({analysis.riskLevel})</div>
                </div>
              </div>
            )}

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
                    }, 2000);
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
    </div>
  );
};
