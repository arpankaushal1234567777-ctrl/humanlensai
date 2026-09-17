"""
HumanLens AI — Multilingual Toxicity Detection Module
Member 3: Research / ML Lead

Implements:
1. Primary Model: textdetox/bert-multilingual-toxicity-classifier
2. Research Comparison Model: textdetox/xlmr-large-toxicity-classifier-v2
3. Fast Baseline: TF-IDF + Calibrated Logistic Regression (models/text/toxicity_model.pkl)
4. Robust dynamic label mapping via model.config.id2label
"""

from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np
import joblib

from src.text.preprocessing import clean_text, extract_text_features, detect_language


class ToxicityScorer:
    """
    Unified toxicity detection engine supporting both pretrained transformer pipelines
    and fast, low-latency calibrated baseline models.
    """

    PRIMARY_MODEL_NAME = "textdetox/bert-multilingual-toxicity-classifier"
    COMPARISON_MODEL_NAME = "textdetox/xlmr-large-toxicity-classifier-v2"

    def __init__(
        self,
        use_transformer: bool = True,
        device: str = "cpu",
        fast_model_path: Optional[str] = None,
        fast_vectorizer_path: Optional[str] = None,
    ):
        self.use_transformer = use_transformer
        self.device = device
        self._primary_pipeline = None
        self._comparison_pipeline = None
        self._primary_status = "unavailable"
        self._comparison_status = "unavailable"

        base_dir = Path(__file__).resolve().parent.parent.parent
        self.fast_model_path = Path(fast_model_path) if fast_model_path else base_dir / "models" / "text" / "toxicity_model.pkl"
        self.fast_vectorizer_path = Path(fast_vectorizer_path) if fast_vectorizer_path else base_dir / "models" / "text" / "vectorizer.pkl"

        self.fast_model = None
        self.fast_vectorizer = None
        self._load_fast_model()

    def _load_fast_model(self):
        try:
            if self.fast_model_path.exists() and self.fast_model_path.stat().st_size > 100:
                self.fast_model = joblib.load(self.fast_model_path)
            if self.fast_vectorizer_path.exists() and self.fast_vectorizer_path.stat().st_size > 100:
                self.fast_vectorizer = joblib.load(self.fast_vectorizer_path)
        except Exception as e:
            print(f"[ToxicityScorer] Warning: Could not load fast baseline model: {e}")

    def _get_pipeline(self, model_name: str):
        """
        Lazy-loads transformer pipeline and extracts label mapping.
        """
        from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer

        device_id = 0 if self.device == "cuda" else -1
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForSequenceClassification.from_pretrained(model_name)

        pipe = pipeline(
            "text-classification",
            model=model,
            tokenizer=tokenizer,
            device=device_id,
            truncation=True,
            max_length=256,
        )
        return pipe, model.config.id2label

    def _parse_toxic_prob(self, result: Dict[str, Any], id2label: Optional[Dict[int, str]] = None) -> float:
        """
        Robustly inspects pipeline result and id2label mapping.
        Never blindly assumes label_0 = non-toxic or label_1 = toxic.
        """
        raw_label = str(result.get("label", "")).strip()
        score = float(result.get("score", 0.5))

        # Check explicit label strings
        lower_label = raw_label.lower()
        if lower_label in ["toxic", "toxicity", "hate", "offensive", "aggression"]:
            return score
        if lower_label in ["neutral", "non-toxic", "clean", "normal", "non_toxic", "ok"]:
            return 1.0 - score

        # Check via id2label mapping if label is in LABEL_X format
        if id2label and raw_label.startswith("LABEL_"):
            try:
                idx = int(raw_label.split("_")[-1])
                target_str = str(id2label.get(idx, "")).lower()
                if target_str in ["toxic", "hate", "offensive", "1"]:
                    return score
                elif target_str in ["neutral", "non-toxic", "0", "clean"]:
                    return 1.0 - score
            except Exception:
                pass

        # Fallback default: LABEL_1 usually toxic in 2-class classifiers
        if raw_label in ["LABEL_1", "label_1", "1"]:
            return score
        return 1.0 - score

    def score_fast(self, text: str) -> float:
        """
        Fast TF-IDF baseline scoring (< 2ms latency).
        """
        cleaned = clean_text(text)
        if not cleaned:
            return 0.0

        if self.fast_model and self.fast_vectorizer:
            X = self.fast_vectorizer.transform([cleaned])
            probs = self.fast_model.predict_proba(X)[0]
            base_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
            lower = cleaned.lower()
            hinglish_toxic = ["pagal", "kutta", "kamina", "harami", "chutiya", "bakwaas", "saale", "gadha", "ullu", "bewakoof"]
            matches = sum(1 for kw in hinglish_toxic if kw in lower)
            if matches > 0:
                base_prob = max(base_prob, min(1.0, 0.35 + matches * 0.15))
            return base_prob

        # Heuristic fallback if model not loaded
        lower = cleaned.lower()
        toxic_keywords = ["idiot", "stupid", "moron", "hate", "shut up", "kill", "garbage", "trash", "loser", "ugly", "die", "pagal", "kutta", "kamina"]
        matches = sum(1 for kw in toxic_keywords if kw in lower)
        return min(1.0, float(matches * 0.35))

    def score(self, text: str, model_type: str = "primary") -> Dict[str, Any]:
        """
        Predicts toxicity score with standardized schema:
        - model_type: 'primary' (BERT Multilingual), 'comparison' (XLM-R v2), or 'fast' (TF-IDF)
        """
        cleaned = clean_text(text)
        features = extract_text_features(text)
        lang_meta = features.get("language_meta", detect_language(text))
        lang_name = lang_meta.get("language", "unknown")

        if text is None:
            return {
                "toxicity": 0.0,
                "toxicity_score": 0.0,
                "is_toxic": False,
                "confidence": 0.0,
                "model_used": "none",
                "backend": "UNAVAILABLE BACKEND",
                "language": "unknown",
                "status": "unavailable",
                "text_features": features,
            }

        if not cleaned:
            return {
                "toxicity": 0.0,
                "toxicity_score": 0.0,
                "is_toxic": False,
                "confidence": 1.0,
                "model_used": model_type,
                "backend": "MODEL BACKEND (Empty Input)",
                "language": lang_name,
                "status": "available",
                "text_features": features,
            }

        # Fast baseline path
        if model_type == "fast" or not self.use_transformer:
            score = self.score_fast(cleaned)
            backend_label = "FALLBACK BACKEND (TF-IDF + Logistic Regression)" if self.use_transformer else "MODEL BACKEND (TF-IDF + Logistic Regression)"
            return {
                "toxicity": round(score, 4),
                "toxicity_score": round(score, 4),
                "is_toxic": score >= 0.50,
                "confidence": round(abs(score - 0.5) * 2, 4),
                "model_used": "FAST BASELINE (TF-IDF + Logistic Regression)",
                "backend": backend_label,
                "language": lang_name,
                "status": "fallback" if self.use_transformer else "available",
                "text_features": features,
            }

        # Pretrained transformer path
        target_model_name = self.COMPARISON_MODEL_NAME if model_type == "comparison" else self.PRIMARY_MODEL_NAME
        model_label = "XLM-R Toxicity v2 (Research Comparison)" if model_type == "comparison" else "BERT Multilingual Toxicity (Primary)"

        try:
            if model_type == "comparison":
                if self._comparison_pipeline is None:
                    self._comparison_pipeline, self._comparison_id2label = self._get_pipeline(target_model_name)
                pipe, id2label = self._comparison_pipeline, self._comparison_id2label
            else:
                if self._primary_pipeline is None:
                    self._primary_pipeline, self._primary_id2label = self._get_pipeline(target_model_name)
                pipe, id2label = self._primary_pipeline, self._primary_id2label

            raw_res = pipe(cleaned)[0]
            toxic_prob = self._parse_toxic_prob(raw_res, id2label)
            confidence = float(raw_res.get("score", 0.5))

            return {
                "toxicity": round(toxic_prob, 4),
                "toxicity_score": round(toxic_prob, 4),
                "is_toxic": toxic_prob >= 0.50,
                "confidence": round(confidence, 4),
                "model_used": model_label,
                "backend": f"MODEL BACKEND ({model_label})",
                "language": lang_name,
                "status": "available",
                "text_features": features,
            }

        except Exception as e:
            # Graceful fallback without pipeline crash
            fallback_score = self.score_fast(cleaned)
            return {
                "toxicity": round(fallback_score, 4),
                "toxicity_score": round(fallback_score, 4),
                "is_toxic": fallback_score >= 0.50,
                "confidence": round(abs(fallback_score - 0.5) * 2, 4),
                "model_used": f"FAST BASELINE (Fallback due to: {type(e).__name__})",
                "backend": f"FALLBACK BACKEND (TF-IDF Baseline fallback due to: {type(e).__name__})",
                "language": lang_name,
                "status": "fallback",
                "text_features": features,
            }

