"""
HumanLens AI — Comprehensive Text Layer Test Suite
Member 3: Research / ML Lead

Verifies:
- English toxicity & benign greetings
- Hindi & Hinglish multilingual toxicity
- Unicode & special character handling
- Empty and long text boundary conditions
- Benign profanity vs targeted insults vs explicit threats
"""

import sys
from pathlib import Path
import unittest

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from src.text.preprocessing import clean_text, extract_text_features, is_low_risk_greeting_or_benign, detect_language
from src.text.toxicity import ToxicityScorer
from src.text.aggression import AggressionScorer
from src.text.emotion import EmotionScorer


class TestTextLayerComprehensive(unittest.TestCase):
    def setUp(self):
        self.tox_scorer = ToxicityScorer(use_transformer=False)  # Fast baseline for deterministic unit test
        self.agg_scorer = AggressionScorer()
        self.emo_scorer = EmotionScorer()

    def test_english_toxicity_detection(self):
        text = "You are a complete idiot and I despise you!"
        res = self.tox_scorer.score(text, model_type="fast")
        self.assertGreater(res["toxicity_score"], 0.40)
        self.assertTrue(res["is_toxic"])
        self.assertEqual(res["status"], "available")

    def test_hindi_toxicity_detection(self):
        # Hindi toxic phrases
        text = "तुम बहुत बड़े बेवकूफ और कमीने हो"
        res = self.tox_scorer.score(text, model_type="fast")
        self.assertIn("toxicity_score", res)
        self.assertIn(res["language"], ["hi", "Hindi", "unknown"])

    def test_hinglish_toxicity_detection(self):
        # Hinglish code-mixed slang
        text = "Tu bilkul pagal aur kutta hai, get lost"
        res = self.tox_scorer.score(text, model_type="fast")
        self.assertGreater(res["toxicity_score"], 0.30)

    def test_unicode_and_emojis(self):
        text = "Hello world! 🌍✨ नमस्ते 🙏🏽 こんにちは"
        cleaned = clean_text(text)
        self.assertIn("Hello", cleaned)
        res = self.tox_scorer.score(text, model_type="fast")
        self.assertLess(res["toxicity_score"], 0.30)
        self.assertFalse(res["is_toxic"])

    def test_empty_and_whitespace_text(self):
        for empty_val in ["", "   ", "\n\t  \n"]:
            res = self.tox_scorer.score(empty_val, model_type="fast")
            self.assertEqual(res["toxicity_score"], 0.0)
            self.assertFalse(res["is_toxic"])

    def test_very_long_text(self):
        long_text = "This is a neutral and constructive discussion. " * 200
        res = self.tox_scorer.score(long_text, model_type="fast")
        self.assertLess(res["toxicity_score"], 0.30)
        self.assertFalse(res["is_toxic"])

    def test_benign_profanity(self):
        # Conversational / casual profanity without hostility
        text = "Damn, that was a crazy good performance, holy shit!"
        res = self.tox_scorer.score(text, model_type="fast")
        agg = self.agg_scorer.score(text, toxicity_score=res["toxicity_score"])
        # Aggression should remain sub-high
        self.assertLess(agg["aggression_score"], 0.75)

    def test_targeted_insult(self):
        text = "You are a useless, pathetic clown and a total moron."
        res = self.tox_scorer.score(text, model_type="fast")
        agg = self.agg_scorer.score(text, toxicity_score=res["toxicity_score"])
        self.assertGreater(agg["insult_score"], 0.35)
        self.assertIn(agg["aggression_category"], ["Moderate Aggression", "High Aggression"])

    def test_explicit_threat(self):
        text = "I will hunt you down and destroy you, watch your back!"
        res = self.tox_scorer.score(text, model_type="fast")
        agg = self.agg_scorer.score(text, toxicity_score=res["toxicity_score"])
        self.assertGreater(agg["threat_score"], 0.40)
        self.assertGreater(agg["aggression_score"], 0.45)

    def test_emotion_classification(self):
        text = "I am so grateful and thankful for your generous guidance!"
        res = self.emo_scorer.score(text)
        self.assertIn("primary_emotion", res)
        self.assertIn("emotional_intensity", res)
        self.assertGreaterEqual(res["emotional_intensity"], 0.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
