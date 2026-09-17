// Supabase Free Tier Cloud Database Client
// Works in both Client (Browser) & Server (Node.js/Edge)
// Reads credentials from process.env or localStorage

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface SupabaseTestResult {
  ok: boolean;
  message: string;
  count?: number;
}

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export function getSupabaseCredentials(): SupabaseConfig {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  
  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('hl_supabase_url');
    const localKey = localStorage.getItem('hl_supabase_key');
    if (localUrl && localKey) {
      url = localUrl;
      key = localKey;
    }
  }

  return { supabaseUrl: url.trim(), supabaseAnonKey: key.trim() };
}

export function isSupabaseConnected(): boolean {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    (supabaseUrl.includes('.supabase.co') || supabaseUrl.includes('localhost') || supabaseUrl.startsWith('http'))
  );
}

/**
 * Tests connection to the Supabase REST endpoint by querying the public knowledge_chunks or users table
 */
export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<SupabaseTestResult> {
  const url = (customUrl || getSupabaseCredentials().supabaseUrl).trim().replace(/\/$/, '');
  const key = (customKey || getSupabaseCredentials().supabaseAnonKey).trim();

  if (!url || !key) {
    return { ok: false, message: 'URL and Anon Key must not be empty.' };
  }

  try {
    const res = await fetch(`${url}/rest/v1/knowledge_chunks?select=id,title&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ok: true,
        message: `Successfully connected to Supabase PostgreSQL! (${data.length} sample records verified)`,
        count: data.length
      };
    } else {
      const text = await res.text();
      return {
        ok: false,
        message: `Supabase returned HTTP ${res.status}: ${text || res.statusText}`
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      message: `Connection failed: ${err.message || 'Network error or invalid Supabase URL'}`
    };
  }
}

/**
 * Saves a daily check-in to public.behavior_logs
 */
export async function saveCheckinToSupabase(data: {
  stress: number;
  mood: number;
  sleepHours: number;
  academicPressure: number;
  socialInteraction?: number;
  exerciseMinutes?: number;
  screenTimeHours?: number;
  journalNote?: string;
  date?: string;
  userId?: string;
}) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
  if (!isSupabaseConnected()) return null;

  const url = supabaseUrl.replace(/\/$/, '');
  const body = {
    user_id: data.userId || DEMO_USER_ID,
    date: data.date || new Date().toISOString().split('T')[0],
    stress: data.stress,
    mood: data.mood,
    sleep_hours: data.sleepHours,
    academic_pressure: data.academicPressure,
    social_score: data.socialInteraction || 5,
    exercise_minutes: data.exerciseMinutes || 0,
    screen_time_hours: data.screenTimeHours || 0,
    journal_note: data.journalNote || null
  };

  try {
    const res = await fetch(`${url}/rest/v1/behavior_logs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Supabase saveCheckin error:', err);
  }
  return null;
}

/**
 * Fetches recent behavior logs from public.behavior_logs
 */
export async function fetchCheckinsFromSupabase(userId: string = DEMO_USER_ID, limit: number = 30) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
  if (!isSupabaseConnected()) return null;

  try {
    const res = await fetch(
      `${supabaseUrl.replace(/\/$/, '')}/rest/v1/behavior_logs?user_id=eq.${userId}&order=date.desc&limit=${limit}`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      }
    );

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Supabase fetchCheckins error:', err);
  }
  return null;
}

/**
 * Saves an intervention event to public.interventions
 */
export async function saveInterventionToSupabase(data: {
  userId?: string;
  triggerType: string;
  multimodalConfidence: number;
  originalText: string;
  coachingStrategy: string;
  userAction: 'accepted_rewrite' | 'sent_original' | 'edited_manually' | 'cooled_down' | 'dismissed';
}) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
  if (!isSupabaseConnected()) return null;

  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/interventions`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: data.userId || DEMO_USER_ID,
        trigger_type: data.triggerType,
        multimodal_confidence: data.multimodalConfidence,
        original_text: data.originalText,
        coaching_strategy: data.coachingStrategy,
        user_action: data.userAction
      })
    });

    return res.ok;
  } catch (err) {
    console.warn('Supabase saveIntervention error:', err);
    return false;
  }
}
