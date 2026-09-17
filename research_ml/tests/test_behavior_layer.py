"""
HumanLens AI — Comprehensive Behavior Lens Test Suite
Member 3: Research / ML Lead

Verifies:
- User-provided context evaluation
- Empty / missing behavior context returns status='unavailable'
- Explicit demo_mode=True or use_synthetic_behavior=True returns source='synthetic_demo'
- Missing individual fields handled gracefully without KeyError
- Longitudinal trends (Increasing stress, Decreasing sleep amplify strain)
- Provenance enforcement
"""

import sys
from pathlib import Path
import unittest

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from src.behavior.model import BehaviorLensModel


class TestBehaviorLayerComprehensive(unittest.TestCase):
    def setUp(self):
        self.model = BehaviorLensModel(demo_mode=False, use_synthetic_behavior=False)

    def test_empty_context_defaults_to_unavailable(self):
        """CRITICAL: Behavior modality must be unavailable if user context is omitted."""
        eval_res = self.model.evaluate(None)
        self.assertEqual(eval_res["source"], "unavailable")
        self.assertEqual(eval_res["status"], "unavailable")
        self.assertIsNone(eval_res["strain"])

    def test_user_provided_context(self):
        user_ctx = {
            "sleep": {"current_hours": 5.0, "trend": "Decreasing"},
            "stress": {"current_level": 8.0, "trend": "Increasing"},
            "academic_pressure": {"current_level": 7.5, "trend": "Increasing"},
            "social_interaction": {"current_hours": 1.5, "trend": "Decreasing"},
            "screen_time": {"current_hours": 9.0, "trend": "Increasing"},
        }
        eval_res = self.model.evaluate(user_ctx)
        self.assertEqual(eval_res["source"], "user_provided")
        self.assertEqual(eval_res["status"], "available")
        self.assertGreater(eval_res["strain"], 0.55)
        self.assertIn("Non-diagnostic", eval_res["summary"])

    def test_explicit_synthetic_demo_mode(self):
        """Synthetic behavior may only be used when explicitly enabled."""
        demo_model = BehaviorLensModel(demo_mode=True)
        eval_res = demo_model.evaluate(None)
        self.assertEqual(eval_res["source"], "synthetic_demo")
        self.assertEqual(eval_res["status"], "available")
        self.assertIsNotNone(eval_res["strain"])
        self.assertIn("[SYNTHETIC DEMO]", eval_res["summary"])

    def test_missing_subfields_graceful_handling(self):
        sparse_ctx = {
            "stress": {"current_level": 6.0}
            # sleep, academic, screen, social omitted
        }
        strain = self.model.calculate_behavioral_strain_score(sparse_ctx)
        self.assertGreater(strain, 0.0)
        self.assertLess(strain, 1.0)

    def test_healthy_low_strain_context(self):
        healthy_ctx = {
            "sleep": {"current_hours": 8.5, "trend": "Stable"},
            "stress": {"current_level": 2.0, "trend": "Decreasing"},
            "academic_pressure": {"current_level": 2.5, "trend": "Stable"},
            "social_interaction": {"current_hours": 5.0, "trend": "Increasing"},
            "screen_time": {"current_hours": 3.0, "trend": "Decreasing"},
        }
        strain = self.model.calculate_behavioral_strain_score(healthy_ctx)
        self.assertLess(strain, 0.25)


if __name__ == "__main__":
    unittest.main(verbosity=2)
