"""
HumanLens AI — Behavior Features Module
Member 3: Research / ML Lead

Loads and normalizes longitudinal behavioral logs.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np


class BehaviorFeatureLoader:
    """
    Normalizes multi-day behavioral log inputs across:
    sleep, stress, academic pressure, social interaction, screen time, mood, physical activity.
    """

    CORE_METRICS = [
        "sleep_hours",
        "stress_level",
        "academic_pressure",
        "social_interaction_hours",
        "screen_time_hours",
        "mood_score",
        "physical_activity_minutes",
    ]

    # Typical clinical/healthy reference bounds for min-max scaling
    BOUNDS = {
        "sleep_hours": (3.0, 12.0),
        "stress_level": (1.0, 10.0),
        "academic_pressure": (1.0, 10.0),
        "social_interaction_hours": (0.0, 10.0),
        "screen_time_hours": (1.0, 16.0),
        "mood_score": (1.0, 10.0),
        "physical_activity_minutes": (0.0, 180.0),
    }

    def normalize_daily_log(self, daily_dict: Dict[str, float]) -> Dict[str, float]:
        """
        Scale each behavioral variable into [0, 1].
        """
        normalized = {}
        for metric, (low, high) in self.BOUNDS.items():
            val = daily_dict.get(metric, (low + high) / 2.0)
            norm_val = (val - low) / (high - low)
            normalized[f"{metric}_normalized"] = round(float(np.clip(norm_val, 0.0, 1.0)), 4)
        return normalized

    def load_timeseries_dataframe(self, csv_path: str) -> pd.DataFrame:
        df = pd.read_csv(csv_path)
        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"])
            df = df.sort_values("date").reset_index(drop=True)
        return df
