"""
HumanLens AI — Aggression Detection Module
Member 3: Research / ML Lead

Implements:
1. TRAINED AGGRESSION MODEL: Dedicated models trained on Civil Comments annotator targets for Threat and Insult.
2. AGGRESSION PROXY BASELINE: Interpretable composite baseline (Threat=0.45, Insult=0.35, Toxicity=0.20).
"""

from pathlib import Path
from typing import Dict, Any, Optional
import re
import numpy as np
import joblib

from src.text.preprocessing import clean_text, extract_text_features


class AggressionScorer:
    """
    Evaluates aggressive communication, distinguishing targeted insults and explicit threats
    from casual profanity or benign disagreement.
    """

    THREAT_WEIGHT = 0.45
    INSULT_WEIGHT = 0.35
    TOXICITY_WEIGHT = 0.20

    LOW_THRESHOLD = 0.25
    MODERATE_THRESHOLD = 0.50
    HIGH_THRESHOLD = 0.75

    # Lexical patterns for baseline proxy
    THREAT_PATTERNS = [
        r"\b(i will|i'll|gonna|going to) (hurt|kill|destroy|punch|break|slap|beat|smash|end)\b",
        r"\b(die|watch your back|regret this|pay for this|end you|destroy you|mar dunga|jaan se mar)\b",
        r"\b(you better|threat|consequences)\b",
    ]

    INSULT_PATTERNS = [
        r"\b(idiot|stupid|moron|dumb|fool|pathetic|useless|loser|disgusting|garbage|worthless)\b",
        r"\b(shut up|get lost|clown|piece of shit|asshole|bitch|bastard|complete idiot|pagal|kutta|kamina|gadha)\b",
    ]

    def __init__(
        self,
        threat_model_path: Optional[str] = None,
        insult_model_path: Optional[str] = None,
        vectorizer_path: Optional[str] = None,
    ):
        base_dir = Path(__file__).resolve().parent.parent.parent
        self.threat_model_path = Path(threat_model_path) if threat_model_path else base_dir / "models" / "text" / "threat_model.pkl"
        self.insult_model_path = Path(insult_model_path) if insult_model_path else base_dir / "models" / "text" / "insult_model.pkl"
        self.vectorizer_path = Path(vectorizer_path) if vectorizer_path else base_dir / "models" / "text" / "vectorizer.pkl"

        self.threat_model = None
        self.insult_model = None
        self.vectorizer = None
        self._load_trained_models()

    def _load_trained_models(self):
        try:
            if self.vectorizer_path.exists() and self.vectorizer_path.stat().st_size > 100:
                self.vectorizer = joblib.load(self.vectorizer_path)
            if self.threat_model_path.exists() and self.threat_model_path.stat().st_size > 100:
                self.threat_model = joblib.load(self.threat_model_path)
            if self.insult_model_path.exists() and self.insult_model_path.stat().st_size > 100:
                self.insult_model = joblib.load(self.insult_model_path)
        except Exception as e:
            print(f"[AggressionScorer] Note: Running with baseline proxy ({e})")

    def _score_lexical_proxy(self, text: str) -> Dict[str, float]:
        lower = text.lower()
        threat_hits = sum(1 for p in self.THREAT_PATTERNS if re.search(p, lower))
        threat_score = min(1.0, threat_hits * 0.60)

        insult_hits = sum(1 for p in self.INSULT_PATTERNS if re.search(p, lower))
        insult_score = min(1.0, insult_hits * 0.50)

        return {
            "threat_score": float(threat_score),
            "insult_score": float(insult_score),
        }

    def categorize(self, score: float) -> str:
        if score >= self.HIGH_THRESHOLD:
            return "High Aggression"
        elif score >= self.MODERATE_THRESHOLD:
            return "Moderate Aggression"
        elif score >= self.LOW_THRESHOLD:
            return "Low Aggression"
        return "Non-Aggressive"

    def score(self, text: Optional[str], toxicity_score: float = 0.0, force_baseline: bool = False) -> Dict[str, Any]:
        """
        Calculates composite aggression score.
        Uses trained classifiers if available; falls back to interpretable baseline proxy.
        """
        if text is None:
            return {
                "aggression": 0.0,
                "aggression_score": 0.0,
                "threat": 0.0,
                "threat_score": 0.0,
                "insult": 0.0,
                "insult_score": 0.0,
                "toxicity_component": 0.0,
                "aggression_category": "Non-Aggressive",
                "confidence": 0.0,
                "model_type": "none",
                "backend": "UNAVAILABLE BACKEND",
                "status": "unavailable",
                "is_high_risk": False,
            }

        cleaned = clean_text(text)
        features = extract_text_features(text)
        is_all_caps = features["is_all_caps"]

        if not cleaned:
            return {
                "aggression": 0.0,
                "aggression_score": 0.0,
                "threat": 0.0,
                "threat_score": 0.0,
                "insult": 0.0,
                "insult_score": 0.0,
                "toxicity_component": round(float(toxicity_score), 4),
                "aggression_category": "Non-Aggressive",
                "confidence": 1.0,
                "model_type": "AGGRESSION PROXY BASELINE",
                "backend": "FALLBACK BACKEND (Aggression Proxy Baseline)",
                "status": "available",
                "is_high_risk": False,
            }

        # Attempt trained model inference
        used_trained = False
        threat_score = 0.0
        insult_score = 0.0

        if not force_baseline and self.threat_model and self.insult_model and self.vectorizer and cleaned:
            try:
                X_vec = self.vectorizer.transform([cleaned])
                # Handle regressors or classifiers
                t_pred = self.threat_model.predict_proba(X_vec)[0][1] if hasattr(self.threat_model, "predict_proba") else float(self.threat_model.predict(X_vec)[0])
                i_pred = self.insult_model.predict_proba(X_vec)[0][1] if hasattr(self.insult_model, "predict_proba") else float(self.insult_model.predict(X_vec)[0])
                threat_score = float(np.clip(t_pred, 0.0, 1.0))
                insult_score = float(np.clip(i_pred, 0.0, 1.0))
                used_trained = True
            except Exception:
                used_trained = False

        if not used_trained:
            proxy_scores = self._score_lexical_proxy(cleaned)
            threat_score = proxy_scores["threat_score"]
            insult_score = proxy_scores["insult_score"]

        # All-caps intensity amplifier for aggressive language
        intensity_mult = 1.15 if is_all_caps and (threat_score > 0.1 or insult_score > 0.1) else 1.0

        composite_aggression = (
            (self.THREAT_WEIGHT * threat_score)
            + (self.INSULT_WEIGHT * insult_score)
            + (self.TOXICITY_WEIGHT * toxicity_score)
        ) * intensity_mult

        composite_score = min(1.0, max(0.0, float(composite_aggression)))
        category = self.categorize(composite_score)
        confidence = round(float(max(threat_score, insult_score, toxicity_score)), 4)
        backend_label = "MODEL BACKEND (Trained Threat/Insult Classifiers)" if used_trained else "FALLBACK BACKEND (Aggression Proxy Baseline)"

        return {
            "aggression": round(composite_score, 4),
            "aggression_score": round(composite_score, 4),
            "threat": round(threat_score, 4),
            "threat_score": round(threat_score, 4),
            "insult": round(insult_score, 4),
            "insult_score": round(insult_score, 4),
            "toxicity_component": round(float(toxicity_score), 4),
            "aggression_category": category,
            "confidence": confidence,
            "model_type": "TRAINED AGGRESSION MODEL" if used_trained else "AGGRESSION PROXY BASELINE",
            "backend": backend_label,
            "status": "available",
            "is_high_risk": composite_score >= self.HIGH_THRESHOLD,
        }

