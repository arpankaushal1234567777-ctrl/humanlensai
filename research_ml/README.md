# HumanLens AI — Research & Machine Learning Platform
> **Member 3: Research & Machine Learning Lead**  
> Multimodal Communication Escalation Assessment & Evidence-Informed De-escalation Interventions

---

## Overview
HumanLens AI is a proactive, explainable multimodal machine learning platform designed to monitor observable interpersonal communication signals across **Text**, **Voice Audio**, **Facial Expression**, and **Longitudinal Behavioral Context** to detect communication escalation in real time and deliver formative, constructive interventions ("Before You Speak") before harm occurs.

---

## Multimodal Architecture

```
                    HUMANLENS AI
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
     TEXT              AUDIO             FACE
       │                 │                 │
       ▼                 ▼                 ▼
Multilingual          Whisper        Expression
 Toxicity              ASR            Features
  Model                 │
       │                 ▼
       │          Acoustic Features
       │                 │
       └──────────┬──────┘
                  │
                  ▼
        ┌──────────────────────┐
        │ MULTIMODAL FUSION    │
        │      ENGINE          │
        │                      │
        │ Logistic Regression  │
        │ Random Forest        │
        │ Small MLP            │
        └──────────┬───────────┘
                   │
                   ▼
             ESCALATION SCORE
                   │
          ┌────────┴────────┐
          ▼                 ▼
       LOW RISK          HIGH RISK
                            │
                            ▼
                    Qwen multimodal
                       reasoning
                            │
                            ▼
                    BEFORE YOU SPEAK
```

---

## Model Stack & Allocation

| Layer | Model / Tool | Role & Status |
| :--- | :--- | :--- |
| **Text Toxicity** | **BERT Multilingual Toxicity** (`textdetox/bert-multilingual-toxicity-classifier`) | ⭐ Primary Text Toxicity Scorer ($F_1 = 0.982$ EN, $0.971$ HI) |
| **Text Toxicity Comparison** | **XLM-R Toxicity v2** (`unitary/multilingual-toxic-xlm-roberta`) | Research Comparison Experiment ($F_1 = 0.951$) |
| **ASR (Speech-to-Text)** | **faster-whisper** (`WhisperModel`, tiny int8 CPU) | ⭐ Primary Audio Transcriber & Speech Text Extractor |
| **Voice Features** | **librosa** | ⭐ Primary Acoustic Feature Extractor (Pitch F0, RMS, Pauses, Rate) |
| **Face Expression** | **Expression / Landmark Model** | ⭐ Primary Privacy-Preserving Action Unit Scorer (AU4, AU7, AU15/23) |
| **Multimodal Fusion Engine** | **Our Own Custom Models** (Weighted, Logistic, Random Forest, Small MLP) | ⭐⭐⭐ Core Research Contribution (Cross-modal interactions & attribution) |
| **Reasoning** | **Qwen Multimodal Reasoning** (Qwen3-Omni / Qwen hybrid) | Advanced/High-Risk Contextual Synthesizer |
| **RAG System** | **Sentence Transformers / TF-IDF Vector DB** | ⭐ Evidence-Informed Guidance Retrieval |
| **Intervention** | **Rule + LLM Hybrid Engine** | ⭐ Real-Time "Before You Speak" Intervention Cards |

---

## Repository Structure

```
research_ml/
├── configs/
│   └── experiment_config.yaml         # Central pipeline & model configuration
├── data/
│   ├── audio/                         # Test audio signals (.wav)
│   ├── processed/                     # Civil Comments 100k, Multilingual Toxicity, Behavior synthetic
│   └── raw/                           # Raw source datasets
├── experiments/                       # 12-Week Roadmap Experiment Logs
│   ├── EXP-001_rule_baseline.md       # Deterministic fast-rule router
│   ├── EXP-002_tfidf_logistic.md      # Classical ML baseline (TF-IDF + Logistic)
│   ├── EXP-003_tfidf_svm.md           # Support Vector Machine comparison
│   ├── EXP-004_transformer.md        # BERT Multilingual vs XLM-RoBERTa
│   ├── EXP-005_behavior_baseline.md   # Behavior Lens longitudinal modeling
│   ├── EXP-006_text_voice_fusion.md   # Bimodal banter disambiguation
│   └── EXP-007_multimodal_fusion.md   # Core Multimodal Fusion Engine benchmarks
├── literature/                        # Formal Literature Review & Research Notes
│   ├── literature_review.md           # Comprehensive state-of-the-art review
│   ├── papers.csv                     # Surveyed literature database
│   └── research_notes/                # Notes P01 through P06
├── models/                            # Serialized Production Models
│   ├── text/                          # toxicity_model.pkl, vectorizer.pkl, aggression_model.pkl
│   ├── voice/                         # faster-whisper checkpoints cache
│   ├── behavior/                      # behavior_model.pkl
│   ├── fusion/                        # fusion_model.pkl (Custom models)
│   ├── emotion_logistic_regression.pkl# GoEmotions 28-class model
│   └── emotion_tfidf_vectorizer.pkl   # GoEmotions vectorizer
├── notebooks/                         # 14 Sequential Research Notebooks (01 to 14)
├── reports/                           # Formal Research Reports
│   ├── research_proposal.md           # Project scope & hypotheses
│   ├── methodology.md                 # Mathematical formulations & architectures
│   ├── model_evaluation.md            # Comprehensive benchmark tables & latencies
│   ├── bias_analysis.md               # Demographic FPR/FNR parity audit
│   ├── limitations.md                 # Real-world challenges & mitigations
│   └── final_research_report.md       # Flagship 12-Week Research Deliverable
├── scripts/                           # Production & Evaluation Utilities
│   ├── check_environment.py           # Hardware & dependency diagnostics
│   ├── demo_humanlens.py              # Interactive 5-scenario multimodal CLI demo
│   ├── generate_notebooks.py          # Notebook generator (01-14)
│   └── run_notebooks_inprocess.py     # In-process notebook runner
├── src/                               # Production Source Modules
│   ├── text/                          # Preprocessing, toxicity, aggression, emotion
│   ├── voice/                         # faster-whisper ASR & librosa acoustics
│   ├── face/                          # MediaPipe AU facial expression proxies
│   ├── behavior/                      # Behavior Lens trends & strain modeling
│   ├── fusion/                        # Weighted & learned multimodal fusion engines
│   ├── rag/                           # Knowledge base, semantic retriever, intervention cards
│   ├── reasoning/                     # Qwen multimodal reasoning & local fallback
│   ├── evaluation/                    # Metrics, calibration, bias, error analysis
│   └── pipeline.py                    # Unified end-to-end HumanLens pipeline
└── tests/                             # Comprehensive Integration Test Suite
    ├── test_text_layer.py             # Multilingual toxicity, threat, insult, emotion (10 tests)
    ├── test_voice_layer.py            # Whisper ASR & acoustic features (5 tests)
    ├── test_face_layer.py             # Action Unit proxies & zero-identity privacy (6 tests)
    ├── test_behavior_layer.py         # Longitudinal strain & missing data (5 tests)
    ├── test_fusion_layer.py           # Weighted & learned fusion attribution (6 tests)
    ├── test_rag_reasoning.py          # Semantic RAG & intervention cards (6 tests)
    ├── test_end_to_end.py             # Full hybrid routing & multimodal paths (8 tests)
    └── test_humanlens_pipeline.py     # Core pipeline regression tests (13 tests)
```

---

## Quickstart & Verification

### 1. System & Environment Diagnostic
```bash
python scripts/check_environment.py
```

### 2. Run Comprehensive Automated Test Discovery (59 Tests, 100% Pass)
```bash
python -m unittest discover -s tests -v
```

### 3. Run Interactive Multimodal Platform Demonstration
```bash
python scripts/demo_humanlens.py
```

### 4. Single-Message Python Execution
```python
from src.pipeline import HumanLensPipeline

pipeline = HumanLensPipeline()
result = pipeline.analyze(
    text="You complete idiot, stop ruining our project!",
    face_landmarks={"brow_distance": 0.20, "eye_aperture": 0.20, "mouth_aspect_ratio": 0.16, "confidence": 0.95},
    behavior_context={"sleep": {"current_hours": 4.5, "trend": "Decreasing"}, "stress": {"current_level": 8.5, "trend": "Increasing"}}
)

print(f"Risk Level: {result['risk_level']}")
print(f"Fusion Score: {result['fusion']['score']:.4f}")
print(f"Attribution: {result['fusion']['attribution']}")
if result["intervention_triggered"]:
    card = result["intervention_card"]
    print(f"Intervention Card: {card['title']}")
    print(f"Cooling Pause: {card['cooling_pause']['message']}")
    for rw in card["alternative_rewrites"]:
        print(f"  [{rw['style']}]: {rw['text']}")
```

