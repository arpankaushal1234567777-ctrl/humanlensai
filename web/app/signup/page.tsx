'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, Sparkles, Sun, Moon, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { signUpWithEmail, getCurrentUser } from '../../lib/supabaseAuth';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) router.push('/');
    }).catch(() => {});

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
  }, [router]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('hl_theme', next);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(next);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await signUpWithEmail(email, password, fullName);
      if (res.user) {
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 900);
      } else {
        setSuccessMsg('Account registered! Please check your email to verify.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not create account. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col justify-between p-6 transition-colors duration-300">
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-[10px] tracking-tight transition-colors">
            HL
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
            HumanLens
          </span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>
          <Link
            href="/"
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to App</span>
          </Link>
        </div>
      </div>

      {/* SignUp Card */}
      <div className="max-w-sm w-full mx-auto my-auto animate-fade-in">
        <div className="rounded-3xl bg-white dark:bg-[#0d0d0f] border border-black/[0.08] dark:border-white/[0.1] p-7 sm:p-8 shadow-xl dark:shadow-2xl transition-all">
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] mb-1">
              <Sparkles className="w-5 h-5 text-zinc-900 dark:text-white" />
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              Create your account
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Start tracking communication tone and preventing impulsive friction.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-300 text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] focus:border-black/30 dark:focus:border-white/30 rounded-2xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] focus:border-black/30 dark:focus:border-white/30 rounded-2xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] focus:border-black/30 dark:focus:border-white/30 rounded-2xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center space-y-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Already have an account?{' '}
              <Link href="/login" className="text-zinc-900 dark:text-white font-semibold underline underline-offset-4 hover:opacity-80">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-zinc-400 py-4">
        Protected by encrypted Supabase authentication &bull; Zero keystroke logging
      </div>
    </div>
  );
}
