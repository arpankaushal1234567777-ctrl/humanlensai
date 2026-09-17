import { NextRequest, NextResponse } from 'next/server';
import { analyzeMultimodalPayload } from '../../../../lib/analysisEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, audioBase64, faceMetrics, behaviorContext, geminiApiKey } = body;

    const result = await analyzeMultimodalPayload({
      text,
      audioBase64,
      faceMetrics,
      behaviorContext,
      geminiApiKey
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message || 'Internal server error' }, { status: 500 });
  }
}
