# Experiment EXP-001: Deterministic Rule-Based Baseline

- **Experiment ID**: EXP-001
- **Date**: Week 2 (Roadmap Phase 1)
- **Author**: Member 3 (Research & ML Lead)
- **Status**: Completed

## 1. Objective
Establish a low-latency, deterministic rule-based baseline for toxicity, aggression, and benign communication filtering. This forms the first tier of the HumanLens hybrid AI architecture.

## 2. Methodology
- **Lexical Pattern Matching**: Curated regex patterns for high-risk threats (`i will kill`, `destroy you`, `watch your back`) and direct insults (`idiot`, `moron`, `shut up`).
- **Stylistic Indicators**: Capitalization ratio (ALL-CAPS detection) and excessive punctuation (`!{2,}`, `?{2,}`).
- **Benign Fast Filter**: Whitelist of common greetings, polite acknowledgments, and expressions of gratitude.

## 3. Results & Metrics
- **Inference Latency**: **0.12 ms** (Sub-millisecond)
- **Benign Filter Accuracy**: 99.4% on standard conversational openings
- **Civil Comments Precision**: 0.7620
- **Civil Comments Recall**: 0.3140 (Significant false negatives on subtle/veiled hostility)
- **Civil Comments F1**: 0.4445

## 4. Findings & HumanLens Decision
While deterministic rules achieve sub-millisecond execution and safely bypass heavy models for greetings, they suffer from high false negatives on colloquial slang and nuanced aggression. Therefore, EXP-001 serves as a **pre-filter router** rather than a standalone classifier.
