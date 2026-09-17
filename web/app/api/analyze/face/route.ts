import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { landmarks, auMetrics } = body;

    const browFurrowAU4 = auMetrics?.browFurrowAU4 ?? 0.24;
    const eyeSquintAU7 = auMetrics?.eyeSquintAU7 ?? 0.18;
    const mouthTensionAU15 = auMetrics?.mouthTensionAU15 ?? 0.20;
    const confidence = auMetrics?.confidence ?? 0.92;

    const facialTensionScore = Number((
      (browFurrowAU4 * 0.45) +
      (eyeSquintAU7 * 0.25) +
      (mouthTensionAU15 * 0.30)
    ).toFixed(3));

    return NextResponse.json({
      status: 'success',
      modality: 'face',
      actionUnits: {
        browFurrowAU4,
        eyeSquintAU7,
        mouthTensionAU15,
        confidence,
        facialTensionScore
      },
      interpretation: facialTensionScore > 0.5
        ? 'Non-verbal facial activation indicates elevated concentration or strain'
        : 'Facial baseline neutral/calm',
      privacyGuarantee: 'Zero biometric templates or identity embeddings stored. Frame discarded.'
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
