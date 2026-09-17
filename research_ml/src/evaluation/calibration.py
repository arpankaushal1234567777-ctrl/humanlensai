"""
HumanLens AI — Calibration Module
Member 3: Research / ML Lead

Calculates reliability diagrams, Brier score, and Expected Calibration Error (ECE).
"""

from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import brier_score_loss


def calculate_ece(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> Dict[str, Any]:
    """
    Computes Expected Calibration Error (ECE) and bin calibration data.
    """
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    bin_lowers = bin_boundaries[:-1]
    bin_uppers = bin_boundaries[1:]

    ece = 0.0
    bins_data = []

    for bin_lower, bin_upper in zip(bin_lowers, bin_uppers):
        in_bin = (y_prob >= bin_lower) & (y_prob < bin_upper)
        prop_in_bin = np.mean(in_bin)
        
        if prop_in_bin > 0:
            accuracy_in_bin = np.mean(y_true[in_bin])
            avg_confidence_in_bin = np.mean(y_prob[in_bin])
            ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin
            bins_data.append({
                "bin_range": f"{bin_lower:.1f}-{bin_upper:.1f}",
                "confidence": round(float(avg_confidence_in_bin), 4),
                "accuracy": round(float(accuracy_in_bin), 4),
                "count": int(np.sum(in_bin)),
            })

    brier = brier_score_loss(y_true, y_prob)

    return {
        "expected_calibration_error": round(float(ece), 4),
        "brier_score": round(float(brier), 4),
        "calibration_bins": bins_data,
        "is_well_calibrated": ece <= 0.08,
    }
