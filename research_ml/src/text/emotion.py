"""
HumanLens AI — Emotion Analysis Module
Member 3: Research / ML Lead

Uses the GoEmotions fine-grained model (28 emotion categories).
Emotion predictions represent observable communication affect, NOT psychological diagnoses.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import joblib

from src.text.preprocessing import clean_text


class EmotionScorer:
    """
    Predicts fine-grained communication affect.
    Non-diagnostic: estimates linguistic sentiment and emotional intensity.
    """

    # High-arousal negative affect weights
    HIGH_AROUSAL_WEIGHTS = {
        "anger": 1.0,
        "annoyance": 0.75,
        "disgust": 0.70,
        "fear": 0.65,
        "disapproval": 0.50,
        "nervousness": 0.45,
        "excitement": 0.35,
        "grief": 0.40,
    }

    def __init__(
        self,
        model_path: Optional[str] = None,
        vectorizer_path: Optional[str] = None,
    ):
        base_dir = Path(__file__).resolve().parent.parent.parent
        self.model_path = Path(model_path) if model_path else base_dir / "models" / "emotion_logistic_regression.pkl"
        self.vectorizer_path = Path(vectorizer_path) if vectorizer_path else base_dir / "models" / "emotion_tfidf_vectorizer.pkl"

        self.model = None
        self.vectorizer = None
        self._load_models()

    def _load_models(self):
        try:
            if self.model_path.exists() and self.vectorizer_path.exists():
                self.model = joblib.load(self.model_path)
                self.vectorizer = joblib.load(self.vectorizer_path)
        except Exception as e:
            print(f"[EmotionScorer] Note: Could not load emotion model ({e})")

    def score(self, text: str, top_k: int = 3) -> Dict[str, Any]:
        cleaned = clean_text(text)
        if not cleaned or not self.model or not self.vectorizer:
            return {
                "primary_emotion": "neutral",
                "confidence": 0.0,
                "top_emotions": [{"emotion": "neutral", "probability": 0.0}],
                "emotion_probabilities": {"neutral": 1.0},
                "emotional_intensity": 0.0,
                "diagnostic_disclaimer": "Observable linguistic affect only; non-diagnostic.",
            }

        X_vec = self.vectorizer.transform([cleaned])
        probs = self.model.predict_proba(X_vec)[0]
        classes = self.model.classes_

        # Full emotion probabilities dictionary
        prob_dict = {str(c): round(float(p), 4) for c, p in zip(classes, probs)}

        # Top-k emotions
        top_indices = np.argsort(probs)[::-1][:top_k]
        top_emotions = [
            {"emotion": str(classes[idx]), "probability": round(float(probs[idx]), 4)}
            for idx in top_indices
        ]

        primary_emotion = str(classes[top_indices[0]])
        confidence = round(float(probs[top_indices[0]]), 4)

        # Calculate high-arousal emotional intensity index [0, 1]
        raw_intensity = 0.0
        for cls_name, p_val in zip(classes, probs):
            w = self.HIGH_AROUSAL_WEIGHTS.get(cls_name, 0.0)
            raw_intensity += w * p_val

        emotional_intensity = min(1.0, max(0.0, float(raw_intensity * 1.5)))

        return {
            "primary_emotion": primary_emotion,
            "confidence": confidence,
            "top_emotions": top_emotions,
            "emotion_probabilities": prob_dict,
            "emotional_intensity": round(emotional_intensity, 4),
            "diagnostic_disclaimer": "Observable linguistic affect only; non-diagnostic.",
        }
