"""
HumanLens AI — Behavior Trends Module
Member 3: Research / ML Lead

Calculates rolling baselines, velocity of change, and trend directions.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np


class BehaviorTrendCalculator:
    """
    Computes 7-day rolling statistics, deltas from personal baseline,
    and categorical trend labels (Increasing, Decreasing, Stable).
    """

    def __init__(self, rolling_window: int = 7, threshold_pct: float = 0.08):
        self.rolling_window = rolling_window
        self.threshold_pct = threshold_pct

    def compute_trends(self, df: pd.DataFrame) -> pd.DataFrame:
        df_out = df.copy()
        
        metrics = [
            "sleep_hours",
            "stress_level",
            "academic_pressure",
            "social_interaction_hours",
            "screen_time_hours",
            "mood_score",
            "physical_activity_minutes",
        ]

        for m in metrics:
            if m in df_out.columns:
                # 7-day rolling mean
                avg_col = f"{m}_{self.rolling_window}d_avg"
                df_out[avg_col] = df_out[m].rolling(window=self.rolling_window, min_periods=1).mean()
                
                # Difference between latest value and rolling average
                change_col = f"{m}_change"
                df_out[change_col] = df_out[m] - df_out[avg_col]

                # Categorical trend
                trend_col = f"{m}_trend"
                std_val = df_out[m].std() if df_out[m].std() > 0 else 1.0
                rel_change = df_out[change_col] / std_val

                conditions = [
                    rel_change > self.threshold_pct,
                    rel_change < -self.threshold_pct,
                ]
                choices = ["Increasing", "Decreasing"]
                df_out[trend_col] = np.select(conditions, choices, default="Stable")

        return df_out

    def extract_latest_context(self, df_trends: pd.DataFrame) -> Dict[str, Any]:
        """
        Extract the most recent context dictionary from the longitudinal trend dataframe.
        """
        if df_trends.empty:
            return {}

        latest = df_trends.iloc[-1]
        context = {}
        
        mapping = {
            "sleep": ("sleep_hours", "hours"),
            "stress": ("stress_level", "level"),
            "academic_pressure": ("academic_pressure", "level"),
            "social_interaction": ("social_interaction_hours", "hours"),
            "screen_time": ("screen_time_hours", "hours"),
            "mood": ("mood_score", "score"),
            "physical_activity": ("physical_activity_minutes", "minutes"),
        }

        for key, (col_prefix, unit) in mapping.items():
            val = float(latest[col_prefix]) if col_prefix in latest else 0.0
            trend = str(latest[f"{col_prefix}_trend"]) if f"{col_prefix}_trend" in latest else "Stable"
            context[key] = {
                f"current_{unit}": round(val, 2),
                "trend": trend,
            }

        return context
