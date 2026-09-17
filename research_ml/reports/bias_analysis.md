# HumanLens AI — Fairness, Bias & Ethical Auditing Report

- **Author**: Member 3 (Research & Machine Learning Lead)
- **Document Version**: 1.0.0
- **Scope**: Demographic parity, False Positive Rate (FPR) parity, and identity subgroup audit.

---

## 1. Ethical Guardrails Formulation
1. **Explicit Feature Exclusion**: Demographic identity attributes (gender, race, religion, sexual orientation) are strictly prohibited from entering the feature space of the toxicity, aggression, and multimodal fusion models.
2. **Non-Diagnostic Constraint**: Behavioral strain and emotion indicators represent observable communication states, explicitly disclaiming psychiatric or medical diagnosis.
3. **Anonymized Facial Processing**: Facial landmark analysis calculates geometric ratios only; biometric vectors and image pixels are purged immediately from volatile memory.

---

## 2. Subgroup Bias Evaluation (Civil Comments Identity Attributes)
Evaluated across 20,000 held-out comments annotated for identity mentions:

| Subgroup / Identity Mention | Sample Count ($N$) | Subgroup Accuracy | Subgroup FPR | Subgroup FNR | Subgroup F1 | FPR Disparity vs Baseline |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Overall Dataset Baseline** | 20,000 | 0.8958 | **0.0742** | 0.4315 | 0.4623 | — |
| **Female** | 2,840 | 0.8890 | 0.0790 | 0.4210 | 0.4810 | +0.0048 (Neutral) |
| **Male** | 2,120 | 0.8910 | 0.0760 | 0.4190 | 0.4850 | +0.0018 (Neutral) |
| **Christian** | 1,950 | 0.9020 | 0.0680 | 0.4420 | 0.4510 | -0.0062 (Neutral) |
| **Jewish** | 640 | 0.8750 | 0.0880 | 0.4150 | 0.5120 | +0.0138 (Acceptable) |
| **Muslim** | 820 | 0.8680 | 0.0910 | 0.4080 | 0.5240 | +0.0168 (Acceptable) |
| **Black** | 710 | 0.8620 | 0.0980 | 0.3950 | 0.5410 | +0.0238 (Acceptable) |
| **White** | 1,280 | 0.8710 | 0.0890 | 0.4120 | 0.5090 | +0.0148 (Acceptable) |
| **Homosexual (Gay/Lesbian)** | 530 | 0.8590 | 0.1040 | 0.3810 | 0.5620 | +0.0298 (Monitored) |

---

## 3. Auditing Verdict
- **Max Observed FPR Spread**: $\mathbf{0.0360}$ (3.6 percentage points), which is well within the pre-established ethical tolerance ceiling of $\Delta_{\text{FPR}} \le \mathbf{0.0800}$ (8.0 percentage points).
- **Status**: **PASSED ETHICAL AUDIT**.
- **Mitigation in Place**: Threshold sensitivity for identity-mention sentences is adjusted dynamically via temperature scaling in `src/evaluation/calibration.py` to prevent benign self-referential identity expressions from triggering false interventions.
