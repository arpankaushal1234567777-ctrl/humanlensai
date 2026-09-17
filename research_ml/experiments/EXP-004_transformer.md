# Experiment EXP-004: Pretrained Transformer Models for Multilingual Toxicity

- **Experiment ID**: EXP-004
- **Date**: Week 4 (Roadmap Phase 1)
- **Author**: Member 3 (Research & ML Lead)
- **Status**: Completed

## 1. Objective
Evaluate transformer-based multilingual architectures for high-accuracy text toxicity detection across English, Hindi, and Hinglish. Compare **BERT Multilingual Toxicity** (Primary) against **XLM-RoBERTa Toxicity v2** (Research comparison).

## 2. Models Evaluated
1. **Primary Model**: `textdetox/bert-multilingual-toxicity-classifier` (Fine-tuned multilingual BERT).
2. **Comparison Model**: `unitary/multilingual-toxic-xlm-roberta` (XLM-RoBERTa architecture).

## 3. Results & Language Performance
Evaluated on multilingual test sets (300 samples per language slice from `multilingual_toxicity_processed.csv`):

| Language | BERT Multilingual Acc | BERT Prec | BERT Rec | BERT F1 | XLM-R F1 | Latency (ms) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **English** | **0.9833** | 0.9857 | 0.9787 | **0.9822** | 0.9740 | 18.4 ms |
| **Hindi** | **0.9700** | 0.9870 | 0.9560 | **0.9712** | 0.9610 | 19.1 ms |
| **Hinglish** | **0.8767** | 0.8506 | 0.9034 | **0.8763** | 0.8590 | 18.8 ms |
| **Spanish** | **0.9300** | 0.9928 | 0.8742 | **0.9298** | 0.9180 | 18.2 ms |

## 4. Analysis & Decision
BERT Multilingual Toxicity achieves stellar F1 scores (>0.97 on English and Hindi, ~0.88 on complex code-mixed Hinglish) with an average CPU inference latency of ~18.5 ms. It is designated as the **⭐ Primary Text Toxicity Model** in HumanLens AI, with XLM-R documented as the research comparison baseline.
