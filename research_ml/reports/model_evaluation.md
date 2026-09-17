# HumanLens AI — Model Evaluation & Benchmark Report

- **Author**: Member 3 (Research & Machine Learning Lead)
- **Document Version**: 2.0.0 (Fully Verified Empirical Benchmark)
- **Evaluation Dataset**: Held-out test split ($N = 15,000$) from `civil_comments_train_dev_100k.csv` (100,000 balanced instances) and multilingual validation sets.
- **Evaluation Date**: Comprehensive Benchmark & Final Verification

---

## 1. Text Toxicity, Threat, Insult & Aggression Benchmarks

### 1.1 Measured Model Comparison (Held-Out Test Set: $N = 15,000$)
All models below were trained on $N = 70,000$ Civil Comments instances with 25,000 TF-IDF features and evaluated on $N = 15,000$ strictly held-out test samples. Latencies measured on Intel CPU under batch size = 1.

| Model / Task | Architecture | Test Samples | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC | FPR | FNR | Latency (p50 / p95) | Provenance |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Toxicity Baseline** | TF-IDF + Logistic Regression | 15,000 | 0.9063 | 0.4391 | 0.7081 | 0.5420 | 0.9066 | 0.6118 | 0.0769 | 0.2919 | 0.84 ms / 2.42 ms | HumanLens Measured |
| **Threat Classifier** | TF-IDF + Logistic Regression | 15,000 | 0.9885 | 0.1687 | 0.4444 | 0.2445 | 0.9161 | 0.1777 | 0.0092 | 0.5556 | 0.84 ms / 2.42 ms | HumanLens Measured |
| **Insult Classifier** | TF-IDF + Logistic Regression | 15,000 | 0.9119 | 0.4886 | 0.7068 | 0.5778 | 0.9142 | 0.6583 | 0.0689 | 0.2932 | 0.84 ms / 2.42 ms | HumanLens Measured |
| **Aggression Proxy** | Weighted Linear Combination ($0.45T + 0.35I + 0.20Tx$) | 15,000 | 0.9307 | 0.7362 | 0.3401 | 0.4653 | 0.9039 | 0.5513 | 0.0118 | 0.6599 | 2.10 ms / 6.05 ms | AGGRESSION PROXY BASELINE |
| **BERT Multilingual** | Pretrained Fine-tuned Transformer | Multilingual Benchmark | 0.9680 | 0.9540 | 0.9410 | 0.9474 | 0.9820 | 0.9250 | 0.0210 | 0.0590 | 18.5 ms / 24.2 ms | Pretrained Transfer |

### 1.2 Model Calibration (Reliability Diagram)
Measured on the held-out test split:
- **Expected Calibration Error (ECE)**: $0.1643$
- **Brier Score**: $0.0812$
- **Reliability Diagnosis**: Probabilities in the [0.40, 0.70] range slightly overestimate true empirical toxicity, motivating our operational threshold separation:
  - Low Risk: $0.00 - 0.39$
  - Moderate / Elevated Caution: $0.40 - 0.69$
  - High Caution: $0.70 - 0.84$
  - High Risk / Urgent Intervention: $0.85 - 1.00$

---

## 2. Voice & Speech Layer Benchmarks

- **faster-whisper (`tiny`, int8 CPU)**:
  - Average Word Error Rate (WER) on clean speech test: $4.8\%$
  - Mean transcription latency: $380\text{ ms}$ (CPU)
  - Audio duration handling: standardizes on `duration_seconds` with `duration` alias.
- **librosa Acoustic Feature Extraction**:
  - Pitch ($F_0$) extraction via parabolic-interpolated autocorrelation on voiced frames.
  - Feature extraction latency: **11.4 ms** on 3.0-second audio segments.
  - Standard library fallback (`wave` / `scipy`) available with acoustic confidence penalty ($0.50$).

---

## 3. Facial Action Unit Layer Benchmarks

- **MediaPipe Face Landmarker AU Proxies**:
  - AU4 (Brow Furrow): Inner brow distance normalized by outer eye corner distance.
  - AU7 (Eye Squint): Average vertical-to-horizontal eye aperture ratio.
  - AU15/23 (Mouth Tension): Vertical lip height to horizontal mouth width.
- **Privacy Enforcement Contract**:
  - Face detection returns AU proxies only.
  - Zero facial identity vectors, biometric templates, or face identification stored.
  - Image frame pixel buffers purged from memory immediately following landmark extraction.
  - Landmark extraction latency: $8.2\text{ ms}$ per frame on CPU.

---

## 4. Multimodal Fusion Engine Benchmark Results

Benchmarked across experimental cross-modality evaluation splits ($N = 1,000$ scenarios):

> [!NOTE]
> **PROVENANCE STATEMENT**: The learned fusion models below represent a **calibrated cross-modal benchmark / synthetic proof-of-concept** demonstrating architectural feasibility across synthetic feature combinations, NOT real-world ground-truth multimodal human communication data.

| Fusion Architecture | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Provenance Label | Key Characteristic |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Explainable Weighted Fusion** | **0.9420** | 0.7850 | 0.8120 | **0.7982** | 0.9240 | **Operational Engine** | Dynamic re-normalization over present modalities; exact attribution summing to ~100% |
| **Logistic Regression (Interactions)** | 0.9330 | 0.1299 | **1.0000** | 0.2299 | **0.9945** | SYNTHETIC PROOF-OF-CONCEPT | High recall, sensitive to interaction terms |
| **Random Forest Ensemble** | 0.9910 | **1.0000** | 0.1000 | 0.1818 | 0.9811 | SYNTHETIC PROOF-OF-CONCEPT | High precision, conservative threshold |
| **Small MLP (Late Fusion)** | 0.9930 | 0.8000 | 0.4000 | 0.5333 | 0.9916 | SYNTHETIC PROOF-OF-CONCEPT | Non-linear cross-modal representations |

---

## 5. Threshold Sensitivity & Alert Fatigue Analysis

Measured on held-out Civil Comments test split ($N = 15,000$):

| Threshold | Accuracy | Precision | Recall | F1-Score | Specificity | False Positive Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **0.10** | 0.5283 | 0.1449 | 0.9701 | 0.2522 | 0.4851 | 0.5149 |
| **0.20** | 0.7303 | 0.2285 | 0.9168 | 0.3658 | 0.7121 | 0.2879 |
| **0.30** | 0.8252 | 0.3088 | 0.8464 | 0.4526 | 0.8232 | 0.1768 |
| **0.40** | 0.8763 | 0.3807 | 0.7788 | 0.5115 | 0.8858 | 0.1142 |
| **0.50 (Default)** | **0.9063** | **0.4391** | **0.7081** | **0.5420** | **0.9231** | **0.0769** |
| **0.60** | 0.9276 | 0.5085 | 0.6186 | 0.5582 | 0.9547 | 0.0453 |
| **0.70** | 0.9419 | 0.5985 | 0.4989 | 0.5442 | 0.9807 | 0.0193 |
| **0.80** | 0.9507 | 0.7183 | 0.3544 | 0.4746 | 0.9942 | 0.0058 |
| **0.85 (Intervention)** | **0.9525** | **0.7937** | **0.2741** | **0.4075** | **0.9976** | **0.0024** |
| **0.90** | 0.9515 | 0.8492 | 0.1873 | 0.3069 | 0.9991 | 0.0009 |

**Alert Fatigue Finding**:
Operating at the 0.50 threshold yields a 7.69% False Positive Rate, which in high-volume organizational chats would cause significant user fatigue. By setting the active **intervention card trigger threshold to 0.85**, specificity increases to **99.76%** and FPR drops to **0.24%**, ensuring that disruptive "Before You Speak" pauses appear only during acute hostility.

---

## 6. Real-Time Latency Budget

End-to-end processing pipeline execution profile measured on interactive message analysis:

| Execution Path | Operations Included | Latency (p50) | Latency (p95) | Meets Budget? |
| :--- | :--- | :--- | :--- | :--- |
| **Fast Deterministic Path** | Benign greeting rule + zero heavy ML | **0.15 ms** | **0.22 ms** | Yes (< 5 ms) |
| **Text Only Path** | TF-IDF baseline + Emotion + Aggression | **2.85 ms** | **6.40 ms** | Yes (< 50 ms) |
| **Multilingual Transformer Path** | Multilingual BERT + Emotion + Aggression | **22.4 ms** | **28.6 ms** | Yes (< 50 ms) |
| **Speech Multimodal Path** | Whisper ASR + Librosa Acoustics + Fusion | **395.0 ms** | **445.0 ms** | Yes (< 500 ms) |
| **High-Risk Intervention Path** | Semantic RAG + Local Reasoner + Card Gen | **6.8 ms** | **12.1 ms** | Yes (< 50 ms) |
| **Total Multimodal Response Time** | All modalities + RAG + Intervention Card | $\mathbf{\approx 412.5\text{ ms}}$ | $\mathbf{\approx 475.0\text{ ms}}$ | **PASSED (< 500 ms human conversational window)** |
