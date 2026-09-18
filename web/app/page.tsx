'use client';

import React, { useState, useEffect } from 'react';
import { ConsumerApp } from '../components/consumer/ConsumerApp';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedKey = localStorage.getItem('hl_gemini_api_key') || '';
    setApiKey(savedKey);
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('hl_gemini_api_key', key);
  };

  if (!mounted) return null;

  return (
    <ConsumerApp
      apiKey={apiKey}
      onSaveApiKey={handleSaveApiKey}
    />
  );
}
