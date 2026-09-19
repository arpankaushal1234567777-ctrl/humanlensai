import { NextRequest, NextResponse } from 'next/server';
import { saveInterventionToSupabase, DEMO_USER_ID } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { userId, frictionScore, text } = await req.json();

    if (frictionScore === undefined) {
      return NextResponse.json({ status: 'error', message: 'Friction score required' }, { status: 400 });
    }

    // Save to the interventions table. We use this table to track friction events.
    await saveInterventionToSupabase({
      userId: userId || DEMO_USER_ID,
      triggerType: 'high_friction_detected',
      multimodalConfidence: Number(frictionScore),
      originalText: text || 'redacted',
      coachingStrategy: 'extension_auto_log',
      userAction: 'dismissed' // Default silent action
    });

    return NextResponse.json({ status: 'success', message: 'Friction event securely logged.' });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
