import { NextRequest, NextResponse } from 'next/server';

let profilesStore: Record<string, any> = {
  'demo-user': {
    userId: 'demo-user',
    email: 'user@humanlens.ai',
    fullName: 'Demo Student',
    ageRange: '18-24',
    generationGroup: 'Gen Z',
    studentStatus: 'undergraduate',
    preferences: { toneReminders: true, dailyCheckinNotice: true },
    updatedAt: new Date().toISOString()
  }
};

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || 'demo-user';
  return NextResponse.json({ status: 'success', profile: profilesStore[userId] || profilesStore['demo-user'] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || 'demo-user';
    profilesStore[userId] = {
      ...profilesStore[userId],
      ...body,
      updatedAt: new Date().toISOString()
    };
    return NextResponse.json({ status: 'success', message: 'Profile updated.', profile: profilesStore[userId] });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
