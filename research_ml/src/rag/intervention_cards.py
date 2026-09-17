"""
HumanLens AI — "Before You Speak" Intervention Cards
Member 3: Research / ML Lead

Generates real-time, constructive, interactive intervention cards
when escalation thresholds are exceeded.
Never shames the user; provides actionable cognitive cooling and alternative phrasings.
"""

from typing import Dict, Any, List, Optional
import uuid
import time


class InterventionCardGenerator:
    """
    Creates "BEFORE YOU SPEAK" interactive intervention cards with:
    - Escalation alert level and score
    - Modality attribution breakdown
    - Cooling pause countdown prompt
    - Evidence-based reframing advice (from RAG)
    - Constructive alternative rewrites (Direct, Assertive, Collaborative)
    - Decision actions
    - Confidence metric
    """

    def generate_rewrites(self, text: str, toxicity: float, aggression: float) -> List[Dict[str, str]]:
        """
        Generate 3 constructive alternatives tailored to de-escalate:
        1. Direct & Professional
        2. Assertive & Needs-Focused (NVC)
        3. Collaborative / Empathetic
        """
        lower = text.lower()

        if any(w in lower for w in ["stupid", "idiot", "dumb", "moron", "useless", "worthless"]):
            return [
                {
                    "style": "Direct & Professional",
                    "text": "I disagree with this approach and believe we should explore other options.",
                    "intent": "Expresses disagreement without personal insults."
                },
                {
                    "style": "Assertive & Needs-Focused",
                    "text": "I feel frustrated right now because I need clarity on how this decision was made.",
                    "intent": "Communicates personal emotional state and clear requirement."
                },
                {
                    "style": "Collaborative / Empathetic",
                    "text": "Could you walk me through the reasoning behind this plan so we can find alignment?",
                    "intent": "Invites productive dialogue instead of conflict."
                }
            ]
        elif any(w in lower for w in ["shut up", "get lost", "leave me alone", "destroy you", "kill"]):
            return [
                {
                    "style": "Direct & Professional",
                    "text": "I need some time to process this before we continue our discussion.",
                    "intent": "Sets a healthy conversational boundary."
                },
                {
                    "style": "Assertive & Needs-Focused",
                    "text": "I am feeling overwhelmed at the moment and need a short break to regroup.",
                    "intent": "Transparently communicates emotional capacity."
                },
                {
                    "style": "Collaborative / Empathetic",
                    "text": "Let's pause here and revisit this topic in 30 minutes with fresh perspectives.",
                    "intent": "Prevents immediate conflict escalation."
                }
            ]
        else:
            return [
                {
                    "style": "Direct & Professional",
                    "text": "I have significant concerns about this matter and want to address them directly.",
                    "intent": "Highlights the urgency without hostile tone."
                },
                {
                    "style": "Assertive & Needs-Focused",
                    "text": "I am feeling stressed by these deadlines; let's work together to resolve the bottleneck.",
                    "intent": "Frames the issue as a shared problem to solve."
                },
                {
                    "style": "Collaborative / Empathetic",
                    "text": "I would appreciate understanding your perspective before we decide on next steps.",
                    "intent": "Disarms defensiveness."
                }
            ]

    def create_card(
        self,
        original_text: str,
        escalation_score: float,
        modality_breakdown: Dict[str, float],
        reasoning_output: Dict[str, Any],
        rag_guidelines: List[Dict[str, Any]],
        pause_duration_seconds: int = 20,
        attribution: Optional[Dict[str, float]] = None,
        confidence: float = 0.85,
    ) -> Dict[str, Any]:
        """
        Build the full Before You Speak intervention payload.
        """
        card_id = f"bys_card_{uuid.uuid4().hex[:8]}"
        rewrites = self.generate_rewrites(
            original_text,
            modality_breakdown.get("toxicity", 0.0),
            modality_breakdown.get("aggression", 0.0),
        )

        top_guideline = rag_guidelines[0] if rag_guidelines else {}

        return {
            "card_id": card_id,
            "title": "BEFORE YOU SPEAK — Pause & Reflect",
            "escalation_score": round(float(escalation_score), 4),
            "risk_level": "High Risk" if escalation_score >= 0.85 else "Moderate Risk",
            "confidence": round(float(confidence), 4),
            "why_triggered": reasoning_output.get("attribution_summary", "Elevated communication intensity detected."),
            "modality_attribution": attribution if attribution else modality_breakdown,
            "modality_breakdown": modality_breakdown,
            "cooling_pause": {
                "recommended_seconds": pause_duration_seconds,
                "message": f"Take a {pause_duration_seconds}-second pause before sending to ensure your message conveys your true intent.",
                "box_breathing": "Inhale 4s, Hold 4s, Exhale 4s, Hold 4s",
            },
            "evidence_insight": {
                "principle": top_guideline.get("principle", "Communicate observations over accusations."),
                "strategy": top_guideline.get("strategy", "Focus on clear boundaries rather than personal attacks."),
            },
            "original_message": original_text,
            "three_rewrites": rewrites,
            "alternative_rewrites": rewrites,  # Backwards compatibility alias
            "actions": [
                {"action": "use_rewrite_1", "label": "Use Professional Rewrite"},
                {"action": "use_rewrite_2", "label": "Use Assertive Rewrite"},
                {"action": "use_rewrite_3", "label": "Use Collaborative Rewrite"},
                {"action": "proceed_anyway", "label": "Send Original Anyway"},
            ],
            "timestamp": time.time(),
        }
