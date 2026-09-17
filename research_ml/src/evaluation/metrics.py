"""
HumanLens AI — Evaluation Metrics Module
Member 3: Research / ML Lead

Calculates precision, recall, F1, latency percentiles, and confusion matrices.
"""

from typing import Dict, Any, List, Optional
import time
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, average_precision_score
)


def compute_classification_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: Optional[np.ndarray] = None) -> Dict[str, Any]:
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.shape == (2, 2) else (0, 0, 0, 0)
    
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0

    res = {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1": round(float(f1), 4),
        "fpr": round(float(fpr), 4),
        "fnr": round(float(fnr), 4),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }

    if y_prob is not None:
        try:
            res["roc_auc"] = round(float(roc_auc_score(y_true, y_prob)), 4)
            res["pr_auc"] = round(float(average_precision_score(y_true, y_prob)), 4)
        except Exception:
            res["roc_auc"] = 0.5
            res["pr_auc"] = 0.5

    return res


def benchmark_latency(predict_fn, sample_inputs: List[Any], n_runs: int = 50) -> Dict[str, float]:
    """
    Measure p50, p95, and p99 inference latency in milliseconds.
    """
    latencies = []
    # Warmup
    for inp in sample_inputs[:min(5, len(sample_inputs))]:
        predict_fn(inp)

    for i in range(n_runs):
        inp = sample_inputs[i % len(sample_inputs)]
        t0 = time.perf_counter()
        predict_fn(inp)
        t1 = time.perf_counter()
        latencies.append((t1 - t0) * 1000.0)

    return {
        "p50_ms": round(float(np.percentile(latencies, 50)), 2),
        "p95_ms": round(float(np.percentile(latencies, 95)), 2),
        "p99_ms": round(float(np.percentile(latencies, 99)), 2),
        "mean_ms": round(float(np.mean(latencies)), 2),
    }
