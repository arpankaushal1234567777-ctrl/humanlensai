"""
HumanLens AI — Behavior Lens Model & Synthesizer
Member 3: Research / ML Lead

Generates non-diagnostic contextual representations and calculates
longitudinal vulnerability modifiers without making clinical or medical claims.

Enforces Critical Privacy & Data Integrity Rule:
Never silently treat synthetic behavior context as real user context.
Behavior modality defaults to 'unavailable' unless user context is provided or demo mode is explicitly enabled.
"""

from typing import Dict, Any, Optional, Tuple
from pathlib import Path
import json
import numpy as np
import pandas as pd


class BehaviorLensModel:
    """
    Behavior Lens contextualizer:
    Calculates a non-diagnostic behavioral strain / vulnerability modifier [0, 1]
    representing compounding stressors (e.g. chronic low sleep + rising academic pressure + rising stress).
    """

    def __init__(
        self,
        synthetic_data_path: Optional[str] = None,
        demo_mode: bool = False,
        use_synthetic_behavior: bool = False,
    ):
        base_dir = Path(__file__).resolve().parent.parent.parent
        self.data_path = Path(synthetic_data_path) if synthetic_data_path else base_dir / "data" / "processed" / "behavior_lens_synthetic.csv"
        self.context_json_path = base_dir / "results" / "behavior_context.json"
        self.demo_mode = demo_mode
        self.use_synthetic_behavior = use_synthetic_behavior

    def resolve_context(
        self,
        behavior_context: Optional[Dict[str, Any]] = None,
        demo_mode: Optional[bool] = None,
        use_synthetic_behavior: Optional[bool] = None,
    ) -> Tuple[Optional[Dict[str, Any]], str, str]:
        """
        Resolves context and determines its provenance:
        Returns:
            (context_dict, source, status)
            source is one of: 'user_provided', 'research_dataset', 'synthetic_demo', 'no_user_context'
            status is one of: 'available', 'unavailable'
        """
        if behavior_context is not None and isinstance(behavior_context, dict) and len(behavior_context) > 0:
            ctx_source = behavior_context.get("source", "user_provided")
            if ctx_source not in ["user_provided", "research_dataset", "synthetic_demo"]:
                ctx_source = "user_provided"
            return behavior_context, ctx_source, "available"

        # Check explicit demo flags
        is_demo = self.demo_mode if demo_mode is None else demo_mode
        is_synth = self.use_synthetic_behavior if use_synthetic_behavior is None else use_synthetic_behavior

        if is_demo or is_synth:
            synth_ctx = self._load_synthetic_demo_context()
            if synth_ctx:
                return synth_ctx, "synthetic_demo", "available"

        return None, "no_user_context", "unavailable"

    def _load_synthetic_demo_context(self) -> Dict[str, Any]:
        """Loads synthetic benchmark data strictly for demo / test execution."""
        if self.context_json_path.exists():
            try:
                with open(self.context_json_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass

        if self.data_path.exists():
            try:
                df = pd.read_csv(self.data_path)
                from src.behavior.trends import BehaviorTrendCalculator
                calculator = BehaviorTrendCalculator()
                trends_df = calculator.compute_trends(df)
                return calculator.extract_latest_context(trends_df)
            except Exception:
                pass

        # Fallback synthetic demo fixture
        return {
            "sleep": {"current_hours": 6.0, "trend": "Decreasing", "baseline_hours": 7.5},
            "stress": {"current_level": 7.0, "trend": "Increasing", "baseline_level": 4.5},
            "academic_pressure": {"current_level": 7.5, "trend": "Increasing", "baseline_level": 5.0},
            "social_interaction": {"current_hours": 2.0, "trend": "Decreasing", "baseline_hours": 4.0},
            "screen_time": {"current_hours": 8.0, "trend": "Increasing", "baseline_hours": 5.5},
        }

    def calculate_behavioral_strain_score(self, context: Optional[Dict[str, Any]]) -> float:
        """
        Computes non-diagnostic composite strain [0, 1].
        Robust against missing keys; returns 0.0 if context is None or empty.
        """
        if not context:
            return 0.0

        score = 0.0

        # Stress factor (0.30 weight)
        stress = context.get("stress", {})
        stress_val = float(stress.get("current_level", 5.0))
        stress_trend = stress.get("trend", "Stable")
        stress_term = (stress_val / 10.0) * (1.2 if stress_trend == "Increasing" else (0.85 if stress_trend == "Decreasing" else 1.0))
        score += 0.30 * min(1.0, max(0.0, stress_term))

        # Sleep deficit factor (0.30 weight)
        sleep = context.get("sleep", {})
        sleep_hours = float(sleep.get("current_hours", 7.5))
        sleep_trend = sleep.get("trend", "Stable")
        sleep_deficit = max(0.0, (8.0 - sleep_hours) / 5.0)
        sleep_term = sleep_deficit * (1.25 if sleep_trend == "Decreasing" else (0.85 if sleep_trend == "Increasing" else 1.0))
        score += 0.30 * min(1.0, max(0.0, sleep_term))

        # Academic / Work pressure factor (0.20 weight)
        pressure = context.get("academic_pressure", {})
        pressure_val = float(pressure.get("current_level", 5.0))
        pressure_trend = pressure.get("trend", "Stable")
        pressure_term = (pressure_val / 10.0) * (1.15 if pressure_trend == "Increasing" else (0.85 if pressure_trend == "Decreasing" else 1.0))
        score += 0.20 * min(1.0, max(0.0, pressure_term))

        # Digital overload / screen time (0.10 weight)
        screen = context.get("screen_time", {})
        screen_hours = float(screen.get("current_hours", 6.0))
        screen_term = min(1.0, screen_hours / 12.0)
        score += 0.10 * screen_term

        # Low social interaction isolation factor (0.10 weight)
        social = context.get("social_interaction", {})
        social_hours = float(social.get("current_hours", 3.0))
        social_deficit = max(0.0, (4.0 - social_hours) / 4.0)
        score += 0.10 * social_deficit

        return round(float(np.clip(score, 0.0, 1.0)), 4)

    def generate_behavior_summary(self, context: Optional[Dict[str, Any]], source: str = "user_provided") -> str:
        """
        Generate human-readable, non-diagnostic behavioral summary for AI reasoning.
        """
        if not context or source in ["unavailable", "no_user_context"]:
            return "Behavioral baseline: No longitudinal context provided (modality unavailable)."

        notes = []
        prefix = "[SYNTHETIC DEMO] " if source == "synthetic_demo" else ("[RESEARCH DATASET] " if source == "research_dataset" else "")

        sleep = context.get("sleep", {})
        if sleep.get("trend") == "Decreasing" or float(sleep.get("current_hours", 8)) < 6.0:
            notes.append(f"Sleep trend: Decreasing ({sleep.get('current_hours')} hrs/night)")

        stress = context.get("stress", {})
        if stress.get("trend") == "Increasing" or float(stress.get("current_level", 5)) > 6.5:
            notes.append(f"Perceived stress: Elevated ({stress.get('current_level')}/10, {stress.get('trend', 'Elevated')})")

        academic = context.get("academic_pressure", {})
        if academic.get("trend") == "Increasing" or float(academic.get("current_level", 5)) > 6.5:
            notes.append(f"Academic pressure: High ({academic.get('current_level')}/10)")

        if not notes:
            return f"{prefix}Behavioral baseline: Stable across sleep, stress, and activity levels."

        return f"{prefix}Compounding behavioral factors: " + "; ".join(notes) + " (Non-diagnostic context)."

    def evaluate(
        self,
        behavior_context: Optional[Dict[str, Any]] = None,
        demo_mode: Optional[bool] = None,
        use_synthetic_behavior: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        Full evaluation endpoint returning structured status, source, strain, and summary.
        """
        ctx, source, status = self.resolve_context(behavior_context, demo_mode, use_synthetic_behavior)
        strain = self.calculate_behavioral_strain_score(ctx) if status == "available" else 0.0
        summary = self.generate_behavior_summary(ctx, source=source)

        return {
            "strain": strain if status == "available" else None,
            "strain_score": strain if status == "available" else 0.0,
            "source": source,
            "status": status,
            "context": ctx,
            "summary": summary,
        }
