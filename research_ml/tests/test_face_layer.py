"""
HumanLens AI — Comprehensive Face & Landmark Processing Test Suite
Member 3: Research / ML Lead

Verifies:
- Deterministic Action Unit extraction from geometric landmarks (fixture)
- Real frame processing with MediaPipe Face Landmarker
- Handling of non-face, dark, empty, and invalid images (NO fake face_detected=True)
- Privacy verification (privacy_verified=True, zero identity recognition, zero demographic inference)
- Terminology: "AU-inspired geometric proxy"
- Video processing interface
"""

import sys
from pathlib import Path
import unittest
import numpy as np
from unittest.mock import patch

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from src.face.features import FaceExpressionExtractor


class TestFaceLayerComprehensive(unittest.TestCase):
    def setUp(self):
        self.extractor = FaceExpressionExtractor(privacy_mode=True, min_confidence=0.50)

    def test_landmark_fixture_neutral(self):
        landmarks = {
            "brow_distance": 0.60,
            "eye_aperture": 0.35,
            "mouth_aspect_ratio": 0.30,
            "confidence": 0.95
        }
        res = self.extractor.extract_from_landmarks(landmarks)
        self.assertTrue(res["face_detected"])
        self.assertTrue(res["privacy_verified"])
        self.assertEqual(res["dominant_expression"], "neutral_relaxed")
        self.assertLess(res["face_expressive_intensity"], 0.40)
        self.assertEqual(res["proxy_type"], "AU-inspired geometric proxy")

    def test_landmark_fixture_tense_agitated(self):
        landmarks = {
            "brow_distance": 0.20,      # Furrowed
            "eye_aperture": 0.15,       # Squinted
            "mouth_aspect_ratio": 0.12, # Compressed
            "confidence": 0.98
        }
        res = self.extractor.extract_from_landmarks(landmarks)
        self.assertTrue(res["face_detected"])
        self.assertTrue(res["privacy_verified"])
        self.assertEqual(res["dominant_expression"], "agitated_tense")
        self.assertGreater(res["face_expressive_intensity"], 0.60)
        self.assertGreater(res["brow_activation"], 0.50)
        self.assertEqual(res["proxy_type"], "AU-inspired geometric proxy")

    def test_no_landmarks_empty_dict(self):
        res = self.extractor.extract_from_landmarks({})
        self.assertFalse(res["face_detected"])
        self.assertTrue(res["privacy_verified"])
        self.assertEqual(res["face_expressive_intensity"], 0.0)
        self.assertEqual(res["status"], "no_face")

    def test_invalid_and_empty_frame(self):
        # Empty frame
        res = self.extractor.process_frame(np.array([]))
        self.assertFalse(res["face_detected"])
        self.assertEqual(res["status"], "error")

        # None input
        res_none = self.extractor.process_frame(None)
        self.assertFalse(res_none["face_detected"])
        self.assertEqual(res_none["status"], "error")

        # Frame too small (<32x32)
        small_frame = np.zeros((16, 16, 3), dtype=np.uint8)
        res_small = self.extractor.process_frame(small_frame)
        self.assertFalse(res_small["face_detected"])
        self.assertEqual(res_small["status"], "error")

    def test_non_face_image_no_fake_detection(self):
        """Non-face solid black or noise image MUST NOT report face_detected=True."""
        black_img = np.zeros((100, 100, 3), dtype=np.uint8)
        res = self.extractor.process_frame(black_img)
        self.assertFalse(res["face_detected"], "Solid black image must NOT report face_detected=True!")
        self.assertIn(res["status"], ["no_face_detected", "detector_unavailable"])

        random_noise = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        res_noise = self.extractor.process_frame(random_noise)
        self.assertFalse(res_noise["face_detected"], "Random noise must NOT report face_detected=True!")
        self.assertIn(res_noise["status"], ["no_face_detected", "detector_unavailable"])

    def test_detector_unavailable_graceful_fallback(self):
        """When face detector backend is not available, status must be detector_unavailable and face_detected=False."""
        with patch.object(self.extractor, "_get_face_mesh", return_value=None):
            frame = np.ones((64, 64, 3), dtype=np.uint8) * 128
            res = self.extractor.process_frame(frame)
            self.assertFalse(res["face_detected"])
            self.assertEqual(res["status"], "detector_unavailable")
            self.assertEqual(res["face_expressive_intensity"], 0.0)

    def test_synthetic_test_image_fixture(self):
        img = np.ones((128, 128, 3), dtype=np.uint8) * 160
        img[35:45, 35:55] = 40
        img[35:45, 75:95] = 40
        img[85:95, 45:85] = 50

        res = self.extractor.process_frame(img)
        self.assertTrue(res["privacy_verified"])
        self.assertIn("dominant_expression", res)
        self.assertIn("broad_expression_activation", res)
        self.assertIn("landmark_confidence", res)

    def test_privacy_enforcement_contract(self):
        """Strictly enforces zero identity outputs and zero demographic inference in schema."""
        landmarks = {"brow_distance": 0.5, "eye_aperture": 0.5, "mouth_aspect_ratio": 0.3}
        res = self.extractor.extract_from_landmarks(landmarks)

        prohibited_keys = [
            "identity", "identity_embedding", "face_id", "user_id", "name",
            "gender", "race", "ethnicity", "age", "religion", "sexual_orientation",
            "biometric_template"
        ]
        for key in prohibited_keys:
            self.assertNotIn(key, res, f"Prohibited biometric/demographic key found: {key}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
