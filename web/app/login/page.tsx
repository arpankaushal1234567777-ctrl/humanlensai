'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail, Lock, ArrowRight, Loader2, Eye, EyeOff,
  ShieldCheck, Brain, Activity, MessageSquare, Sparkles
} from 'lucide-react';
import { signInWithEmail, getCurrentUser } from '../../lib/supabaseAuth';

const FEATURES = [
  {
    icon: Brain,
    title: 'Real-time Emotional Intelligence',
    desc: 'Detects tone, urgency, and escalation signals before you hit send.',
  },
  {
    icon: ShieldCheck,
    title: 'De-escalation Intervention',
    desc: 'A 20-second pause with rewrite suggestions to prevent impulsive regrets.',
  },
  {
    icon: Activity,
    title: 'Behavioral Trend Insights',
    desc: 'Weekly patterns of communication health and stress indicators.',
  },
  {
    icon: MessageSquare,
    title: 'Reflection Coach',
    desc: 'AI-powered conversational coaching for workplace friction.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((user) => { if (user) router.push('/'); })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await signInWithEmail(email, password);
      if (res.user) window.location.href = '/';
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT BRAND PANEL ── */}
      <div className="hidden lg:flex flex-col w-[52%] relative bg-black overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-[350px] h-[350px] rounded-full bg-sky-500/15 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group w-fit">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-black font-bold text-[12px] tracking-tight shadow-lg">
              HL
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">HumanLens</span>
          </Link>

          {/* Hero copy */}
          <div className="mt-auto mb-10 animate-slide-up">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.05] text-[11px] text-zinc-400 font-mono mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ML Engine Active · Local Inference</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-semibold text-white tracking-tight leading-[1.1] mb-4">
              Communicate with<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400">
                more clarity.
              </span>
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              HumanLens intercepts emotionally charged messages in real time — helping you pause, reflect, and respond constructively.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4 mb-8">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex items-start space-x-3 animate-slide-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">{f.title}</p>
                    <p className="text-zinc-500 text-[11px] mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom badge */}
          <div className="flex items-center space-x-2 text-[11px] text-zinc-600">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
            <span>End-to-end encrypted · Zero keystroke logging · Supabase cloud sync</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex flex-col bg-[#09090b] lg:bg-[#050506]">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-5 pt-5 pb-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-black font-bold text-[11px]">HL</div>
            <span className="text-white font-semibold text-sm">HumanLens</span>
          </Link>
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">← Back</Link>
        </div>

        {/* Center form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-[380px] animate-fade-in">
            {/* Header */}
            <div className="mb-7">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.1] mb-4">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">Welcome back</h2>
              <p className="text-zinc-500 text-sm mt-1">
                Sign in to your HumanLens account
              </p>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="mb-5 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed animate-fade-in">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400 tracking-wide uppercase ml-0.5">
                  Email
                </label>
                <div className={`relative rounded-2xl transition-all duration-200 ${
                  focusedField === 'email'
                    ? 'ring-1 ring-white/20'
                    : ''
                }`}>
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-zinc-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400 tracking-wide uppercase ml-0.5">
                  Password
                </label>
                <div className={`relative rounded-2xl transition-all duration-200 ${
                  focusedField === 'password'
                    ? 'ring-1 ring-white/20'
                    : ''
                }`}>
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-11 py-3 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-zinc-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-3.5 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-black text-sm font-semibold flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="mx-3 text-[11px] text-zinc-600">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Sign up link */}
            <p className="text-center text-sm text-zinc-500">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-white font-semibold hover:text-zinc-300 transition-colors underline underline-offset-4 decoration-white/30"
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="text-center text-[11px] text-zinc-700 py-4 px-6">
          By signing in, you agree to our{' '}
          <span className="text-zinc-600 underline underline-offset-2 cursor-pointer hover:text-zinc-400 transition-colors">Terms</span>
          {' '}and{' '}
          <span className="text-zinc-600 underline underline-offset-2 cursor-pointer hover:text-zinc-400 transition-colors">Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}
