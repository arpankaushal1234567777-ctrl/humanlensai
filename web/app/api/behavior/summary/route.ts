import { NextResponse } from 'next/server';

export async function GET() {
  // Calculated 7-day baseline trends
  const trends = [
    { date: 'Mon', stress: 7.2, sleep: 5.5, mood: 2.2, strain: 0.72 },
    { date: 'Tue', stress: 8.0, sleep: 5.0, mood: 2.0, strain: 0.81 },
    { date: 'Wed', stress: 6.1, sleep: 6.5, mood: 3.1, strain: 0.48 },
    { date: 'Thu', stress: 8.4, sleep: 4.5, mood: 1.8, strain: 0.88 },
    { date: 'Fri', stress: 5.0, sleep: 7.5, mood: 4.0, strain: 0.32 },
    { date: 'Sat', stress: 6.8, sleep: 5.8, mood: 2.5, strain: 0.65 },
    { date: 'Sun', stress: 7.1, sleep: 5.2, mood: 2.3, strain: 0.71 },
  ];

  return NextResponse.json({
    daysTracked: 7,
    avgStress: 6.9,
    avgSleep: 5.7,
    avgMood: 2.6,
    recentStrainScore: 0.71,
    insights: [
      {
        id: 'ins-1',
        type: 'correlation',
        title: 'Sleep Deficit & Communication Friction',
        description: 'During the past 7 days, your communication intensity indicators were 42% higher on days where sleep was recorded below 5.5 hours.',
        disclaimer: 'Observed statistical association in voluntary self-reports, not a clinical diagnosis.'
      },
      {
        id: 'ins-2',
        type: 'observation',
        title: 'Midweek Academic Peak',
        description: 'Academic pressure peaked on Thursday alongside elevated stress (8.4/10). Friday showed significant physiological recovery after 7.5 hours of sleep.',
        disclaimer: 'Contextual metric intended for self-reflection.'
      }
    ],
    trends
  });
}
