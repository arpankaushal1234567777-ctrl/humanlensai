'use client';

import React, { useState } from 'react';
import { BeforeYouSpeak } from '../BeforeYouSpeak';
import { BehaviorLens } from '../BehaviorLens';
import { EmotionMirror } from '../EmotionMirror';
import { ReflectionChat } from '../ReflectionChat';
import { CheckinModal } from '../CheckinModal';
import { SettingsModal } from '../SettingsModal';
import { Sliders, MessageSquare, Activity, Camera, Sparkles, Plus, Terminal, ArrowLeft } from 'lucide-react';

interface DeveloperAppProps {
  apiKey: string;
  hfUrl: string;
  onSaveApiKey: (key: string) => void;
  onSaveHfUrl: (url: string) => void;
  onSwitchToConsumer: () => void;
}

export const DeveloperApp: React.FC<DeveloperAppProps> = ({
  apiKey,
  hfUrl,
  onSaveApiKey,
  onSaveHfUrl,
  onSwitchToConsumer
}) => {
  const [activeTab, setActiveTab] = useState('speak');
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(true);

  const tabs = [
    { id: 'speak', label: 'Intervention Studio', icon: MessageSquare },
    { id: 'behavior', label: 'Behavior Modeling', icon: Activity },
    { id: 'mirror', label: 'Action Unit Mirror', icon: Camera },
    { id: 'chat', label: 'RAG Knowledge', icon: Sparkles },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Developer Top Banner for Academic Showcase */}
      <div className="w-full bg-zinc-950 border-b border-white/[0.08] px-4 py-2 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-zinc-300 font-semibold">ENGINEERING &amp; ML RESEARCH STUDIO</span>
          <span className="text-zinc-500 hidden sm:inline">&bull; Member 1, 2, 3 Complete Suite</span>
        </div>

        <button
          onClick={onSwitchToConsumer}
          className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span> Consumer App</span>
        </button>
      </div>

      {/* Floating Developer Nav Bar */}
      <header className="sticky top-4 z-40 w-full max-w-5xl mx-auto px-4 mt-3">
        <div className="apple-panel rounded-full px-4 py-2.5 flex items-center justify-between shadow-2xl transition-all">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm tracking-tight text-zinc-100 flex items-center gap-1.5 font-mono">
              HumanLens <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-emerald-300">DEV MODE</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-1 p-1 rounded-full bg-black/40 border border-white/5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCheckinOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-200 border border-white/10 hover:bg-zinc-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate Check-in</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Cloud & Telemetry Settings"
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dev Views */}
      <main className="flex-1 px-4 sm:px-6">
        {activeTab === 'speak' && (
          <BeforeYouSpeak
            apiKey={apiKey}
            isAdminMode={true}
          />
        )}
        {activeTab === 'behavior' && (
          <BehaviorLens
            onOpenCheckin={() => setIsCheckinOpen(true)}
          />
        )}
        {activeTab === 'mirror' && (
          <EmotionMirror />
        )}
        {activeTab === 'chat' && (
          <ReflectionChat
            apiKey={apiKey}
          />
        )}
      </main>

      {/* Modals */}
      <CheckinModal
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        onCheckinSuccess={() => {}}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={onSaveApiKey}
        hfUrl={hfUrl}
        onSaveHfUrl={onSaveHfUrl}
        isAdminMode={isAdminMode}
        onToggleAdminMode={setIsAdminMode}
      />
    </div>
  );
};
