"""
HumanLens AI — Comprehensive Multimodal Fusion Test Suite
Member 3: Research / ML Lead

Verifies:
- Explainable Weighted Fusion with all 4 modalities
- Dynamic weight re-normalization when modalities are missing (text only, audio only, face only)
- Modality sensor confidence weighting
- Attribution percentage sums to approximately 100%
- Learned Multimodal Fusion prediction & SYNTHETIC PROOF-OF-CONCEPT provenance label
"""

import sys
from pathlib import Path
import unittest

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from src.fusion.weighted_fusion import ExplainableWeightedFusion
from src.fusion.learned_fusion import LearnedMultimodalFusion


class TestFusionLayerComprehensive(unittest.TestCase):
    def setUp(self):
        self.weighted = ExplainableWeightedFusion()
        self.learned = LearnedMultimodalFusion()

    def test_all_modalities_present(self):
        res = self.weighted.fuse(
            text_score=0.90,
            voice_score=0.80,
            face_score=0.75,
            behavior_score=0.70,
            text_confidence=0.95,
            voice_confidence=0.90,
            face_confidence=0.85,
            behavior_confidence=0.90,
        )
        self.assertGreater(res["escalation_score"], 0.75)
        self.assertEqual(len(res["modalities_present"]), 4)
        self.assertEqual(len(res["modalities_missing"]), 0)
        
        # Attribution must sum approximately to 100%
        attr_sum = sum(res["attribution_percent"].values())
        self.assertAlmostEqual(attr_sum, 100.0, delta=1.5)

    def test_text_only_modality(self):
        """Camera off and no audio: text must be 100% of the active weight."""
        res = self.weighted.fuse(text_score=0.80)
        self.assertAlmostEqual(res["escalation_score"], 0.80, places=2)
        self.assertEqual(res["modalities_present"], ["text"])
        self.assertIn("voice", res["modalities_missing"])
        self.assertIn("face", res["modalities_missing"])
        self.assertIn("behavior", res["modalities_missing"])
        self.assertAlmostEqual(res["attribution_percent"]["text"], 100.0, delta=0.5)

    def test_voice_only_modality(self):
        res = self.weighted.fuse(voice_score=0.60, voice_confidence=0.90)
        self.assertAlmostEqual(res["escalation_score"], 0.60, places=2)
        self.assertEqual(res["modalities_present"], ["voice"])

    def test_face_only_modality(self):
        res = self.weighted.fuse(face_score=0.50, face_confidence=0.80)
        self.assertAlmostEqual(res["escalation_score"], 0.50, places=2)
        self.assertEqual(res["modalities_present"], ["face"])

    def test_low_sensor_confidence_suppression(self):
        """Low face tracking confidence should reduce its effective contribution."""
        res_high_conf = self.weighted.fuse(text_score=0.5, face_score=0.9, face_confidence=1.0)
        res_low_conf = self.weighted.fuse(text_score=0.5, face_score=0.9, face_confidence=0.2)
        self.assertGreater(res_high_conf["escalation_score"], res_low_conf["escalation_score"])

    def test_learned_fusion_provenance_label(self):
        feat_vec = LearnedMultimodalFusion.build_feature_vector(
            toxicity=0.8, aggression=0.8, emotion_intensity=0.7,
            voice_intensity=0.7, pitch_std=20.0, face_intensity=0.6, behavior_strain=0.6
        )
        pred = self.learned.predict(feat_vec)
        self.assertIn("escalation_score", pred)
        self.assertIn("risk_level", pred)
        # CRITICAL: Verify provenance is explicitly labeled as proof-of-concept
        self.assertEqual(pred["provenance"], "SYNTHETIC PROOF-OF-CONCEPT")


if __name__ == "__main__":
    unittest.main(verbosity=2)
