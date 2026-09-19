'use client';

import React, { useState } from 'react';
import { X, Check, Clock, Dumbbell, Users } from 'lucide-react';
import { CheckinData } from '../types';

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckinSuccess: () => void;
  userId?: string;
}

export const CheckinModal: React.FC<CheckinModalProps> = ({ isOpen, onClose, onCheckinSuccess, userId }) => {
  const [stress, setStress] = useState(6);
  const [sleepHours, setSleepHours] = useState(6.5);
  const [mood, setMood] = useState(3);
  const [academicPressure, setAcademicPressure] = useState(7);
  const [screenTimeHours, setScreenTimeHours] = useState(6.5);
  const [exerciseMinutes, setExerciseMinutes] = useState(20);
  const [socialInteraction, setSocialInteraction] = useState(6);
  const [journal, setJournal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: CheckinData = {
        date: new Date().toISOString().split('T')[0],
        stress,
        sleepHours,
        mood,
        sleepQuality: sleepHours >= 7 ? 'good' : 'fair',
        academicPressure,
        socialInteraction,
        exerciseMinutes,
        screenTimeHours,
        journalNote: journal
      };

      await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, userId })
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onCheckinSuccess();
        onClose();
      }, 900);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
      <div className="apple-panel-elevated w-full max-w-md rounded-3xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto border border-white/[0.12] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Daily Check-in
            </h2>
            <p className="text-xs text-[#86868b]">
              Complete 8-dimension behavioral check-in (Section 5.2).
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders Form */}
        <div className="space-y-3.5">
          {/* Stress Level */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300 font-medium">Perceived Stress</span>
              <span className="font-mono text-white font-medium">{stress} / 10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={stress}
              onChange={(e) => setStress(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Sleep Duration */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300 font-medium">Sleep Duration</span>
              <span className="font-mono text-white font-medium">{sleepHours} hrs</span>
            </div>
            <input
              type="range"
              min={3}
              max={12}
              step={0.5}
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Screen Time (Section 5.2) */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Screen Time Exposure</span>
              </span>
              <span className="font-mono text-white font-medium">{screenTimeHours} hrs</span>
            </div>
            <input
              type="range"
              min={1}
              max={16}
              step={0.5}
              value={screenTimeHours}
              onChange={(e) => setScreenTimeHours(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Exercise / Physical Activity (Section 5.2) */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-zinc-400" />
                <span>Physical Exercise</span>
              </span>
              <span className="font-mono text-white font-medium">{exerciseMinutes} mins</span>
            </div>
            <input
              type="range"
              min={0}
              max={120}
              step={5}
              value={exerciseMinutes}
              onChange={(e) => setExerciseMinutes(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Social Connection (Section 5.2) */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span>Social Connection</span>
              </span>
              <span className="font-mono text-white font-medium">{socialInteraction} / 10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={socialInteraction}
              onChange={(e) => setSocialInteraction(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Mood Selector */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300 font-medium">Daily Affect / Mood</span>
              <span className="font-mono text-white text-[11px]">{['Low', 'Subdued', 'Neutral', 'Pleasant', 'Calm'][mood - 1]}</span>
            </div>
            <div className="grid grid-cols-5 gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`py-1 rounded-xl text-xs font-medium transition-all ${
                    mood === m ? 'bg-white text-black font-semibold' : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                  }`}
                >
                  {['1', '2', '3', '4', '5'][m - 1]}
                </button>
              ))}
            </div>
          </div>

          {/* Context Note */}
          <div className="space-y-1">
            <input
              type="text"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="Context note (e.g. project presentation, team deadline)"
              className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-1.5 active:scale-95"
          >
            {submitted ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Recorded</span>
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
