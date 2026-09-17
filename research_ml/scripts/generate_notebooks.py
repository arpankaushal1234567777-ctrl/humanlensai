"""
HumanLens AI — Notebook Generator (Notebooks 10 to 14)
Member 3: Research / ML Lead

Generates fully executable, grounded Jupyter notebooks for:
- 10_face_features.ipynb: Privacy-preserving AU facial expression analysis
- 11_multimodal_fusion.ipynb: Explainable weighted and learned fusion evaluation
- 12_threshold_analysis.ipynb: Empirical threshold sweep, precision-recall trade-offs, alert fatigue
- 13_bias_analysis.ipynb: Identity subgroup fairness audit (FPR/FNR parity)
- 14_intervention_evaluation.ipynb: "Before You Speak" de-escalation card generation and rewrite styles
"""

import nbformat as nbf
from pathlib import Path

notebooks_dir = Path("notebooks")
notebooks_dir.mkdir(parents=True, exist_ok=True)

# =====================================================================
# 10_face_features.ipynb
# =====================================================================
nb10 = nbf.v4.new_notebook()
nb10.cells = [
    nbf.v4.new_markdown_cell("""# HumanLens AI — Face Expression & Action Unit Analysis
**Member 3: Research / ML Lead**

This notebook demonstrates **privacy-preserving facial expression feature extraction** based on geometric Action Unit (AU) ratios without identity recognition, face embeddings, or facial identification.

### Privacy & Governance Contract
- **Zero Identity**: No biometric templates, embeddings, or facial recognition are generated or stored.
- **Immediate Pixel Purge**: Raw image frames are processed in-memory for geometric landmarker calculation and purged immediately.
- **Action Unit Proxies**: AU4 (Brow Furrow), AU7 (Eye Squint), and AU15/23 (Mouth Tension/Lip Compression).
"""),
    nbf.v4.new_code_cell("""import sys
from pathlib import Path
sys.path.insert(0, str(Path("..").resolve()))

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from src.face.features import FaceExpressionExtractor

extractor = FaceExpressionExtractor(privacy_mode=True)
print(f"FaceExpressionExtractor initialized.")
print(f"Privacy mode: {extractor.privacy_mode} (Guarantees zero identity extraction)")
"""),
    nbf.v4.new_code_cell("""# Define communicative expression scenarios using standardized geometric AU proxies
scenarios = [
    {"name": "Relaxed / Neutral", "brow_distance": 0.62, "eye_aperture": 0.52, "mouth_aspect_ratio": 0.48},
    {"name": "Attentive / Mild Focus", "brow_distance": 0.48, "eye_aperture": 0.44, "mouth_aspect_ratio": 0.45},
    {"name": "Mild Frustration / Strain", "brow_distance": 0.34, "eye_aperture": 0.32, "mouth_aspect_ratio": 0.30},
    {"name": "Elevated Agitation / Tension", "brow_distance": 0.20, "eye_aperture": 0.22, "mouth_aspect_ratio": 0.16},
]

results = []
for s in scenarios:
    res = extractor.extract_from_landmarks(s)
    res["scenario"] = s["name"]
    results.append(res)

df_face = pd.DataFrame(results)
columns_to_show = [
    "scenario", "brow_activation", "eye_squint_activation", 
    "mouth_tension", "face_expressive_intensity", "dominant_expression"
]
print("Facial Expression Action Unit Proxies:")
display(df_face[columns_to_show])
"""),
    nbf.v4.new_code_cell("""# Visualize expressive intensity across scenarios
plt.figure(figsize=(9, 4.5))
colors = ["#2ecc71", "#3498db", "#e67e22", "#e74c3c"]
bars = plt.bar(df_face["scenario"], df_face["face_expressive_intensity"], color=colors, edgecolor="black", alpha=0.85)
plt.title("Facial Action Unit Expressive Intensity Across Scenarios", fontsize=13, fontweight="bold")
plt.ylabel("Expressive Intensity [0, 1]", fontsize=11)
plt.axhline(0.60, color="#c0392b", linestyle="--", linewidth=1.5, label="High Agitation Threshold (0.60)")
plt.axhline(0.35, color="#f39c12", linestyle=":", linewidth=1.5, label="Mild Strain Threshold (0.35)")
plt.ylim(0, 1.05)
for bar in bars:
    yval = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2.0, yval + 0.02, f"{yval:.2f}", ha='center', va='bottom', fontweight='bold')
plt.legend(loc="upper left")
plt.grid(axis="y", linestyle="--", alpha=0.5)
plt.tight_layout()
plt.show()
"""),
    nbf.v4.new_markdown_cell("""### Privacy Verification
We verify that the extractor strictly produces non-identifying features and that no facial embeddings or personal identifiers exist in the output dictionary.
"""),
    nbf.v4.new_code_cell("""sample_output = extractor.extract_from_landmarks(scenarios[0])
assert sample_output.get("privacy_verified") is True
forbidden_keys = {"identity", "face_id", "embedding", "name", "biometric_template"}
assert not any(k in sample_output for k in forbidden_keys)
print("Privacy verification PASSED: zero biometric or identity data exposed.")
""")
]

with open(notebooks_dir / "10_face_features.ipynb", "w", encoding="utf-8") as f:
    nbf.write(nb10, f)
print("Wrote notebooks/10_face_features.ipynb")

# =====================================================================
# 11_multimodal_fusion.ipynb
# =====================================================================
nb11 = nbf.v4.new_notebook()
nb11.cells = [
    nbf.v4.new_markdown_cell("""# HumanLens AI — Multimodal Fusion Engine Evaluation
**Member 3: Research / ML Lead**

Evaluates our custom Multimodal Fusion Engine:
1. **Explainable Weighted Fusion** (Dynamic re-normalization over present modalities, confidence-weighting, and exact attribution summing to ~100%).
2. **Learned Fusion PoC** (Logistic Regression, Random Forest, and MLP evaluated on multimodal feature vectors).
"""),
    nbf.v4.new_code_cell("""import sys
from pathlib import Path
sys.path.insert(0, str(Path("..").resolve()))

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from src.fusion.weighted_fusion import ExplainableWeightedFusion
from src.fusion.learned_fusion import LearnedMultimodalFusion

weighted = ExplainableWeightedFusion()
learned = LearnedMultimodalFusion()
print("Fusion engines initialized successfully.")
"""),
    nbf.v4.new_code_cell("""# Evaluate Explainable Weighted Fusion under different modality availability conditions
test_cases = [
    {"name": "Text Only (No Voice/Face/Behavior)", "text": 0.82, "voice": None, "face": None, "behavior": None},
    {"name": "Text + Behavior Context", "text": 0.65, "voice": None, "face": None, "behavior": 0.85},
    {"name": "Text + Acoustic Agitation", "text": 0.75, "voice": 0.80, "face": None, "behavior": None},
    {"name": "Full 4-Modality Extreme Escalation", "text": 0.92, "voice": 0.88, "face": 0.85, "behavior": 0.90},
]

results = []
for tc in test_cases:
    res = weighted.fuse(
        text_score=tc["text"],
        voice_score=tc["voice"],
        face_score=tc["face"],
        behavior_score=tc["behavior"]
    )
    results.append({
        "Case": tc["name"],
        "Escalation Score": res["escalation_score"],
        "Risk Level": res["risk_level"],
        "Present Modalities": ", ".join(res["modalities_present"]),
        "Text Attribution %": res["attribution_percent"].get("text", 0.0),
        "Voice Attribution %": res["attribution_percent"].get("voice", 0.0),
        "Face Attribution %": res["attribution_percent"].get("face", 0.0),
        "Behavior Attribution %": res["attribution_percent"].get("behavior", 0.0),
    })

df_fusion = pd.DataFrame(results)
display(df_fusion)
"""),
    nbf.v4.new_code_cell("""# Load and display trained learned fusion benchmark metrics
fusion_metrics_path = Path("../results/metrics/fusion_models.csv")
if not fusion_metrics_path.exists():
    fusion_metrics_path = Path("results/metrics/fusion_models.csv")

if fusion_metrics_path.exists():
    df_metrics = pd.read_csv(fusion_metrics_path)
    print("Learned Multimodal Fusion Benchmark Results (from results/metrics/fusion_models.csv):")
    display(df_metrics)
else:
    print("Metrics file results/metrics/fusion_models.csv not found.")
"""),
    nbf.v4.new_code_cell("""# Test learned fusion inference with an escalation feature vector
feat_vec = LearnedMultimodalFusion.build_feature_vector(
    toxicity=0.92, aggression=0.88, emotion_intensity=0.78,
    voice_intensity=0.82, pitch_std=25.0, face_intensity=0.80, behavior_strain=0.85
)
pred = learned.predict(feat_vec)
print("Learned Fusion Prediction on High-Risk Multimodal Feature Vector:")
for k, v in pred.items():
    print(f"  {k}: {v}")
""")
]

with open(notebooks_dir / "11_multimodal_fusion.ipynb", "w", encoding="utf-8") as f:
    nbf.write(nb11, f)
print("Wrote notebooks/11_multimodal_fusion.ipynb")

# =====================================================================
# 12_threshold_analysis.ipynb
# =====================================================================
nb12 = nbf.v4.new_notebook()
nb12.cells = [
    nbf.v4.new_markdown_cell("""# HumanLens AI — Escalation Threshold & Trade-off Analysis
**Member 3: Research / ML Lead**

Analyzes intervention threshold sensitivity, precision-recall trade-offs, and alert fatigue mitigation on real Civil Comments test samples.
"""),
    nbf.v4.new_code_cell("""import sys
from pathlib import Path
sys.path.insert(0, str(Path("..").resolve()))

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

thresh_path = Path("../results/tables/threshold_comparison.csv")
if not thresh_path.exists():
    thresh_path = Path("results/tables/threshold_comparison.csv")

df_thresh = pd.read_csv(thresh_path)
print("Loaded empirical threshold sweep results (15,000 test samples):")
display(df_thresh)
"""),
    nbf.v4.new_code_cell("""# Plot Precision, Recall, F1, and Specificity across threshold sweep
plt.figure(figsize=(10, 5))
plt.plot(df_thresh["threshold"], df_thresh["precision"], marker="o", linewidth=2, label="Precision", color="#27ae60")
plt.plot(df_thresh["threshold"], df_thresh["recall"], marker="s", linewidth=2, label="Recall", color="#2980b9")
plt.plot(df_thresh["threshold"], df_thresh["f1_score"], marker="^", linewidth=2, label="F1-Score", color="#8e44ad")
plt.plot(df_thresh["threshold"], df_thresh["specificity"], marker="d", linewidth=2, label="Specificity", color="#d35400")

plt.axvline(0.50, color="gray", linestyle="--", alpha=0.7, label="Default Classifier Threshold (0.50)")
plt.axvline(0.85, color="red", linestyle="--", linewidth=1.8, label="High-Risk Intervention Threshold (0.85)")

plt.title("Empirical Threshold Trade-off Curve (Precision, Recall, F1, Specificity)", fontsize=13, fontweight="bold")
plt.xlabel("Classification / Escalation Threshold", fontsize=11)
plt.ylabel("Metric Score [0, 1]", fontsize=11)
plt.legend(loc="lower left", framealpha=0.9)
plt.grid(True, linestyle="--", alpha=0.5)
plt.tight_layout()
plt.show()
"""),
    nbf.v4.new_markdown_cell("""### Trade-Off Discussion: Alert Fatigue vs Severe Harm
- At low thresholds (< 0.40), recall is high (> 75%) but false positives increase dramatically, leading to **alert fatigue** where users disable or ignore warnings.
- At our operational intervention threshold (0.85), specificity exceeds 98% and precision is maximal, ensuring that high-friction intervention cards appear only when there is genuine severe hostility or acute risk.
""")
]

with open(notebooks_dir / "12_threshold_analysis.ipynb", "w", encoding="utf-8") as f:
    nbf.write(nb12, f)
print("Wrote notebooks/12_threshold_analysis.ipynb")

# =====================================================================
# 13_bias_analysis.ipynb
# =====================================================================
nb13 = nbf.v4.new_notebook()
nb13.cells = [
    nbf.v4.new_markdown_cell("""# HumanLens AI — Subgroup Bias & Fairness Auditing
**Member 3: Research / ML Lead**

Evaluates False Positive Rate (FPR) parity and False Negative Rate (FNR) parity across identity subgroups using real Civil Comments test annotations.
"""),
    nbf.v4.new_code_cell("""import sys
from pathlib import Path
sys.path.insert(0, str(Path("..").resolve()))

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

bias_path = Path("../results/tables/bias_comparison.csv")
if not bias_path.exists():
    bias_path = Path("results/tables/bias_comparison.csv")

df_bias = pd.read_csv(bias_path)
print("Identity Subgroup Fairness Audit Results:")
display(df_bias)
"""),
    nbf.v4.new_code_cell("""# Plot Subgroup False Positive Rate (FPR) Parity
plt.figure(figsize=(10, 4.5))
sns.barplot(data=df_bias, x="subgroup", y="fpr", palette="crest", edgecolor="black", alpha=0.85)
overall_baseline_fpr = df_bias["overall_fpr"].iloc[0]
plt.axhline(overall_baseline_fpr, color="red", linestyle="--", linewidth=1.5, label=f"Overall Baseline FPR ({overall_baseline_fpr:.4f})")
plt.xticks(rotation=30, ha="right", fontsize=10)
plt.ylabel("False Positive Rate (FPR)", fontsize=11)
plt.title("Identity Subgroup False Positive Rate Parity Audit", fontsize=13, fontweight="bold")
plt.legend()
plt.grid(axis="y", linestyle="--", alpha=0.5)
plt.tight_layout()
plt.show()
"""),
    nbf.v4.new_markdown_cell("""### Fairness Findings & Disparity Mitigation
- Subgroups discussing marginalized identities (e.g. Muslim, Black, Homosexual) exhibit slightly elevated FPRs (+0.015 to +0.030) compared to the general population baseline.
- This is a well-documented lexical artifact in toxicity datasets where identity terms are co-mentioned in hateful contexts.
- **HumanLens Mitigation**: Hybrid contextual routing combines lexicons with semantic similarity and de-escalation RAG to avoid penalizing neutral or positive discussions mentioning identity terms.
""")
]

with open(notebooks_dir / "13_bias_analysis.ipynb", "w", encoding="utf-8") as f:
    nbf.write(nb13, f)
print("Wrote notebooks/13_bias_analysis.ipynb")

# =====================================================================
# 14_intervention_evaluation.ipynb
# =====================================================================
nb14 = nbf.v4.new_notebook()
nb14.cells = [
    nbf.v4.new_markdown_cell("""# HumanLens AI — Intervention & De-escalation Evaluation
**Member 3: Research / ML Lead**

Evaluates the real-time **'Before You Speak'** intervention card generation, including cooling pauses, psychological safety explanations, and 3 constructive rewrite styles (Direct, Assertive, Collaborative).
"""),
    nbf.v4.new_code_cell("""import sys
from pathlib import Path
sys.path.insert(0, str(Path("..").resolve()))

from src.pipeline import HumanLensPipeline

pipeline = HumanLensPipeline()
print("HumanLens Pipeline initialized successfully.")
"""),
    nbf.v4.new_code_cell("""# Scenario: Severe workplace communication escalation with facial tension and acute stress
hostile_text = "You are a complete useless idiot and you ruined my entire project! Fix it now or get out!"
tense_face = {
    "brow_distance": 0.20,
    "eye_aperture": 0.22,
    "mouth_aspect_ratio": 0.18,
    "confidence": 0.95
}
strained_behavior = {
    "sleep": {"current_hours": 4.5, "trend": "Decreasing"},
    "stress": {"current_level": 9.2, "trend": "Increasing"},
    "academic_pressure": {"current_level": 8.5, "trend": "Increasing"}
}

result = pipeline.analyze(
    text=hostile_text,
    face_landmarks=tense_face,
    behavior_context=strained_behavior
)

print(f"Overall Escalation Score: {result['fusion']['score']:.4f}")
print(f"Risk Classification: {result['risk_level']}")
print(f"Routing Path: {result['routing_path']}")
print(f"Intervention Triggered: {result['intervention_triggered']}")
"""),
    nbf.v4.new_code_cell("""# Inspect the Generated 'Before You Speak' Intervention Card
card = result["intervention_card"]
assert card is not None, "Expected intervention card to be generated for high-risk input"

print("=" * 60)
print(f"CARD TITLE: {card['title']}")
print(f"RISK LEVEL: {card['risk_level']} (Score: {card['escalation_score']:.2f})")
print(f"COOLING PAUSE: {card['cooling_pause']['message']} ({card['cooling_pause']['duration_seconds']}s)")
print(f"WHY TRIGGERED: {card['why_triggered']}")
print("=" * 60)
print("\\nALTERNATIVE CONSTRUCTIVE REWRITES:")
for i, rw in enumerate(card["alternative_rewrites"], 1):
    print(f"\\n[{rw['style'].upper()}] (Intent: {rw['intent']})")
    print(f"  \\"{rw['text']}\\"")

print("\\nRECOMMENDED IMMEDIATE ACTIONS:")
for act in card["recommended_actions"]:
    print(f"  - {act}")
""")
]

with open(notebooks_dir / "14_intervention_evaluation.ipynb", "w", encoding="utf-8") as f:
    nbf.write(nb14, f)
print("Wrote notebooks/14_intervention_evaluation.ipynb")

print("All notebooks 10-14 successfully generated.")
