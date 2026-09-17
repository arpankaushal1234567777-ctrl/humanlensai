"""
HumanLens AI — Error Analysis & Edge Case Categorizer
Member 3: Research / ML Lead

Identifies and categorizes false positives (sarcasm, benign profanity, friendly banter)
and false negatives (passive-aggressive veiled threats).
"""

from typing import Dict, Any, List
import pandas as pd


def categorize_error(text: str, true_label: int, pred_label: int) -> str:
    """
    Taxonomy of common conversational AI failure modes.
    """
    if true_label == pred_label:
        return "Correct"

    lower = text.lower()
    
    # False Positives: System flagged benign as toxic
    if true_label == 0 and pred_label == 1:
        if any(w in lower for w in ["damn", "hell", "crap", "shit", "fuck"]) and not any(w in lower for w in ["you", "your", "kill", "die", "idiot"]):
            return "FP_Benign_Profanity_Without_Malice"
        if any(w in lower for w in ["lol", "haha", "lmao", "jk", "kidding"]):
            return "FP_Friendly_Banter_or_Joke"
        if any(w in lower for w in ["politics", "government", "policy", "senator", "president"]):
            return "FP_Political_Disagreement"
        return "FP_Lexical_Over_Sensitivity"

    # False Negatives: System missed toxic escalation
    if true_label == 1 and pred_label == 0:
        if any(w in lower for w in ["hope you", "watch out", "karma", "see what happens"]):
            return "FN_Veiled_Passive_Aggressive_Threat"
        if len(text.split()) > 40:
            return "FN_Long_Form_Nuanced_Toxicity"
        return "FN_Novel_Slang_or_Contextual_Attack"

    return "Unknown"


def analyze_errors_in_dataframe(df: pd.DataFrame, text_col: str = "text", true_col: str = "y_true", pred_col: str = "y_pred") -> pd.DataFrame:
    df_out = df.copy()
    df_out["error_category"] = [
        categorize_error(t, y_t, y_p)
        for t, y_t, y_p in zip(df_out[text_col], df_out[true_col], df_out[pred_col])
    ]
    return df_out
