# Paper Note P02: GoEmotions — A Dataset of Fine-Grained Emotions

- **Citation**: Demszky et al. (2020). *GoEmotions: A Dataset of Fine-Grained Emotions*. ACL 2020.
- **Dataset**: 58,000 Reddit comments annotated across 27 fine-grained emotion categories plus Neutral.
- **Core Contribution**: Moves beyond coarse binary sentiment (positive/negative) into nuanced affect analysis (anger, annoyance, remorse, gratitude, admiration, fear).
- **Key Findings**: Many emotionally intense interactions involve combinations of annoyance, disapproval, and anger rather than simple negative sentiment.
- **HumanLens AI Application**:
  1. Trained our 28-class fine-grained emotion model (`models/emotion_logistic_regression.pkl`).
  2. Grouped high-arousal negative emotions (anger, annoyance, disgust, fear) into an `emotional_intensity_score` used by the Multimodal Fusion Engine to modulate escalation sensitivity.
