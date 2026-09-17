# Experiment EXP-002: TF-IDF + Logistic Regression Baseline

- **Experiment ID**: EXP-002
- **Date**: Week 3 (Roadmap Phase 1)
- **Author**: Member 3 (Research & ML Lead)
- **Status**: Completed

## 1. Objective
Develop and validate a classical machine learning baseline for fast text toxicity classification on the Civil Comments 100k dataset.

## 2. Methodology
- **Dataset**: `civil_comments_train_dev_100k.csv` (25,000 stratified train/dev samples).
- **Features**: N-gram TF-IDF (1, 2-grams), maximum 15,000 features, minimum document frequency = 2.
- **Model**: Logistic Regression with balanced class weighting and L2 regularization ($C=1.0$).

## 3. Results & Metrics
- **Accuracy**: 0.8958
- **Precision**: 0.3896
- **Recall**: 0.5685
- **F1-Score**: 0.4623
- **ROC-AUC**: 0.8461
- **Inference Latency**: **1.85 ms** (p95: 2.40 ms)

## 4. Analysis
The model demonstrates strong discriminative ability ($\text{ROC-AUC} = 0.8461$) while executing in under 2ms. It is serialized to `models/text/toxicity_model.pkl` and `models/text/vectorizer.pkl` as the high-speed local fallback engine for the HumanLens text layer.
