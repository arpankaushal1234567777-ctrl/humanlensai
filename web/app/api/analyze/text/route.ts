import { NextRequest, NextResponse } from 'next/server';
import { analyzeMultimodalPayload } from '../../../../lib/analysisEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, behaviorContext, geminiApiKey, hfUrl } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ status: 'error', message: 'Text is required.' }, { status: 400 });
    }

    // Check if Python ML microservice is reachable (custom hfUrl, env var, or live Render cloud URL)
    const pythonUrl = hfUrl || process.env.RESEARCH_ML_API_URL || process.env.NEXT_PUBLIC_HF_SPACE_URL || process.env.PYTHON_ML_URL || 'https://humanlens-ml.onrender.com';
    let pythonResult: any = null;

    if (pythonUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${pythonUrl.replace(/\/$/, '')}/analyze/text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, behavior_context: behaviorContext }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (res.ok) {
          pythonResult = await res.json();
        }
      } catch (e) {
        // Python microservice offline or timed out, gracefully use fast edge engine
      }
    }

    const result = await analyzeMultimodalPayload({
      text,
      behaviorContext,
      geminiApiKey
    });

    // If Python ML result is present, augment with research ML probabilities
    if (pythonResult && pythonResult.text) {
      result.textAnalysis.toxicity = Number(pythonResult.text.toxicity !== undefined ? pythonResult.text.toxicity.toFixed(3) : result.textAnalysis.toxicity);
      result.textAnalysis.aggression = Number(pythonResult.text.aggression !== undefined ? pythonResult.text.aggression.toFixed(3) : result.textAnalysis.aggression);
      if (pythonResult.text.emotion) {
        result.textAnalysis.primaryEmotion = pythonResult.text.emotion;
      }
      (result as any).pythonMl = {
        active: true,
        source: pythonUrl,
        pipelineScores: pythonResult.modality_scores || pythonResult.text,
        fusionScore: pythonResult.fusion?.score
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message || 'Internal server error' }, { status: 500 });
  }
}
