"""
HumanLens AI — De-Escalation & Communication Knowledge Base
Member 3: Research / ML Lead

Curated evidence-informed psychological guidelines and communication strategies:
- Nonviolent Communication (NVC)
- Cognitive Reframing
- Physiological Cooling & Regulation
- Active Assertiveness (I-Statements)
"""

from typing import List, Dict, Any

KNOWLEDGE_ITEMS = [
    {
        "id": "kb_nvc_01",
        "category": "Nonviolent Communication",
        "trigger": "insults, personal attacks, blaming",
        "principle": "Focus on observable actions rather than moralistic judgments.",
        "strategy": "Shift from 'You are always careless and incompetent' to specific factual observation: 'When the draft was submitted without my review, I felt concerned about accuracy.'",
        "tactics": [
            "State specific observations without evaluation.",
            "Express clear feelings without accusation.",
            "Identify underlying universal needs (respect, clarity, support).",
            "Make a concrete, actionable request."
        ]
    },
    {
        "id": "kb_reframe_02",
        "category": "Cognitive Reframing",
        "trigger": "threats, severe anger, hostile attribution",
        "principle": "Mitigate Hostile Attribution Bias (assuming malicious intent).",
        "strategy": "Consider benevolent alternative interpretations before reacting defensively.",
        "tactics": [
            "Ask yourself: 'What else could explain this behavior?'",
            "Recognize that urgent aggressive tones often reflect the sender's acute stress rather than malicious hatred.",
            "Avoid matching hostility with escalated hostility."
        ]
    },
    {
        "id": "kb_cooling_03",
        "category": "Physiological Cooling",
        "trigger": "high voice intensity, rapid speech, facial tension, acute stress",
        "principle": "Physiological arousal impairs executive functioning and impulse control.",
        "strategy": "Implement a 20-30 second mandatory pause to reset autonomic nervous system arousal.",
        "tactics": [
            "Take two deep diaphragmatic breaths (longer exhale than inhale).",
            "Step back from the keyboard or microphone momentarily.",
            "Acknowledge physical sensations of tension without immediate vocalization."
        ]
    },
    {
        "id": "kb_behavior_04",
        "category": "Behavioral Context Awareness",
        "trigger": "sleep deprivation, high academic/work pressure, cumulative stress",
        "principle": "Cumulative behavioral fatigue lowers frustration tolerance threshold.",
        "strategy": "Recognize internal vulnerability states as contributing factors rather than external provocations.",
        "tactics": [
            "Note: 'I am running on 5 hours of sleep and high academic pressure; my irritation threshold is lowered today.'",
            "Defer high-stakes controversial discussions until rested."
        ]
    },
    {
        "id": "kb_rewriting_05",
        "category": "Constructive Rewriting",
        "trigger": "general high toxicity, profanity, dismissive language",
        "principle": "Preserve message intent while removing inflammatory friction.",
        "strategy": "Strip inflammatory adjectives, insults, and hyperbole while retaining the core boundary or problem statement.",
        "tactics": [
            "Replace 'Shut up and do your job' with 'We need to resolve this issue urgently, please send the update.'",
            "Replace 'You are an idiot' with 'I strongly disagree with this approach because it creates risk.'"
        ]
    }
]
