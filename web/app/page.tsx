'use client';

import React, { useState, useEffect } from 'react';
import { ConsumerApp } from '../components/consumer/ConsumerApp';
import { DeveloperApp } from '../components/dev/DeveloperApp';

export default function Home() {
  const [currentMode, setCurrentMode] = useState<'consumer' | 'developer'>('consumer');
  const [apiKey, setApiKey] = useState('');
  const [hfUrl, setHfUrl] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedKey = localStorage.getItem('hl_gemini_api_key') || '';
    const savedHf = localStorage.getItem('hl_hf_space_url') || '';
    const savedMode = localStorage.getItem('hl_app_mode') as 'consumer' | 'developer';
    setApiKey(savedKey);
    setHfUrl(savedHf);
    if (savedMode) setCurrentMode(savedMode);
  }, []);

  const handleSwitchMode = (mode: 'consumer' | 'developer') => {
    setCurrentMode(mode);
    localStorage.setItem('hl_app_mode', mode);
  };

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
    <>
      {currentMode === 'consumer' ? (
        <ConsumerApp
          apiKey={apiKey}
          onSaveApiKey={handleSaveApiKey}
          onSwitchToDev={() => handleSwitchMode('developer')}
        />
      ) : (
        <DeveloperApp
          apiKey={apiKey}
          hfUrl={hfUrl}
          onSaveApiKey={handleSaveApiKey}
          onSaveHfUrl={handleSaveHfUrl}
          onSwitchToConsumer={() => handleSwitchMode('consumer')}
        />
      )}
    </>
  );
}
