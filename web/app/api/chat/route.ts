import { NextRequest, NextResponse } from 'next/server';
import { retrieveRelevantKnowledge } from '../../../lib/ragKnowledge';

export async function POST(req: NextRequest) {
  try {
    const { message, history, geminiApiKey } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ status: 'error', message: 'Message is required.' }, { status: 400 });
    }

    const citations = retrieveRelevantKnowledge(message);
    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

    let assistantResponse = '';

    if (apiKey) {
      try {
        const evidenceContext = citations.map(c => `[Source: ${c.source}] ${c.title}: ${c.content}`).join('\n\n');
        const systemPrompt = `You are HumanLens AI Coach, an empathetic, non-diagnostic wellbeing and communication reflection assistant.
You strictly adhere to non-judgmental guidance, nonviolent communication, and emotional de-escalation.
Never diagnose psychiatric conditions.
Ground your response using this curated research evidence where applicable:
${evidenceContext}

User message: ${message}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }]
          })
        });

        if (res.ok) {
          const data = await res.json();
          assistantResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch (e) {
        console.warn('Gemini chat fallback:', e);
      }
    }

    if (!assistantResponse) {
      // High-quality deterministic fallback response grounded in retrieved evidence
      const topCitation = citations[0];
      assistantResponse = `I hear how challenging this moment feels. When tension runs high in digital communication, our physiological impulse is often to push back immediately. 

Evidence from *${topCitation.source}* indicates that **${topCitation.title.toLowerCase()}** can create the cognitive space you need to respond constructively:
> "${topCitation.actionableStep}"

Would you like to try reframing the message using an observation-based structure rather than direct confrontation?`;
    }

    return NextResponse.json({
      status: 'success',
      reply: assistantResponse,
      citations: citations.map(c => ({
        title: c.title,
        framework: c.source,
        snippet: c.actionableStep
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message || 'Error processing chat' }, { status: 500 });
  }
}
