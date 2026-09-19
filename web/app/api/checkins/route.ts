import { NextRequest, NextResponse } from 'next/server';
import { saveCheckinToSupabase, fetchCheckinsFromSupabase, isSupabaseConnected } from '@/lib/supabaseClient';

// Serverless in-memory fallback store for session continuity
let checkinsStore: any[] = [
  { date: '2026-09-11', stress: 7, sleepHours: 5.5, mood: 2, academicPressure: 8, socialInteraction: 4, exerciseMinutes: 15, screenTimeHours: 7.2 },
  { date: '2026-09-12', stress: 8, sleepHours: 5.0, mood: 2, academicPressure: 9, socialInteraction: 3, exerciseMinutes: 0, screenTimeHours: 8.5 },
  { date: '2026-09-13', stress: 6, sleepHours: 6.5, mood: 3, academicPressure: 7, socialInteraction: 6, exerciseMinutes: 30, screenTimeHours: 6.0 },
  { date: '2026-09-14', stress: 8, sleepHours: 4.5, mood: 1, academicPressure: 9, socialInteraction: 2, exerciseMinutes: 10, screenTimeHours: 9.0 },
  { date: '2026-09-15', stress: 5, sleepHours: 7.5, mood: 4, academicPressure: 5, socialInteraction: 8, exerciseMinutes: 45, screenTimeHours: 4.5 },
  { date: '2026-09-16', stress: 7, sleepHours: 5.8, mood: 2, academicPressure: 8, socialInteraction: 5, exerciseMinutes: 20, screenTimeHours: 7.0 },
  { date: '2026-09-17', stress: 7, sleepHours: 5.2, mood: 2, academicPressure: 8, socialInteraction: 4, exerciseMinutes: 10, screenTimeHours: 8.0 },
];

export async function GET() {
  if (isSupabaseConnected()) {
    try {
      const logs = await fetchCheckinsFromSupabase();
      if (logs && logs.length > 0) {
        const formatted = logs.map((item: any) => ({
          date: item.date,
          stress: Number(item.stress),
          sleepHours: Number(item.sleep_hours),
          mood: Number(item.mood),
          academicPressure: Number(item.academic_pressure),
          socialInteraction: Number(item.social_score),
          exerciseMinutes: Number(item.exercise_minutes),
          screenTimeHours: Number(item.screen_time_hours),
          journalNote: item.journal_note
        }));
        return NextResponse.json({ status: 'success', checkins: formatted, source: 'supabase' });
      }
    } catch (e) {
      console.warn('Supabase fetch failed in /api/checkins GET, using fallback:', e);
    }
  }

  return NextResponse.json({ status: 'success', checkins: checkinsStore, source: 'local_store' });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const entry = {
      ...data,
      date: data.date || new Date().toISOString().split('T')[0]
    };
    checkinsStore.push(entry);

    let supabasePersisted = false;
    if (isSupabaseConnected()) {
      const saved = await saveCheckinToSupabase({
        userId: entry.userId,
        stress: entry.stress,
        mood: entry.mood,
        sleepHours: entry.sleepHours,
        academicPressure: entry.academicPressure,
        socialInteraction: entry.socialInteraction,
        exerciseMinutes: entry.exerciseMinutes,
        screenTimeHours: entry.screenTimeHours,
        journalNote: entry.journalNote,
        date: entry.date
      });
      supabasePersisted = Boolean(saved);
    }

    return NextResponse.json({
      status: 'success',
      message: 'Check-in recorded.',
      supabasePersisted,
      total: checkinsStore.length
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

