'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, BookOpen } from 'lucide-react';
import { ChatMessage } from '../types';

interface ReflectionChatProps {
  apiKey?: string;
}

export const ReflectionChat: React.FC<ReflectionChatProps> = ({ apiKey }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'I am the HumanLens Reflection Coach. If you are navigating a tense exchange, disagreement, or stress, ask me how to de-escalate or rephrase your thoughts.',
      timestamp: 'Now',
      citations: [
        {
          title: 'Nonviolent Communication (NVC)',
          framework: 'Rosenberg Behavioral Framework',
          snippet: 'Focusing on objective observations rather than personal evaluations removes defensive resistance.'
        }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: 'Now'
    };

    setMessages((prev) => [...prev, userMsg]);
    const messageToSend = input.trim();
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          geminiApiKey: apiKey
        })
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Let us step back and look at the underlying needs behind this message.',
        timestamp: 'Now',
        citations: data.citations
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pt-8 flex flex-col h-[76vh]">
      {/* Header */}
      <div className="text-center space-y-1 pb-3 border-b border-white/[0.06]">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Reflections
        </h1>
        <p className="text-[13px] text-[#86868b]">
          Non-judgmental communication advice grounded in behavioral research.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 py-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed tracking-tight ${
                m.role === 'user'
                  ? 'bg-white text-black font-normal rounded-tr-sm'
                  : 'apple-panel text-zinc-100 rounded-tl-sm space-y-2 border border-white/[0.08]'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {m.citations && m.citations.length > 0 && (
                <div className="pt-2 border-t border-white/[0.08] space-y-1">
                  <div className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-zinc-400" />
                    <span>Evidence Context</span>
                  </div>
                  {m.citations.map((c, i) => (
                    <div key={i} className="text-[11px] text-zinc-400 leading-snug">
                      <span className="text-white font-medium">{c.title}:</span> &ldquo;{c.snippet}&rdquo;
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-1.5 p-3 rounded-2xl apple-panel w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-1">
        <div className="apple-panel rounded-full p-1 pl-4 pr-1.5 flex items-center gap-2 border border-white/[0.12]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ask a question or describe a conflict..."
            className="flex-1 bg-transparent text-[13px] text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-all disabled:opacity-30 active:scale-95"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
