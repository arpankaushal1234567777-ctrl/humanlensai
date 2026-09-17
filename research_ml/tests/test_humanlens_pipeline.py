"""
HumanLens AI — Comprehensive Test Suite & Verification Runner
Member 3: Research / ML Lead
"""

import sys
from pathlib import Path
import unittest
import numpy as np

# Ensure root directory is in sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from src.text.preprocessing import clean_text, extract_text_features, is_low_risk_greeting_or_benign
from src.text.toxicity import ToxicityScorer
from src.text.aggression import AggressionScorer
from src.text.emotion import EmotionScorer
from src.voice.features import AcousticFeatureExtractor, WhisperTranscriber
from src.face.features import FaceExpressionExtractor
from src.behavior.model import BehaviorLensModel
from src.fusion.weighted_fusion import ExplainableWeightedFusion
from src.fusion.learned_fusion import LearnedMultimodalFusion
from src.rag.retriever import DeEscalationRetriever
from src.reasoning.qwen_reasoning import QwenMultimodalReasoning
from src.rag.intervention_cards import InterventionCardGenerator
from src.pipeline import HumanLensPipeline
from src.evaluation.metrics import compute_classification_metrics, benchmark_latency
from src.evaluation.calibration import calculate_ece
from src.evaluation.bias import BiasEvaluator


class TestHumanLensTextLayer(unittest.TestCase):
    def setUp(self):
        self.tox_scorer = ToxicityScorer(use_transformer=False)  # Fast baseline for rapid unit test
        self.agg_scorer = AggressionScorer()
        self.emo_scorer = EmotionScorer()

    def test_benign_fast_filter(self):
        self.assertTrue(is_low_risk_greeting_or_benign("Hello there!"))
        self.assertTrue(is_low_risk_greeting_or_benign("Good morning"))
        self.assertTrue(is_low_risk_greeting_or_benign("Thank you very much"))
        self.assertFalse(is_low_risk_greeting_or_benign("You are an idiot and I hate you"))

    def test_toxicity_and_aggression_scoring(self):
        text = "You are a complete idiot, shut up and get lost!"
        tox_res = self.tox_scorer.score(text, model_type="fast")
        self.assertGreater(tox_res["toxicity_score"], 0.40)

        agg_res = self.agg_scorer.score(text, toxicity_score=tox_res["toxicity_score"])
        self.assertGreater(agg_res["aggression_score"], 0.50)
        self.assertIn("aggression_category", agg_res)

    def test_emotion_analysis(self):
        text = "I am so grateful and happy for your kind assistance!"
        emo_res = self.emo_scorer.score(text)
        self.assertIn("primary_emotion", emo_res)
        self.assertIn("emotional_intensity", emo_res)


class TestHumanLensVoiceLayer(unittest.TestCase):
    def setUp(self):
        self.extractor = AcousticFeatureExtractor()
        self.audio_dir = root_dir / "data" / "audio"

    def test_acoustic_extraction(self):
        audio_file = self.audio_dir / "voice_test_signal.wav"
        if audio_file.exists():
            features = self.extractor.extract_features(str(audio_file))
            self.assertIn("mean_rms_energy", features)
            self.assertIn("speech_activity_ratio", features)
            self.assertIn("voice_intensity_score", features)
            self.assertGreaterEqual(features["voice_intensity_score"], 0.0)
            self.assertLessEqual(features["voice_intensity_score"], 1.0)

    def test_whisper_asr(self):
        audio_file = self.audio_dir / "voice_test_signal.wav"
        if audio_file.exists():
            transcriber = WhisperTranscriber(model_size="tiny")
            res = transcriber.transcribe(str(audio_file))
            self.assertIn("text", res)
            self.assertIn("duration_seconds", res)
            self.assertIn("duration", res)


class TestHumanLensFaceLayer(unittest.TestCase):
    def setUp(self):
        self.extractor = FaceExpressionExtractor(privacy_mode=True)

    def test_landmark_action_units(self):
        landmarks = {
            "brow_distance": 0.25,  # Narrowed = furrowed
            "eye_aperture": 0.25,   # Narrowed = squint
            "mouth_aspect_ratio": 0.20,  # Compressed = tight lips
            "confidence": 0.95
        }
        res = self.extractor.extract_from_landmarks(landmarks)
        self.assertTrue(res["privacy_verified"])
        self.assertGreater(res["face_expressive_intensity"], 0.50)
        self.assertEqual(res["dominant_expression"], "agitated_tense")


class TestHumanLensBehaviorLens(unittest.TestCase):
    def setUp(self):
        self.behavior_model = BehaviorLensModel()

    def test_strain_calculation(self):
        high_stress_context = {
            "sleep": {"current_hours": 4.5, "trend": "Decreasing"},
            "stress": {"current_level": 8.5, "trend": "Increasing"},
            "academic_pressure": {"current_level": 8.0, "trend": "Increasing"},
            "social_interaction": {"current_hours": 1.0, "trend": "Decreasing"},
            "screen_time": {"current_hours": 9.0, "trend": "Increasing"},
        }
        strain = self.behavior_model.calculate_behavioral_strain_score(high_stress_context)
        self.assertGreater(strain, 0.60)
        summary = self.behavior_model.generate_behavior_summary(high_stress_context)
        self.assertIn("Non-diagnostic", summary)


class TestMultimodalFusionEngine(unittest.TestCase):
    def setUp(self):
        self.weighted = ExplainableWeightedFusion()
        self.learned = LearnedMultimodalFusion()

    def test_weighted_fusion_and_attribution(self):
        res = self.weighted.fuse(
            text_score=0.90,
            voice_score=0.85,
            face_score=0.75,
            behavior_score=0.80,
        )
        self.assertGreater(res["escalation_score"], 0.80)
        self.assertTrue(res["is_high_risk"])
        self.assertIn("attribution_percent", res)
        self.assertIn("text", res["attribution_percent"])

    def test_learned_fusion_prediction(self):
        feat_vec = LearnedMultimodalFusion.build_feature_vector(
            toxicity=0.9, aggression=0.85, emotion_intensity=0.8,
            voice_intensity=0.75, pitch_std=25.0, face_intensity=0.8, behavior_strain=0.7
        )
        pred = self.learned.predict(feat_vec)
        self.assertIn("escalation_score", pred)
        self.assertIn("risk_level", pred)


class TestReasoningRAGAndIntervention(unittest.TestCase):
    def setUp(self):
        self.retriever = DeEscalationRetriever()
        self.reasoning = QwenMultimodalReasoning()
        self.card_gen = InterventionCardGenerator()

    def test_rag_retrieval(self):
        results = self.retriever.retrieve("insults and personal attack", top_k=2)
        self.assertEqual(len(results), 2)
        self.assertIn("principle", results[0])

    def test_before_you_speak_card(self):
        card = self.card_gen.create_card(
            original_text="You are an idiot and you ruined my project!",
            escalation_score=0.91,
            modality_breakdown={"toxicity": 0.90, "aggression": 0.85, "voice": 0.80, "face": 0.70, "behavior": 0.75},
            reasoning_output={"attribution_summary": "High toxicity and vocal energy."},
            rag_guidelines=self.retriever.retrieve("insult", top_k=1),
        )
        self.assertEqual(card["risk_level"], "High Risk")
        self.assertEqual(len(card["alternative_rewrites"]), 3)
        self.assertIn("cooling_pause", card)


class TestEndToEndPipeline(unittest.TestCase):
    def setUp(self):
        self.pipeline = HumanLensPipeline()
        # Use fast baseline for testing speed
        self.pipeline.toxicity_scorer.use_transformer = False

    def test_low_risk_pipeline(self):
        res = self.pipeline.analyze(text="Hi, how are you doing today?")
        self.assertFalse(res["is_high_risk"])
        self.assertFalse(res["intervention_triggered"])
        self.assertIsNone(res["intervention_card"])

    def test_high_risk_pipeline(self):
        landmarks = {"brow_distance": 0.20, "eye_aperture": 0.25, "mouth_aspect_ratio": 0.20, "confidence": 0.95}
        behavior = {
            "sleep": {"current_hours": 4.5, "trend": "Decreasing"},
            "stress": {"current_level": 9.0, "trend": "Increasing"}
        }
        res = self.pipeline.analyze(
            text="You are completely useless and I swear I will destroy you!",
            face_landmarks=landmarks,
            behavior_context=behavior
        )
        self.assertTrue(res["is_high_risk"])
        self.assertTrue(res["intervention_triggered"])
        self.assertIsNotNone(res["intervention_card"])
        self.assertEqual(res["intervention_card"]["title"], "BEFORE YOU SPEAK — Pause & Reflect")


if __name__ == "__main__":
    unittest.main(verbosity=2)
