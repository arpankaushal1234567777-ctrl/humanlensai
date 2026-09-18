"""
HumanLens AI — Explainable Weighted Multimodal Fusion Engine
Member 3: Research / ML Lead

Provides transparent, interpretable fusion of:
- Text (Toxicity + Aggression + Emotion)
- Voice (Acoustic Intensity + Pitch/Energy)
- Face (Landmark Expression Proxies)
- Behavior (Longitudinal Strain Context)

Features:
- Dynamic weight re-normalization strictly across available modalities
- Centralized risk classification via classify_risk(score)
- Modality confidence weighting
- Exact modality attribution summing to ~100%
- Detailed present vs. missing modality tracking
"""

from typing import Dict, Any, Optional, List
import numpy as np

from src.config import classify_risk, HumanLensConfig


class ExplainableWeightedFusion:
    """
    Transparent Multimodal Fusion Engine.
    Ensures explainability by decomposing the final Escalation Score into
    exact percentage contributions from each modality.
    """

    ALL_MODALITIES = ["text", "voice", "face", "behavior"]

    DEFAULT_WEIGHTS = {
        "text": 0.50,
        "voice": 0.25,
        "face": 0.15,
        "behavior": 0.10,
    }

    def __init__(self, base_weights: Optional[Dict[str, float]] = None):
        if base_weights:
            self.base_weights = base_weights.copy()
        else:
            cfg = HumanLensConfig.get_default()
            custom_w = cfg.get("fusion", "starting_weights")
            self.base_weights = custom_w if isinstance(custom_w, dict) else self.DEFAULT_WEIGHTS.copy()

    def fuse(
        self,
        text_score: Optional[float] = None,
        voice_score: Optional[float] = None,
        face_score: Optional[float] = None,
        behavior_score: Optional[float] = None,
        text_confidence: float = 1.0,
        voice_confidence: float = 1.0,
        face_confidence: float = 1.0,
        behavior_confidence: float = 1.0,
    ) -> Dict[str, Any]:
        """
        Dynamically adjusts weights based on modality presence and confidence.
        Renormalizes strictly across available modalities.
        """
        active_weights = {}
        scores = {}
        confidences = {}

        # 1. Text modality
        if text_score is not None:
            eff_w = self.base_weights.get("text", 0.50) * min(1.0, max(0.2, text_confidence))
            active_weights["text"] = eff_w
            scores["text"] = float(np.clip(text_score, 0.0, 1.0))
            confidences["text"] = min(1.0, max(0.0, text_confidence))

        # 2. Voice modality
        if voice_score is not None and voice_confidence > 0.05:
            eff_w = self.base_weights.get("voice", 0.25) * min(1.0, max(0.1, voice_confidence))
            active_weights["voice"] = eff_w
            scores["voice"] = float(np.clip(voice_score, 0.0, 1.0))
            confidences["voice"] = min(1.0, max(0.0, voice_confidence))

        # 3. Face modality
        if face_score is not None and face_confidence > 0.05:
            eff_w = self.base_weights.get("face", 0.15) * min(1.0, max(0.1, face_confidence))
            active_weights["face"] = eff_w
            scores["face"] = float(np.clip(face_score, 0.0, 1.0))
            confidences["face"] = min(1.0, max(0.0, face_confidence))

        # 4. Behavioral context
        if behavior_score is not None:
            eff_w = self.base_weights.get("behavior", 0.10) * min(1.0, max(0.1, behavior_confidence))
            active_weights["behavior"] = eff_w
            scores["behavior"] = float(np.clip(behavior_score, 0.0, 1.0))
            confidences["behavior"] = min(1.0, max(0.0, behavior_confidence))

        # Fallback if no modalities provided
        if not active_weights:
            return {
                "risk_score": 0.0,
                "risk_level": "Low Risk",
                "intervention_required": False,
                "modality_contributions": {},
                "available_modalities": [],
                "missing_modalities": self.ALL_MODALITIES.copy(),
                # Backward-compatible aliases
                "escalation_score": 0.0,
                "is_high_risk": False,
                "modality_scores": {},
                "normalized_weights": {},
                "attribution_percent": {},
                "confidence": 0.0,
                "modalities_present": [],
                "modalities_missing": self.ALL_MODALITIES.copy(),
            }

        # Renormalize weights strictly over present modalities
        total_weight = sum(active_weights.values())
        normalized_weights = {k: v / total_weight for k, v in active_weights.items()}

        # Compute fused escalation score
        escalation_score = sum(normalized_weights[k] * scores[k] for k in active_weights)
        escalation_score = float(np.clip(escalation_score, 0.0, 1.0))

        # Compute overall confidence
        overall_conf = sum(normalized_weights[k] * confidences.get(k, 1.0) for k in active_weights)

        # Modality attribution summing to ~100%
        attribution = {}
        if escalation_score > 0.001:
            for k in active_weights:
                contrib = normalized_weights[k] * scores[k]
                attribution[k] = round(float(contrib / escalation_score) * 100.0, 1)
        else:
            for k in active_weights:
                attribution[k] = round(normalized_weights[k] * 100.0, 1)

        # Ensure attribution approximately sums to 100%
        attr_sum = sum(attribution.values())
        if attr_sum > 0 and abs(attr_sum - 100.0) > 0.5:
            scale = 100.0 / attr_sum
            attribution = {k: round(v * scale, 1) for k, v in attribution.items()}

        # Centralized Risk Classification
        risk_level, is_high_risk = classify_risk(escalation_score)

        present = list(active_weights.keys())
        missing = [m for m in self.ALL_MODALITIES if m not in present]

        return {
            "risk_score": round(escalation_score, 4),
            "risk_level": risk_level,
            "intervention_required": is_high_risk,
            "modality_contributions": attribution,
            "available_modalities": present,
            "missing_modalities": missing,
            # Backward-compatible aliases
            "escalation_score": round(escalation_score, 4),
            "is_high_risk": is_high_risk,
            "modality_scores": {k: round(scores[k], 4) for k in scores},
            "normalized_weights": {k: round(v, 4) for k, v in normalized_weights.items()},
            "attribution_percent": attribution,
            "confidence": round(float(overall_conf), 4),
            "modalities_present": present,
            "modalities_missing": missing,
        }
