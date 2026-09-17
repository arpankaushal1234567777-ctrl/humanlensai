# Paper Note P04: Uncovering the Limits of Text-based Emotion Detection

- **Citation**: Alvarez-Gonzalez et al. (2021). *Uncovering the Limits of Text-based Emotion Detection*. EMNLP Findings 2021.
- **Core Contribution**: Critiques the assumption that text alone can accurately identify internal human emotional states; distinguishes *expressed affect* from *perceived affect*.
- **Key Findings**: Text-only emotion models suffer from significant label ambiguity and contextual uncertainty.
- **HumanLens AI Application**:
  1. Explicit architectural policy: emotion outputs are treated as observable communicative signals with confidence bounds, never as psychological or psychiatric truth.
  2. Motivates our multimodal design: supplementing text ambiguity with voice acoustics and facial landmark proxies.
