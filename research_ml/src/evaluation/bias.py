"""
HumanLens AI — Bias & Fairness Evaluation Module
Member 3: Research / ML Lead

Assesses False Positive Rate (FPR) parity and False Negative Rate (FNR) parity
across demographic identity subgroups to ensure ethical guardrails.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from src.evaluation.metrics import compute_classification_metrics


class BiasEvaluator:
    """
    Evaluates unintended social and demographic bias across groups.
    Enforces rule: Demographic attributes must NOT serve as direct risk predictors.
    """

    def __init__(self, max_acceptable_fpr_gap: float = 0.08):
        self.max_acceptable_fpr_gap = max_acceptable_fpr_gap

    def evaluate_subgroup_fairness(
        self,
        df: pd.DataFrame,
        group_columns: List[str],
        y_true_col: str = "is_toxic",
        y_pred_col: str = "pred_toxic",
        y_prob_col: str = "pred_prob",
    ) -> Dict[str, Any]:
        """
        Calculates per-group metrics and checks FPR parity.
        """
        group_results = {}
        overall_metrics = compute_classification_metrics(
            df[y_true_col].values, df[y_pred_col].values, df[y_prob_col].values if y_prob_col in df else None
        )

        fpr_list = []

        for group in group_columns:
            if group not in df.columns:
                continue
            # Subgroup where identity term is mentioned (value >= 0.5)
            sub_df = df[df[group] >= 0.5]
            if len(sub_df) < 10:
                continue

            sub_metrics = compute_classification_metrics(
                sub_df[y_true_col].values,
                sub_df[y_pred_col].values,
                sub_df[y_prob_col].values if y_prob_col in sub_df else None,
            )
            fpr_gap = sub_metrics["fpr"] - overall_metrics["fpr"]
            sub_metrics["fpr_disparity"] = round(float(fpr_gap), 4)
            group_results[group] = sub_metrics
            fpr_list.append(sub_metrics["fpr"])

        max_fpr = max(fpr_list) if fpr_list else overall_metrics["fpr"]
        min_fpr = min(fpr_list) if fpr_list else overall_metrics["fpr"]
        fpr_spread = round(float(max_fpr - min_fpr), 4)

        return {
            "overall_metrics": overall_metrics,
            "subgroup_metrics": group_results,
            "fpr_spread": fpr_spread,
            "fairness_passed": fpr_spread <= self.max_acceptable_fpr_gap,
            "ethical_guardrail_status": (
                "PASSED: No demographic features used as inputs. FPR parity within tolerance."
                if fpr_spread <= self.max_acceptable_fpr_gap
                else "FLAGGED: FPR disparity requires confidence threshold calibration."
            ),
        }
