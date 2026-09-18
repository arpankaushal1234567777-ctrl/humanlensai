"""
HumanLens AI — Learned Multimodal Fusion Models
Member 3: Research / ML Lead

Custom ML Fusion Models (SYNTHETIC PROOF-OF-CONCEPT):
1. Multimodal Logistic Regression (with cross-modal interactions)
2. Multimodal Random Forest (non-linear threshold combinations)
3. Multimodal Small MLP (Neural Late Fusion)

IMPORTANT SCIENTIFIC INTEGRITY LABEL:
These learned models are trained on calibrated synthetic cross-modal benchmarks.
They serve as a Proof-of-Concept for learned non-linear fusion.
The operational default remains Explainable Weighted Fusion until real-world multimodal ground truth is acquired.
"""

from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import numpy as np
import joblib

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

from src.config import classify_risk


class LearnedMultimodalFusion:
    """
    Implements and benchmarks our custom learned fusion architectures:
    Logistic Regression, Random Forest, and Small MLP.
    Explicitly marked: SYNTHETIC PROOF-OF-CONCEPT.
    """

    FEATURE_NAMES = [
        "toxicity_score",
        "aggression_score",
        "emotional_intensity",
        "voice_intensity",
        "pitch_variation",
        "face_expression_intensity",
        "behavioral_strain",
        "interaction_text_voice",
        "interaction_text_face",
        "interaction_emotion_behavior",
    ]

    PROVENANCE = "SYNTHETIC PROOF-OF-CONCEPT"

    def __init__(self, model_type: str = "random_forest", model_path: Optional[str] = None):
        self.model_type = model_type.lower()
        base_dir = Path(__file__).resolve().parent.parent.parent
        self.model_path = Path(model_path) if model_path else base_dir / "models" / "fusion" / "fusion_model.pkl"
        
        self.model = None
        self._load_saved_model()

    def _load_saved_model(self):
        try:
            if self.model_path.exists() and self.model_path.stat().st_size > 100:
                saved = joblib.load(self.model_path)
                if isinstance(saved, dict) and "model" in saved:
                    self.model = saved["model"]
                    self.model_type = saved.get("model_type", self.model_type)
                else:
                    self.model = saved
        except Exception:
            pass

    @classmethod
    def build_feature_vector(
        cls,
        toxicity: float,
        aggression: float,
        emotion_intensity: float,
        voice_intensity: float = 0.0,
        pitch_std: float = 0.0,
        face_intensity: float = 0.0,
        behavior_strain: float = 0.0,
    ) -> np.ndarray:
        """
        Assembles explicit multimodal features including non-linear interaction terms.
        """
        norm_pitch = min(1.0, pitch_std / 50.0) if pitch_std > 0 else 0.0

        # Cross-modality interaction terms
        text_composite = max(toxicity, aggression)
        interaction_text_voice = text_composite * voice_intensity
        interaction_text_face = text_composite * face_intensity
        interaction_emotion_behavior = emotion_intensity * behavior_strain

        features = [
            float(toxicity),
            float(aggression),
            float(emotion_intensity),
            float(voice_intensity),
            float(norm_pitch),
            float(face_intensity),
            float(behavior_strain),
            float(interaction_text_voice),
            float(interaction_text_face),
            float(interaction_emotion_behavior),
        ]
        return np.array(features, dtype=np.float32)

    @classmethod
    def train_models(
        cls,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        save_best: bool = True,
        save_dir: Optional[Path] = None,
    ) -> Dict[str, Any]:
        """
        Train and benchmark all 3 fusion models:
        1. Logistic Regression
        2. Random Forest
        3. Small MLP
        """
        models = {
            "logistic_regression": LogisticRegression(max_iter=500, class_weight="balanced", random_state=42),
            "random_forest": RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42),
            "small_mlp": MLPClassifier(hidden_layer_sizes=(32, 16), max_iter=400, random_state=42),
        }

        results = {}
        best_model_name = "random_forest"
        best_f1 = -1.0
        best_model_obj = None

        for name, clf in models.items():
            clf.fit(X_train, y_train)
            preds = clf.predict(X_val)
            probs = clf.predict_proba(X_val)[:, 1] if hasattr(clf, "predict_proba") else preds

            acc = accuracy_score(y_val, preds)
            prec = precision_score(y_val, preds, zero_division=0)
            rec = recall_score(y_val, preds, zero_division=0)
            f1 = f1_score(y_val, preds, zero_division=0)
            try:
                auc = roc_auc_score(y_val, probs)
            except Exception:
                auc = 0.5

            results[name] = {
                "accuracy": round(float(acc), 4),
                "precision": round(float(prec), 4),
                "recall": round(float(rec), 4),
                "f1": round(float(f1), 4),
                "roc_auc": round(float(auc), 4),
                "model_instance": clf,
            }

            if f1 > best_f1:
                best_f1 = f1
                best_model_name = name
                best_model_obj = clf

        if save_best and best_model_obj:
            if save_dir is None:
                base_dir = Path(__file__).resolve().parent.parent.parent
                save_dir = base_dir / "models" / "fusion"
            save_dir.mkdir(parents=True, exist_ok=True)
            
            joblib.dump(
                {
                    "model": best_model_obj,
                    "model_type": best_model_name,
                    "results": results,
                    "provenance": cls.PROVENANCE,
                },
                save_dir / "fusion_model.pkl"
            )

        return {
            "comparison": results,
            "best_model": best_model_name,
            "best_f1": round(best_f1, 4),
            "provenance": cls.PROVENANCE,
        }

    def predict(self, feature_vector: np.ndarray) -> Dict[str, Any]:
        """
        Predicts escalation probability and risk classification.
        """
        vec = feature_vector.reshape(1, -1)
        if self.model is not None and hasattr(self.model, "predict_proba"):
            escalation_prob = float(self.model.predict_proba(vec)[0][1])
        else:
            # Fallback heuristic calculation if no learned model loaded yet
            weights = np.array([0.25, 0.25, 0.15, 0.15, 0.05, 0.10, 0.05, 0.15, 0.10, 0.10])
            weights = weights / np.sum(weights)
            escalation_prob = float(np.dot(vec[0], weights))

        escalation_prob = float(np.clip(escalation_prob, 0.0, 1.0))
        risk_level, is_high_risk = classify_risk(escalation_prob)
        
        return {
            "escalation_score": round(escalation_prob, 4),
            "risk_level": risk_level,
            "is_high_risk": is_high_risk,
            "model_type": self.model_type,
            "provenance": self.PROVENANCE,
        }
