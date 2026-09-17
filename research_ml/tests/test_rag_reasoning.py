"""
HumanLens AI — Comprehensive RAG, Reasoning & Intervention Test Suite
Member 3: Research / ML Lead

Verifies:
- Dense semantic retrieval & TF-IDF fallback retrieval
- Empty / whitespace query graceful handling
- LocalFallbackReasoner deterministic synthesis
- Qwen fallback logging (status='fallback', backend='local_fallback')
- Before You Speak intervention card (risk_level, 3 rewrites, cooling_pause, actions, confidence)
"""

import sys
from pathlib import Path
import unittest

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from src.rag.retriever import DeEscalationRetriever
from src.reasoning.qwen_reasoning import QwenMultimodalReasoning, LocalFallbackReasoner, QwenOmniReasoner
from src.rag.intervention_cards import InterventionCardGenerator


class TestRagReasoningIntervention(unittest.TestCase):
    def setUp(self):
        self.retriever = DeEscalationRetriever()
        self.reasoning = QwenMultimodalReasoning(enabled=False, backend="local_fallback")
        self.card_gen = InterventionCardGenerator()

    def test_semantic_or_fallback_retrieval(self):
        results = self.retriever.retrieve("insults and personal attacks", top_k=2)
        self.assertEqual(len(results), 2)
        self.assertIn("principle", results[0])
        self.assertIn("relevance_score", results[0])
        self.assertIn(results[0]["retrieval_backend"], ["sentence_transformers", "tfidf_fallback"])

    def test_tfidf_explicit_retrieval(self):
        retriever_tfidf = DeEscalationRetriever(backend="tfidf", fallback_to_tfidf=True)
        results = retriever_tfidf.retrieve("sleep deprivation and fatigue", top_k=2)
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["retrieval_backend"], "tfidf_fallback")

    def test_empty_query_retrieval(self):
        results = self.retriever.retrieve("", top_k=3)
        self.assertEqual(len(results), 3)

    def test_local_fallback_reasoner(self):
        reasoner = LocalFallbackReasoner()
        out = reasoner.reason(
            text="You are an idiot!",
            whisper_transcript="",
            toxicity_score=0.90,
            aggression_score=0.85,
            emotion="anger",
            voice_intensity=0.80,
            mean_pitch=220.0,
            face_intensity=0.75,
            dominant_face_expression="agitated_tense",
            behavior_context={"stress": {"current_level": 8.0, "trend": "Increasing"}},
            rag_guidelines=self.retriever.retrieve("insult", top_k=1),
        )
        self.assertEqual(out["backend"], "local_fallback")
        self.assertEqual(out["status"], "fallback")
        self.assertIn("attribution_summary", out)
        self.assertIn("multimodal_prompt", out)

    def test_qwen_unavailable_graceful_fallback(self):
        """When Qwen weights are not locally cached, it must fall back gracefully without crashing."""
        qwen_reasoner = QwenOmniReasoner(model_name="Qwen/Qwen2.5-Omni-7B", device="cpu")
        out = qwen_reasoner.reason(
            text="Testing fallback",
            whisper_transcript="",
            toxicity_score=0.5,
            aggression_score=0.5,
            emotion="neutral",
            voice_intensity=0.5,
            mean_pitch=150.0,
            face_intensity=0.5,
            dominant_face_expression="neutral",
            behavior_context=None,
            rag_guidelines=[],
        )
        self.assertIn(out["status"], ["fallback", "success"])
        self.assertIn("attribution_summary", out)

    def test_before_you_speak_card_structure(self):
        guidelines = self.retriever.retrieve("insult", top_k=1)
        reasoning_out = self.reasoning.reason(
            text="I hate working with you, you idiot!",
            whisper_transcript="",
            toxicity_score=0.92,
            aggression_score=0.88,
            emotion="anger",
            voice_intensity=0.70,
            mean_pitch=200.0,
            face_intensity=0.75,
            dominant_face_expression="agitated_tense",
            behavior_context=None,
            rag_guidelines=guidelines,
        )
        card = self.card_gen.create_card(
            original_text="I hate working with you, you idiot!",
            escalation_score=0.92,
            modality_breakdown={"toxicity": 0.92, "aggression": 0.88, "voice": 0.70, "face": 0.75, "behavior": 0.0},
            reasoning_output=reasoning_out,
            rag_guidelines=guidelines,
            attribution={"text": 60.0, "voice": 25.0, "face": 15.0},
            confidence=0.91,
        )
        self.assertEqual(card["title"], "BEFORE YOU SPEAK — Pause & Reflect")
        self.assertEqual(card["risk_level"], "High Risk")
        self.assertEqual(len(card["three_rewrites"]), 3)
        self.assertEqual(len(card["alternative_rewrites"]), 3)
        self.assertIn("cooling_pause", card)
        self.assertIn("evidence_insight", card)
        self.assertIn("actions", card)
        self.assertAlmostEqual(card["confidence"], 0.91, places=2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
