'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DeveloperApp } from '../../components/dev/DeveloperApp';

export default function ResearchPage() {
  const [apiKey, setApiKey] = useState('');
  const [hfUrl, setHfUrl] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedKey = localStorage.getItem('hl_gemini_api_key') || '';
    const savedHf = localStorage.getItem('hl_hf_space_url') || 'https://humanlens-ml.onrender.com';
    setApiKey(savedKey);
    setHfUrl(savedHf);
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('hl_gemini_api_key', key);
  };

  const handleSaveHfUrl = (url: string) => {
    setHfUrl(url);
    localStorage.setItem('hl_hf_space_url', url);
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-[#09090b] text-[#f4f4f5]">
      {/* Top Banner with direct return link */}
      <div className="border-b border-white/[0.08] bg-black/40 backdrop-blur-md px-6 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-zinc-400 hover:text-white font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Consumer App</span>
          </Link>
          <span className="text-zinc-600">|</span>
          <span className="text-emerald-400 font-mono flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Academic Defense & ML Research Studio</span>
          </span>
        </div>
        <div className="text-[11px] text-zinc-500 font-mono hidden sm:block">
          Scikit-Learn .pkl • Late Fusion • MediaPipe • Clinical RAG
        </div>
      </div>

      <DeveloperApp
        apiKey={apiKey}
        hfUrl={hfUrl}
        onSaveApiKey={handleSaveApiKey}
        onSaveHfUrl={handleSaveHfUrl}
        onSwitchToConsumer={() => { window.location.href = '/'; }}
      />
    </div>
  );
}
