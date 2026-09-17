# Experiment EXP-003: TF-IDF + Linear Support Vector Machine

- **Experiment ID**: EXP-003
- **Date**: Week 3 (Roadmap Phase 1)
- **Author**: Member 3 (Research & ML Lead)
- **Status**: Completed

## 1. Objective
Compare maximum-margin classification (Linear SVM) against Logistic Regression to determine if hard decision boundaries improve precision on hostile comments.

## 2. Methodology
- **Feature Pipeline**: Same 15,000 TF-IDF n-gram vectorizer as EXP-002.
- **Model**: LinearSVC with squared hinge loss and balanced class weighting. Calibrated using Platt scaling (sigmoid calibration).

## 3. Results & Metrics
- **Accuracy**: 0.9012
- **Precision**: 0.4120
- **Recall**: 0.5410
- **F1-Score**: 0.4678
- **ROC-AUC**: 0.8415
- **Inference Latency**: 2.10 ms

## 4. Key Takeaways
Linear SVM provides a modest precision improvement (+2.2%) over Logistic Regression at comparable latency. However, Logistic Regression produces natively well-calibrated posterior probabilities essential for smooth multimodal fusion scoring.
