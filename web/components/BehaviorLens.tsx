'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Plus } from 'lucide-react';
import { BehaviorSummary } from '../types';

interface BehaviorLensProps {
  onOpenCheckin: () => void;
}

export const BehaviorLens: React.FC<BehaviorLensProps> = ({ onOpenCheckin }) => {
  const [data, setData] = useState<BehaviorSummary | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    fetch('/api/behavior/summary')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="apple-panel-elevated p-2.5 rounded-xl border border-white/20 text-xs space-y-1 shadow-2xl">
          <div className="font-medium text-white">{label}</div>
          <div className="text-zinc-300 font-mono">Stress: {payload[0]?.value} / 10</div>
          <div className="text-zinc-400 font-mono">Sleep: {payload[1]?.value} hrs</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Behavior Lens
          </h1>
          <p className="text-[13px] text-[#86868b] mt-0.5">
            Longitudinal context. Patterns over time, not judgment from a single moment.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="p-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center text-xs">
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${timeframe === '7d' ? 'bg-white text-black' : 'text-zinc-400'}`}
            >
              7D
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${timeframe === '30d' ? 'bg-white text-black' : 'text-zinc-400'}`}
            >
              30D
            </button>
          </div>

          <button
            onClick={onOpenCheckin}
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Check-in</span>
          </button>
        </div>
      </div>

      {/* Apple Health-Style Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="apple-panel p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Sleep Average</span>
          <div className="text-2xl font-semibold tracking-tight text-white">
            {data?.avgSleep || 5.7}<span className="text-xs font-normal text-zinc-500 ml-1">hrs</span>
          </div>
          <p className="text-[11px] text-zinc-400">-1.3h under personal target</p>
        </div>

        <div className="apple-panel p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Stress Index</span>
          <div className="text-2xl font-semibold tracking-tight text-white">
            {data?.avgStress || 6.9}<span className="text-xs font-normal text-zinc-500 ml-1">/10</span>
          </div>
          <p className="text-[11px] text-zinc-400">Peak observed mid-week</p>
        </div>

        <div className="apple-panel p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Affect Rating</span>
          <div className="text-2xl font-semibold tracking-tight text-white">
            {data?.avgMood || 2.6}<span className="text-xs font-normal text-zinc-500 ml-1">/5</span>
          </div>
          <p className="text-[11px] text-zinc-400">Moderate fluctuation</p>
        </div>

        <div className="apple-panel p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Reactivity Window</span>
          <div className="text-2xl font-semibold tracking-tight text-white">
            Elevated
          </div>
          <p className="text-[11px] text-zinc-400">Higher risk of impulsive replies</p>
        </div>
      </div>

      {/* Minimal Monochrome Chart */}
      <div className="apple-panel rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white tracking-tight">
            Stress &amp; Sleep Correlation
          </span>
          <div className="flex items-center space-x-4 text-[11px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-0.5 bg-white"></span> Stress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-0.5 bg-zinc-500"></span> Sleep
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          {data?.trends && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="appleStress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="appleSleep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} domain={[0, 10]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="stress" stroke="#ffffff" strokeWidth={1.5} fillOpacity={1} fill="url(#appleStress)" />
                <Area type="monotone" dataKey="sleep" stroke="#71717a" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={1} fill="url(#appleSleep)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Clean Observational Insights */}
      <div className="space-y-3">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
          Observed Behavioral Correlations
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data?.insights.map((ins) => (
            <div key={ins.id} className="apple-panel p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white tracking-tight">
                  {ins.title}
                </h4>
                <span className="text-[10px] font-mono text-zinc-500">
                  {ins.type}
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                {ins.description}
              </p>
              <p className="text-[10px] text-zinc-500 italic pt-1 border-t border-white/[0.04]">
                Note: {ins.disclaimer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
