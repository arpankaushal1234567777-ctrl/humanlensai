import { NextRequest, NextResponse } from 'next/server';
import { testSupabaseConnection } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { url, key } = await req.json();
    const result = await testSupabaseConnection(url, key);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}

export async function GET() {
  const result = await testSupabaseConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
