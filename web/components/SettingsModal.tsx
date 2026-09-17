'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  hfUrl?: string;
  onSaveHfUrl?: (url: string) => void;
  supabaseUrl?: string;
  onSaveSupabaseUrl?: (url: string) => void;
  supabaseKey?: string;
  onSaveSupabaseKey?: (key: string) => void;
  isAdminMode?: boolean;
  onToggleAdminMode?: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  hfUrl = '',
  onSaveHfUrl,
  supabaseUrl = '',
  onSaveSupabaseUrl,
  supabaseKey = '',
  onSaveSupabaseKey,
  isAdminMode = false,
  onToggleAdminMode
}) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localHfUrl, setLocalHfUrl] = useState(hfUrl);
  const [localAdmin, setLocalAdmin] = useState(isAdminMode);
  const [localSupabaseUrl, setLocalSupabaseUrl] = useState(supabaseUrl);
  const [localSupabaseKey, setLocalSupabaseKey] = useState(supabaseKey);
  const [testStatus, setTestStatus] = useState<{ testing: boolean; message: string; success?: boolean } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalApiKey(apiKey);
    setLocalHfUrl(hfUrl);
    setLocalAdmin(isAdminMode);
    
    if (typeof window !== 'undefined') {
      const savedSbUrl = localStorage.getItem('hl_supabase_url') || supabaseUrl;
      const savedSbKey = localStorage.getItem('hl_supabase_key') || supabaseKey;
      setLocalSupabaseUrl(savedSbUrl);
      setLocalSupabaseKey(savedSbKey);
    }
  }, [apiKey, hfUrl, isAdminMode, supabaseUrl, supabaseKey]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!localSupabaseUrl.trim() || !localSupabaseKey.trim()) {
      setTestStatus({ testing: false, message: 'Please provide both URL and Anon Key.', success: false });
      return;
    }
    setTestStatus({ testing: true, message: 'Pinging Supabase REST API...' });
    try {
      const res = await fetch('/api/supabase/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: localSupabaseUrl.trim(), key: localSupabaseKey.trim() })
      });
      const data = await res.json();
      if (data.ok) {
        setTestStatus({ testing: false, message: '● Connected to Supabase Cloud PostgreSQL!', success: true });
      } else {
        setTestStatus({ testing: false, message: data.message || 'Connection failed.', success: false });
      }
    } catch (err: any) {
      setTestStatus({ testing: false, message: `Error: ${err.message}`, success: false });
    }
  };

  const handleSave = () => {
    onSaveApiKey(localApiKey.trim());
    if (onSaveHfUrl) onSaveHfUrl(localHfUrl.trim());
    if (onToggleAdminMode) onToggleAdminMode(localAdmin);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('hl_supabase_url', localSupabaseUrl.trim());
      localStorage.setItem('hl_supabase_key', localSupabaseKey.trim());
    }
    if (onSaveSupabaseUrl) onSaveSupabaseUrl(localSupabaseUrl.trim());
    if (onSaveSupabaseKey) onSaveSupabaseKey(localSupabaseKey.trim());

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/checkins');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `humanlens_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteData = () => {
    if (confirm('Delete all stored telemetry and session data?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
      <div className="apple-panel-elevated w-full max-w-md rounded-3xl p-6 sm:p-7 space-y-5 max-h-[88vh] overflow-y-auto border border-white/[0.12] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Settings &amp; AI Cloud
            </h2>
            <p className="text-xs text-[#86868b]">
              Cloud intelligence configuration and telemetry preferences.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin / Inspector Mode Toggle */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-medium text-white">Admin / Inspector Telemetry</div>
            <div className="text-[11px] text-zinc-500">
              Reveals raw ML probabilities (Toxicity, Insult, Fusion scores). Kept off by default for consumer empathy.
            </div>
          </div>
          <button
            onClick={() => setLocalAdmin(!localAdmin)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors ${localAdmin ? 'bg-white' : 'bg-white/10'}`}
          >
            <div className={`w-5 h-5 rounded-full transition-transform ${localAdmin ? 'translate-x-5 bg-black' : 'bg-white/60'}`} />
          </button>
        </div>

        {/* Supabase Cloud Database (Free Tier) */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-200 font-medium">Supabase Cloud Database (Free PostgreSQL)</span>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
            >
              supabase.com <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Project URL</label>
              <input
                type="text"
                value={localSupabaseUrl}
                onChange={(e) => setLocalSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Public Anon Key</label>
              <input
                type="password"
                value={localSupabaseKey}
                onChange={(e) => setLocalSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOi..."
                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus?.testing}
              className="px-3 py-1 rounded-full text-[11px] font-medium bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/10 transition-colors"
            >
              {testStatus?.testing ? 'Testing...' : 'Test Connection'}
            </button>

            {testStatus && (
              <span
                className={`text-[11px] font-mono ${
                  testStatus.success ? 'text-emerald-400 font-medium' : 'text-rose-400'
                }`}
              >
                {testStatus.message}
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 leading-snug">
            Paste credentials from your free Supabase project after executing `supabase/schema.sql`.
          </p>
        </div>

        {/* Gemini API Key */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-200 font-medium">Google Gemini API Key (Free)</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
            >
              Get Key <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <input
            type="password"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="AIzaSy... (enables live Gemini de-escalation rewrites)"
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-white/30"
          />
          <p className="text-[11px] text-zinc-500 leading-snug">
            Free tier on Google AI Studio. Generates live contextual de-escalation rewrites.
          </p>
        </div>

        {/* Hugging Face ML URL */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-200 font-medium">Hugging Face Space ML URL</span>
            <span className="text-[10px] font-mono text-zinc-500">Free 16GB Cloud</span>
          </div>
          <input
            type="text"
            value={localHfUrl}
            onChange={(e) => setLocalHfUrl(e.target.value)}
            placeholder="https://your-name-humanlens-ml.hf.space"
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-white/30"
          />
          <p className="text-[11px] text-zinc-500 leading-snug">
            Optional external microservice URL for full Python ML models (`research_ml`).
          </p>
        </div>

        {/* Privacy & Ownership */}
        <div className="space-y-2.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <span className="text-xs text-zinc-300 font-medium">Privacy &amp; Data Control</span>
          <p className="text-[11px] text-zinc-400 leading-snug">
            No camera feeds, audio recordings, or biometric identities are stored.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleExportData}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={handleDeleteData}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] transition-colors"
            >
              Reset Data
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-1.5 active:scale-95"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
