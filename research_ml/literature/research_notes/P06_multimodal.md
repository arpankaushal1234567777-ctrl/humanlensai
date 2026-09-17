# Paper Note P06: Multimodal Emotion Recognition in Conversations — A Survey

- **Citation**: Wu et al. (2025). *Multimodal Emotion Recognition in Conversations: A Survey of Methods, Trends, Challenges, and Prospects*. EMNLP Findings 2025.
- **Core Contribution**: Comprehensive review of text, acoustic, and visual fusion techniques, highlighting challenges with asynchronous signals and noisy modalities.
- **Key Findings**: End-to-end black-box deep multimodal models often fail silently when one modality degrades (e.g. poor microphone audio or low-light video), whereas structured/weighted late fusion maintains robustness and explainability.
- **HumanLens AI Application**:
  1. Adopted late multimodal fusion rather than opaque end-to-end transformers as our core research contribution.
  2. Designed dynamic confidence re-normalization in `src/fusion/weighted_fusion.py` to prevent sensor noise from corrupting the escalation assessment.
