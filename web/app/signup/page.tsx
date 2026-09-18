'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, MailCheck } from 'lucide-react';
import { signUpWithEmail, getCurrentUser } from '../../lib/supabaseAuth';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((u) => { if (u) router.push('/'); })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await signUpWithEmail(email, password, fullName);
      if (res.user && res.session) {
        // Auto-confirmed (email confirmation disabled) — go straight in
        setSuccess('Account created! Taking you in…');
        setTimeout(() => { window.location.href = '/'; }, 900);
      } else {
        // Email confirmation required — make this very clear
        setSuccess('VERIFY_EMAIL');
      }
    } catch (err: any) {
      setError(err.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  // Minimal password strength
  const strength = password.length === 0 ? null
    : password.length < 6  ? { label: 'Too short', w: '25%',  color: 'bg-rose-500' }
    : password.length < 9  ? { label: 'Weak',      w: '50%',  color: 'bg-amber-400' }
    : password.length < 12 ? { label: 'Good',      w: '75%',  color: 'bg-sky-400' }
    :                         { label: 'Strong',    w: '100%', color: 'bg-emerald-400' };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden">

      {/* ── Ambient background glow ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-white/[0.03] blur-[100px]" />
        <div className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full bg-violet-500/[0.04] blur-[120px]" />
      </div>

      {/* ── Logo mark ── */}
      <div className="relative z-10 mb-8 flex flex-col items-center animate-fade-in">
        <Link href="/" className="group flex flex-col items-center space-y-3">
          <div className="w-14 h-14 rounded-[20px] bg-white/[0.07] border border-white/[0.1] backdrop-blur-sm flex items-center justify-center shadow-2xl group-hover:bg-white/[0.1] transition-all duration-300">
            <span className="text-white font-semibold text-lg tracking-tight">HL</span>
          </div>
          <span className="text-white/60 text-sm font-medium tracking-tight">HumanLens</span>
        </Link>
      </div>

      {/* ── Glass card ── */}
      <div
        className="relative z-10 w-full max-w-[360px] mx-auto px-5 animate-fade-in"
        style={{ animationDelay: '60ms' }}
      >
        <div className="rounded-[28px] bg-white/[0.05] border border-white/[0.1] backdrop-blur-2xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)] p-8">

          {/* Heading */}
          <div className="mb-7 text-center">
            <h1 className="text-[22px] font-semibold text-white tracking-tight">Create account</h1>
            <p className="text-[13px] text-white/40 mt-1">to get started with HumanLens</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px] text-center animate-fade-in">
              {error}
            </div>
          )}

          {/* ── Email verification sent state ── */}
          {success === 'VERIFY_EMAIL' ? (
            <div className="py-4 flex flex-col items-center text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <MailCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold text-[16px] mb-2">Check your inbox</h3>
              <p className="text-white/40 text-[13px] leading-relaxed mb-1">
                We sent a confirmation link to
              </p>
              <p className="text-white/70 text-[13px] font-medium mb-5">{email}</p>
              <p className="text-white/30 text-[12px] leading-relaxed max-w-[240px]">
                Click the link in the email, then come back here to sign in.
              </p>
              <Link
                href="/login"
                className="mt-6 flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-all active:scale-95"
              >
                <span>Go to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <>
          {success && success !== 'VERIFY_EMAIL' && (
            <div className="mb-5 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[13px] flex items-center justify-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none group-focus-within:text-white/50 transition-colors" />
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] focus:border-white/25 focus:bg-white/[0.08] text-[14px] text-white placeholder-white/25 outline-none transition-all duration-200"
              />
            </div>

            {/* Email */}
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none group-focus-within:text-white/50 transition-colors" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] focus:border-white/25 focus:bg-white/[0.08] text-[14px] text-white placeholder-white/25 outline-none transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none group-focus-within:text-white/50 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] focus:border-white/25 focus:bg-white/[0.08] text-[14px] text-white placeholder-white/25 outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Inline password strength — only when typing */}
              {strength && (
                <div className="mt-2 flex items-center space-x-2.5 px-1 animate-fade-in">
                  <div className="flex-1 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                      style={{ width: strength.w }}
                    />
                  </div>
                  <span className="text-[11px] text-white/30 w-12 shrink-0">{strength.label}</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-3.5 rounded-2xl bg-white hover:bg-white/90 text-black text-[14px] font-semibold flex items-center justify-center space-x-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-white/10"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )
              }
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-white/20 text-[12px]">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Sign in link */}
          <p className="text-center text-[13px] text-white/40">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-white/80 font-medium hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </p>
            </>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-[11px] text-white/20 leading-relaxed">
          Protected by end-to-end encryption.<br />Zero keystroke logging.
        </p>
      </div>
    </div>
  );
}
