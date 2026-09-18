'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '../../lib/supabaseAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await signUpWithEmail(email, password, fullName);
        if (res.user) {
          setSuccessMsg('Account created successfully! Welcome to HumanLens.');
          setTimeout(() => {
            onAuthSuccess(res.user);
            onClose();
          }, 900);
        } else {
          setSuccessMsg('Verification email sent. Please check your inbox.');
        }
      } else {
        const res = await signInWithEmail(email, password);
        if (res.user) {
          setSuccessMsg('Welcome back!');
          setTimeout(() => {
            onAuthSuccess(res.user);
            onClose();
          }, 600);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[#0c0c0e] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle ambient light glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-sky-500/[0.03] rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.08] mb-1">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            {mode === 'signin' ? 'Sign in to HumanLens' : 'Create your account'}
          </h2>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            {mode === 'signin' 
              ? 'Access your communication health history, intercepted reflections, and custom presets.'
              : 'Start tracking communication tone, prevent impulsive regrets, and sync across devices.'}
          </p>
        </div>

        {/* Mode Switcher Pills */}
        <div className="flex p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
              mode === 'signin' 
                ? 'bg-white text-black shadow-sm font-semibold' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
              mode === 'signup' 
                ? 'bg-white text-black shadow-sm font-semibold' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400 ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] focus:border-white/30 rounded-2xl text-xs text-white placeholder-zinc-500 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-400 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] focus:border-white/30 rounded-2xl text-xs text-white placeholder-zinc-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-400 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] focus:border-white/30 rounded-2xl text-xs text-white placeholder-zinc-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-black" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-[11px] text-zinc-500">
            Protected by end-to-end local inference & encrypted Supabase cloud storage.
          </p>
        </div>
      </div>
    </div>
  );
};
