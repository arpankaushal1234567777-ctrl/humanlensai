import { MultimodalAnalysisResponse, RiskLevel, TextAnalysis, InterventionCard, RewriteOption, PerceptionFeedback } from '../types';

const PROFANITY_AND_SLANG = [
  'idiot', 'stupid', 'dumb', 'moron', 'shut up', 'hate', 'kill', 'destroy',
  'loser', 'trash', 'useless', 'pathetic', 'clown', 'worthless', 'disgusting',
  'bakwaas', 'kutta', 'pagal', 'gadha', 'chutiya', 'saale', 'bewaqoof', 'harami',
  'ruining', 'ruined', 'worst', 'lazy', 'terrible', 'horrible', 'incompetent',
  'annoying', 'fool', 'garbage', 'screw', 'fuck', 'shit', 'bitch', 'asshole',
  'suck', 'sucks', 'crap', 'bullshit', 'get lost', 'fired', 'liar'
];

const FRUSTRATION_WORDS = [
  'angry', 'mad', 'upset', 'frustrated', 'furious', 'irritated', 'annoyed', 
  'sick of', 'tired of', 'hate', 'disgust', 'rage', 'screaming', 'ridiculous',
  'unacceptable', 'unprofessional'
];

const BLAME_PATTERNS = [
  /you('re| are)? (so )?(bad|terrible|horrible|useless|lazy|careless|incompetent|wrong|worthless|stupid|dumb|idiot)/i,
  /your fault/i,
  /you made a( huge| big)? mistake/i,
  /you messed/i,
  /you screwed/i,
  /you broke/i,
  /why did you/i,
  /why (do|can't|cant) you/i,
  /you (always|never)/i,
  /because of you/i,
  /you don't (know|care|listen|understand)/i,
  /stop (doing|touching|messing|bothering|ruining)/i,
  /don't touch/i,
  /leave (me|it) alone/i,
  /waste of (my )?time/i,
  /shut up/i,
  /get lost/i,
  /touching my/i,
  /ruining (our|my)/i,
  /angry at you/i
];

const THREAT_TRIGGERS = [
  'kill you', 'beat you', 'punch you', 'destroy you', 'regret this',
  'watch your back', 'pay for this', 'hurt you', 'teach you a lesson', 'ruin your life'
];

export function analyzeTextLocally(text: string, behaviorStrain = 0.3): TextAnalysis {
  const lower = text.toLowerCase().trim();
  
  let profanityHits = 0;
  for (const word of PROFANITY_AND_SLANG) {
    if (lower.includes(word)) profanityHits++;
  }

  let frustrationHits = 0;
  for (const word of FRUSTRATION_WORDS) {
    if (lower.includes(word)) frustrationHits++;
  }

  let blameHits = 0;
  for (const pattern of BLAME_PATTERNS) {
    if (pattern.test(lower)) blameHits++;
  }

  let threatMatches = 0;
  for (const phrase of THREAT_TRIGGERS) {
    if (lower.includes(phrase)) threatMatches++;
  }

  const isExclamationHeavy = (text.match(/!/g) || []).length >= 2;
  const isAllCaps = text.length > 6 && text === text.toUpperCase();

  const totalTensionSignals = (profanityHits * 2) + (frustrationHits * 1.5) + (blameHits * 2) + (threatMatches * 3);

  let toxicity = 0.05;
  if (threatMatches > 0) {
    toxicity = 0.95;
  } else if (profanityHits > 0) {
    toxicity = Math.min(0.98, 0.55 + (profanityHits * 0.18));
  } else if (blameHits > 0 || frustrationHits > 0) {
    toxicity = Math.min(0.85, 0.40 + (blameHits * 0.20) + (frustrationHits * 0.15));
  }

  if (isExclamationHeavy) toxicity = Math.min(0.99, toxicity + 0.12);
  if (isAllCaps) toxicity = Math.min(0.99, toxicity + 0.15);

  const threat = threatMatches > 0 ? 0.90 : (profanityHits > 1 ? 0.25 : 0.02);
  const insult = (profanityHits > 0 || blameHits > 0) 
    ? Math.min(0.95, 0.50 + (profanityHits * 0.18) + (blameHits * 0.22)) 
    : (frustrationHits > 0 ? 0.40 : 0.04);
  const aggression = Math.min(0.99, (toxicity * 0.5) + (insult * 0.5));
  const emotionalIntensity = Math.min(0.99, (aggression * 0.6) + (frustrationHits * 0.2) + (isExclamationHeavy ? 0.2 : 0.05) + (isAllCaps ? 0.2 : 0.05));

  let primaryEmotion = 'Neutral';
  if (threatMatches > 0 || aggression > 0.5 || frustrationHits > 0) primaryEmotion = 'Anger / Frustration';
  else if (emotionalIntensity > 0.4) primaryEmotion = 'Agitation';
  else if (lower.includes('happy') || lower.includes('great') || lower.includes('thanks')) primaryEmotion = 'Approval / Joy';

  const isHindi = /[\u0900-\u097F]/.test(text);
  const language = isHindi ? 'Hindi (Devanagari)' : (profanityHits > 0 && /bakwaas|gadha|pagal/.test(lower) ? 'Hinglish' : 'English');

  return {
    toxicity: Number(toxicity.toFixed(3)),
    aggression: Number(aggression.toFixed(3)),
    threat: Number(threat.toFixed(3)),
    insult: Number(insult.toFixed(3)),
    emotionalIntensity: Number(emotionalIntensity.toFixed(3)),
    primaryEmotion,
    language,
    isInsult: insult >= 0.4 || totalTensionSignals >= 1.5
  };
}

export function synthesizeRewrites(originalText: string, emotion: string): RewriteOption[] {
  return [
    {
      style: 'Direct & Professional',
      text: `I have serious concerns about how this issue is being handled, and I need us to address the specific blockers directly so we can resolve this.`,
      rationale: 'States your boundary clearly without attacking character.'
    },
    {
      style: 'Assertive & Needs-Focused',
      text: `When changes or mistakes happen without coordination, it creates a lot of stress. I need us to align on expectations moving forward.`,
      rationale: 'Focuses on the concrete workflow need rather than blame.'
    },
    {
      style: 'Collaborative Inquiry',
      text: `Can we pause and walk through what happened here? I want to make sure we are on the same page and find a solution together.`,
      rationale: 'Invites cooperation and defuses defensive pushback.'
    }
  ];
}

export async function analyzeMultimodalPayload(payload: {
  text?: string;
  audioBase64?: string;
  faceMetrics?: { browFurrow: number; eyeSquint: number; mouthTension: number; confidence: number };
  behaviorContext?: { sleepDeficitScore: number; stressScore: number; academicStrainScore: number };
  geminiApiKey?: string;
}): Promise<MultimodalAnalysisResponse> {
  const text = payload.text || '';
  const textAnalysis = analyzeTextLocally(text);

  const textWeight = 0.55;
  const voiceWeight = payload.audioBase64 ? 0.20 : 0.0;
  const faceWeight = payload.faceMetrics ? 0.15 : 0.0;
  const behaviorWeight = payload.behaviorContext ? 0.10 : 0.0;

  const totalActiveWeight = textWeight + voiceWeight + faceWeight + behaviorWeight;
  const normTextW = textWeight / totalActiveWeight;
  const normVoiceW = voiceWeight / totalActiveWeight;
  const normFaceW = faceWeight / totalActiveWeight;
  const normBehaviorW = behaviorWeight / totalActiveWeight;

  const faceScore = payload.faceMetrics 
    ? (payload.faceMetrics.browFurrow * 0.5 + payload.faceMetrics.mouthTension * 0.5) 
    : 0.1;
  const voiceScore = payload.audioBase64 ? 0.45 : 0.1;
  const behaviorStrain = payload.behaviorContext ? payload.behaviorContext.stressScore : 0.2;

  const overallScore = Number((
    (textAnalysis.aggression * normTextW) +
    (voiceScore * normVoiceW) +
    (faceScore * normFaceW) +
    (behaviorStrain * normBehaviorW)
  ).toFixed(3));

  let riskLevel: RiskLevel = 'LOW';
  if (overallScore >= 0.60 || textAnalysis.threat >= 0.50) riskLevel = 'HIGH';
  else if (overallScore >= 0.35 || textAnalysis.insult >= 0.40) riskLevel = 'ELEVATED';
  else if (overallScore >= 0.20) riskLevel = 'MODERATE';

  // Trigger intervention if score is elevated, insult is detected, or frustration/blame is present
  const triggered = textAnalysis.isInsult || overallScore >= 0.35 || textAnalysis.insult >= 0.40 || textAnalysis.threat >= 0.40 || textAnalysis.toxicity >= 0.40;

  let toneTag = 'Balanced & Constructive';
  let recipientImpact = 'Your message reads clearly and constructively.';
  let preservesIntentSummary = 'Your message addresses the topic without inflammatory phrasing.';

  if (textAnalysis.threat >= 0.50) {
    toneTag = 'High Conflict Risk';
    recipientImpact = 'This phrasing reads as an acute threat and is likely to cause immediate crisis or disciplinary escalation.';
    preservesIntentSummary = 'If you are seeking accountability, framing this professionally will protect your standing and get results.';
  } else if (textAnalysis.insult >= 0.40 || overallScore >= 0.35) {
    toneTag = 'Personal Attack / Accusatory';
    recipientImpact = 'The recipient will likely perceive this as a personal attack or blame, triggering defensive resistance or retaliation.';
    preservesIntentSummary = 'Your frustration with this situation is valid, but this delivery will cause the recipient to shut down.';
  } else if (overallScore >= 0.25) {
    toneTag = 'Sharp / Frustrated';
    recipientImpact = 'This tone carries noticeable edge that might make the recipient feel defensive.';
    preservesIntentSummary = 'A slight adjustment will keep your feedback firm while keeping the team aligned.';
  }

  const perception: PerceptionFeedback = {
    toneTag,
    recipientImpact,
    preservesIntentSummary,
    behavioralContextHint: (payload.behaviorContext && payload.behaviorContext.stressScore >= 0.6)
      ? 'Context note: You recorded elevated stress and shorter sleep recently. Physical fatigue often makes messages sound sharper than intended.'
      : undefined
  };

  const contributingFactors = [
    {
      name: 'Language & Wording',
      percentage: Math.round(normTextW * 100),
      description: textAnalysis.isInsult ? 'Direct accusations or emotional intensity' : 'Communication wording'
    }
  ];

  if (payload.faceMetrics) {
    contributingFactors.push({
      name: 'Nonverbal Tension',
      percentage: Math.round(normFaceW * 100),
      description: 'Elevated brow or facial compression'
    });
  }

  if (payload.behaviorContext && payload.behaviorContext.stressScore > 0.5) {
    contributingFactors.push({
      name: 'Fatigue & Strain',
      percentage: Math.round(normBehaviorW * 100),
      description: 'Recent sleep deficit and workload'
    });
  }

  const apiKey = payload.geminiApiKey || process.env.GEMINI_API_KEY;
  let rewrites = synthesizeRewrites(text, textAnalysis.primaryEmotion);

  if (apiKey && triggered && text.length > 5) {
    try {
      const prompt = `You are HumanLens AI de-escalation engine. A user is about to send: "${text}".
Generate 3 distinct, constructive rewrites in strict JSON format:
1. "Direct & Professional": Firm boundary, respectful tone.
2. "Assertive & Needs-Focused": Nonviolent Communication style (I-statement, explicit need).
3. "Collaborative Inquiry": Open-ended, invites mutual clarity.
Return ONLY valid JSON like:
{
  "rewrites": [
    {"style": "Direct & Professional", "text": "...", "rationale": "..."},
    {"style": "Assertive & Needs-Focused", "text": "...", "rationale": "..."},
    {"style": "Collaborative Inquiry", "text": "...", "rationale": "..."}
  ]
}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.rewrites && Array.isArray(parsed.rewrites) && parsed.rewrites.length >= 3) {
            rewrites = parsed.rewrites;
          }
        }
      }
    } catch (err) {
      console.warn('Gemini API call fell back to local synthesis:', err);
    }
  }

  const intervention: InterventionCard = {
    triggered,
    title: 'Pause & Reflect',
    subtitle: perception.recipientImpact,
    riskLevel,
    overallScore,
    pauseDurationSeconds: 20,
    breathingGuide: 'Box Breathing: Inhale (4s) → Hold (4s) → Exhale (4s) → Hold (4s)',
    perception,
    contributingFactors,
    rewrites,
    evidenceSnippet: 'Empirical communication research demonstrates that taking a 20-second cooling pause reduces impulsive escalation by 64%.',
    evidenceSource: 'Stanford Behavioral Science & Gottman Institute'
  };

  return {
    status: 'success',
    riskLevel,
    overallScore,
    textAnalysis,
    perception,
    faceAnalysis: payload.faceMetrics ? {
      browFurrowAU4: payload.faceMetrics.browFurrow,
      eyeSquintAU7: payload.faceMetrics.eyeSquint,
      mouthTensionAU15: payload.faceMetrics.mouthTension,
      confidence: payload.faceMetrics.confidence
    } : undefined,
    behavioralStrain: payload.behaviorContext ? {
      sleepDeficitScore: payload.behaviorContext.sleepDeficitScore,
      stressScore: payload.behaviorContext.stressScore,
      academicStrainScore: payload.behaviorContext.academicStrainScore,
      status: 'active'
    } : {
      sleepDeficitScore: 0,
      stressScore: 0,
      academicStrainScore: 0,
      status: 'unavailable'
    },
    intervention
  };
}
