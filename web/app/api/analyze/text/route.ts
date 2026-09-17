import { NextRequest, NextResponse } from 'next/server';
import { analyzeMultimodalPayload } from '../../../../lib/analysisEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, behaviorContext, geminiApiKey } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ status: 'error', message: 'Text is required.' }, { status: 400 });
    }

    const result = await analyzeMultimodalPayload({
      text,
      behaviorContext,
      geminiApiKey
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message || 'Internal server error' }, { status: 500 });
  }
}
