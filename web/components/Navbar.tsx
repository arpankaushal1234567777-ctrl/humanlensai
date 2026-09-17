'use client';

import React from 'react';
import { Sliders, MessageSquare, Activity, Camera, Sparkles, Plus } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCheckin: () => void;
  onOpenSettings: () => void;
  isOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCheckin,
  onOpenSettings,
}) => {
  const tabs = [
    { id: 'speak', label: 'Intervene', icon: MessageSquare },
    { id: 'behavior', label: 'Behavior', icon: Activity },
    { id: 'mirror', label: 'Mirror', icon: Camera },
    { id: 'chat', label: 'Reflections', icon: Sparkles },
  ];

  return (
    <header className="sticky top-5 z-40 w-full max-w-4xl mx-auto px-4">
      <div className="apple-panel rounded-full px-3.5 py-2 flex items-center justify-between shadow-2xl transition-all">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('speak')}
          className="flex items-center space-x-2.5 cursor-pointer pl-2 select-none group"
        >
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-black font-semibold text-[11px] tracking-tight transition-transform group-hover:scale-105">
            HL
          </div>
          <span className="text-[13px] font-medium tracking-tight text-white/90">
            HumanLens
          </span>
        </div>

        {/* macOS Style Segmented Control */}
        <nav className="hidden md:flex items-center p-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 pr-1">
          <button
            onClick={onOpenCheckin}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.08] transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-300" />
            <span>Check-in</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Settings & Cloud AI"
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile nav pills */}
      <div className="flex md:hidden justify-center mt-2.5">
        <div className="apple-panel rounded-full p-1 flex items-center space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-2 rounded-full text-xs transition-all ${
                  isActive ? 'bg-white text-black' : 'text-zinc-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
