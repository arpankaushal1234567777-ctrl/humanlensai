import { NextRequest, NextResponse } from 'next/server';
import { synthesizeRewrites } from '@/lib/analysisEngine';
import { RAG_KNOWLEDGE_BASE } from '@/lib/ragKnowledge';

export async function POST(req: NextRequest) {
  try {
    const { text, overallScore, riskLevel, primaryEmotion, stylePreference } = await req.json();

    if (!text) {
      return NextResponse.json({ status: 'error', message: 'Text is required.' }, { status: 400 });
    }

    const rewrites = synthesizeRewrites(text, primaryEmotion || 'Anger / Frustration');
    const filteredRewrites = stylePreference 
      ? rewrites.filter(r => r.style.toLowerCase().includes(stylePreference.toLowerCase()))
      : rewrites;

    return NextResponse.json({
      status: 'success',
      intervention: {
        title: 'BEFORE YOU SPEAK — Pause & Reflect',
        coolingPause: {
          durationSeconds: 20,
          pattern: 'Box Breathing (4s Inhale → 4s Hold → 4s Exhale → 4s Hold)',
          evidence: 'Physiological sigh downregulation rapidly resets autonomic reactivity.'
        },
        rewrites: filteredRewrites.length > 0 ? filteredRewrites : rewrites,
        supportingEvidence: RAG_KNOWLEDGE_BASE.slice(0, 2)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
