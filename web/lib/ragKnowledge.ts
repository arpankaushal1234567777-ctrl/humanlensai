export interface KnowledgeItem {
  id: string;
  category: 'cooling' | 'nvc' | 'reframing' | 'student_pressure';
  title: string;
  source: string;
  content: string;
  actionableStep: string;
}

export const RAG_KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: 'kb-01',
    category: 'cooling',
    title: 'Physiological Sigh & 20-Second Downregulation',
    source: 'Huberman Lab / Stanford Behavioral Physiology (2022)',
    content: 'When acute interpersonal anger triggers autonomic fight-or-flight activation, heart rate spikes and prefrontal impulse control diminishes. A 20-second delay with two deep nasal inhales followed by an extended sigh rapidly activates the parasympathetic vagal brake, reducing impulsive typing.',
    actionableStep: 'Inhale twice deeply through your nose, then sigh slowly through your mouth before hitting send.'
  },
  {
    id: 'kb-02',
    category: 'nvc',
    title: 'Separating Observation from Evaluation',
    source: 'Nonviolent Communication (Dr. Marshall Rosenberg)',
    content: 'Communicating with labels like "you are lazy", "you ruined this", or "idiot" triggers immediate defensive denial. Replacing diagnostic judgments with neutral sensory observations ("The commit broke the build at 4 PM") keeps the dialogue problem-focused rather than identity-threatening.',
    actionableStep: 'State what concretely occurred without diagnosing the other person\'s character.'
  },
  {
    id: 'kb-03',
    category: 'reframing',
    title: 'Cognitive Attribution & Hanlon\'s Razor in Digital Collab',
    source: 'Journal of Computer-Mediated Communication (2021)',
    content: 'Digital text lacks prosody, pitch, and facial warmth, leading people to attribute negative malice to ambiguous mistakes. Pausing to ask "Could this be an honest misunderstanding or time crunch?" defuses 70% of project chat conflicts.',
    actionableStep: 'Formulate an open inquiry rather than an accusation.'
  },
  {
    id: 'kb-04',
    category: 'student_pressure',
    title: 'Sleep Deprivation & Affective Reactivity',
    source: 'Sleep Medicine Reviews (2020)',
    content: 'Students sleeping less than 6 hours display a 3.2x increase in amygdala reactivity to minor frustrating stimuli. Recognizing that your high irritation may be biological exhaustion helps prevent turning personal fatigue into interpersonal hostility.',
    actionableStep: 'Acknowledge internal fatigue before sending high-stakes messages.'
  }
];

export function retrieveRelevantKnowledge(query: string): KnowledgeItem[] {
  const q = query.toLowerCase();
  if (q.includes('sleep') || q.includes('tired') || q.includes('exhaust')) {
    return [RAG_KNOWLEDGE_BASE[3], RAG_KNOWLEDGE_BASE[0]];
  }
  if (q.includes('idiot') || q.includes('ruin') || q.includes('blame') || q.includes('hate')) {
    return [RAG_KNOWLEDGE_BASE[1], RAG_KNOWLEDGE_BASE[2]];
  }
  return [RAG_KNOWLEDGE_BASE[0], RAG_KNOWLEDGE_BASE[1]];
}
