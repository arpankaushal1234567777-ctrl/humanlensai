'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DeveloperApp } from '../../components/dev/DeveloperApp';

export default function DevPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [hfUrl, setHfUrl] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setApiKey(localStorage.getItem('hl_gemini_api_key') || '');
    setHfUrl(localStorage.getItem('hl_hf_space_url') || '');
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
    <DeveloperApp
      apiKey={apiKey}
      hfUrl={hfUrl}
      onSaveApiKey={handleSaveApiKey}
      onSaveHfUrl={handleSaveHfUrl}
      onSwitchToConsumer={() => {
        localStorage.setItem('hl_app_mode', 'consumer');
        router.push('/');
      }}
    />
  );
}
