export type RiskLevel = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';

export interface RewriteOption {
  style: 'Direct & Professional' | 'Assertive & Needs-Focused' | 'Collaborative Inquiry';
  text: string;
  rationale: string;
}

export interface PerceptionFeedback {
  toneTag: string;
  recipientImpact: string;
  preservesIntentSummary: string;
  behavioralContextHint?: string;
}

export interface InterventionCard {
  triggered: boolean;
  title: string;
  subtitle: string;
  riskLevel: RiskLevel;
  overallScore: number;
  pauseDurationSeconds: number;
  breathingGuide: string;
  perception: PerceptionFeedback;
  contributingFactors: {
    name: string;
    percentage: number;
    description: string;
  }[];
  rewrites: RewriteOption[];
  evidenceSnippet?: string;
  evidenceSource?: string;
}

export interface TextAnalysis {
  toxicity: number;
  aggression: number;
  threat: number;
  insult: number;
  emotionalIntensity: number;
  primaryEmotion: string;
  language: string;
  isInsult: boolean;
}

export interface MultimodalAnalysisResponse {
  status: 'success' | 'error';
  riskLevel: RiskLevel;
  overallScore: number;
  textAnalysis: TextAnalysis;
  perception: PerceptionFeedback;
  voiceAnalysis?: {
    pitchVolatility: number;
    speakingRateWpm: number;
    pauseRatio: number;
    tensionLevel: number;
  };
  faceAnalysis?: {
    browFurrowAU4: number;
    eyeSquintAU7: number;
    mouthTensionAU15: number;
    confidence: number;
  };
  behavioralStrain?: {
    sleepDeficitScore: number;
    stressScore: number;
    academicStrainScore: number;
    status: 'active' | 'unavailable';
  };
  intervention: InterventionCard;
  pythonMl?: {
    active: boolean;
    source?: string;
    pipelineScores?: any;
    fusionScore?: number;
  };
}

export interface CheckinData {
  id?: string;
  date: string;
  stress: number;
  mood: number;
  sleepHours: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'optimal';
  academicPressure: number;
  socialInteraction: number;
  exerciseMinutes: number;
  screenTimeHours: number;
  journalNote?: string;
}

export interface BehaviorSummary {
  daysTracked: number;
  avgStress: number;
  avgSleep: number;
  avgMood: number;
  recentStrainScore: number;
  insights: {
    id: string;
    type: 'correlation' | 'observation' | 'recommendation';
    title: string;
    description: string;
    disclaimer: string;
  }[];
  trends: {
    date: string;
    stress: number;
    sleep: number;
    mood: number;
    strain: number;
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: {
    title: string;
    framework: string;
    snippet: string;
  }[];
}
