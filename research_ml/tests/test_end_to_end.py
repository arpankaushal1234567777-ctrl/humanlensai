"""
HumanLens AI — Comprehensive End-to-End Pipeline Test Suite
Member 3: Research / ML Lead

Verifies:
- Low-Risk Fast Deterministic Path (routing_path='fast_rule')
- Moderate-Risk Path (routing_path='text_ml' or 'multimodal_analysis')
- High-Risk Path (routing_path='high_risk_reasoning', triggers intervention card)
- Hindi & Hinglish multilingual end-to-end processing
- Audio-only, Face-only, Behavior-only single-modality pipelines
- Full 4-modality multimodal pipeline
"""

import sys
from pathlib import Path
import unittest

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from src.pipeline import HumanLensPipeline


class TestEndToEndPipelineComprehensive(unittest.TestCase):
    def setUp(self):
        self.pipeline = HumanLensPipeline()
        # Ensure fast baseline for rapid testing
        self.pipeline.toxicity_scorer.use_transformer = False

    def test_low_risk_fast_path(self):
        res = self.pipeline.analyze(text="Good morning! Hope you have a great day.")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["risk_level"], "Low Risk")
        self.assertFalse(res["is_high_risk"])
        self.assertEqual(res["routing_path"], "fast_rule")
        self.assertFalse(res["intervention_triggered"])
        self.assertIsNone(res["intervention_card"])

    def test_moderate_risk_text_pipeline(self):
        res = self.pipeline.analyze(text="I am very dissatisfied with the sloppy progress of this task.")
        self.assertEqual(res["status"], "success")
        self.assertIn(res["risk_level"], ["Low Risk", "Moderate / Elevated Caution"])
        self.assertEqual(res["routing_path"], "text_ml")
        self.assertIn("toxicity", res["text"])
        self.assertIn("aggression", res["text"])

    def test_high_risk_multimodal_intervention(self):
        landmarks = {
            "brow_distance": 0.20,
            "eye_aperture": 0.18,
            "mouth_aspect_ratio": 0.15,
            "confidence": 0.95
        }
        behavior = {
            "sleep": {"current_hours": 4.5, "trend": "Decreasing"},
            "stress": {"current_level": 9.0, "trend": "Increasing"},
            "academic_pressure": {"current_level": 8.5, "trend": "Increasing"}
        }
        res = self.pipeline.analyze(
            text="You are a complete useless idiot and I will destroy your career!",
            face_landmarks=landmarks,
            behavior_context=behavior
        )
        self.assertEqual(res["status"], "success")
        self.assertTrue(res["is_high_risk"])
        self.assertEqual(res["risk_level"], "High Risk")
        self.assertEqual(res["routing_path"], "high_risk_reasoning")
        self.assertTrue(res["intervention_triggered"])
        self.assertIsNotNone(res["intervention_card"])
        self.assertEqual(res["intervention_card"]["title"], "BEFORE YOU SPEAK — Pause & Reflect")
        self.assertEqual(len(res["intervention_card"]["three_rewrites"]), 3)

    def test_hindi_end_to_end(self):
        res = self.pipeline.analyze(text="तुम बहुत बड़े बेवकूफ हो, मुझे तुमसे बात नहीं करनी")
        self.assertEqual(res["status"], "success")
        self.assertIn("toxicity", res["text"])

    def test_hinglish_end_to_end(self):
        res = self.pipeline.analyze(text="Tu bilkul idiot hai, stop doing this work")
        self.assertEqual(res["status"], "success")
        self.assertIn("toxicity", res["text"])

    def test_face_only_pipeline(self):
        landmarks = {"brow_distance": 0.50, "eye_aperture": 0.35, "mouth_aspect_ratio": 0.30, "confidence": 0.90}
        res = self.pipeline.analyze(face_landmarks=landmarks)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["face"]["status"], "available")
        self.assertEqual(res["text"]["status"], "unavailable")

    def test_behavior_only_pipeline(self):
        behavior = {"stress": {"current_level": 7.5, "trend": "Increasing"}}
        res = self.pipeline.analyze(behavior_context=behavior)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["behavior"]["status"], "available")
        self.assertEqual(res["behavior"]["source"], "user_provided")
        self.assertEqual(res["text"]["status"], "unavailable")

    def test_audio_pipeline_if_file_exists(self):
        audio_path = root_dir / "data" / "audio" / "voice_test_signal.wav"
        if audio_path.exists():
            res = self.pipeline.analyze(audio_path=str(audio_path))
            self.assertEqual(res["status"], "success")
            self.assertIn(res["voice"]["status"], ["available", "fallback"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
