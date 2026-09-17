# HumanLens AI — Literature Review

## 1. Purpose

The purpose of this literature review is to identify existing research
relevant to the HumanLens AI Research / ML component.

The review focuses on:

- Toxicity detection
- Aggression and offensive-language detection
- Emotion detection
- Multimodal analysis
- Bias and fairness
- Explainable and safe intervention systems

The findings will be used to guide dataset selection, model selection,
feature engineering, multimodal fusion, and evaluation.

---

# 2. Toxicity Detection

## Unintended Bias in Toxicity Classification

The Jigsaw Unintended Bias in Toxicity Classification work provides the
foundation for the Civil Comments dataset used in toxicity research.

Civil Comments contains public comments from the Civil Comments platform.
Jigsaw extended the dataset with toxicity and identity-related annotations.

The dataset contains labels including:

- toxicity
- severe_toxicity
- obscene
- threat
- insult
- identity_attack
- sexual_explicit

The labels represent the fraction of annotators assigning an attribute to
a comment rather than simply providing a binary label.

### Relevance to HumanLens

This dataset is highly relevant to the HumanLens Text Layer because it
provides direct toxicity-related annotations and several related harmful
communication signals.

It is also useful for bias analysis because identity-related annotations
allow the model to be evaluated for unintended differences in performance.

### Limitation

The dataset represents online news-site comments rather than direct
personal conversations. Therefore, performance on this dataset should not
automatically be interpreted as performance in real-time interpersonal
communication.

---

# 3. Fine-Grained Emotion Detection

## GoEmotions

Demszky et al. introduced GoEmotions, a dataset containing approximately
58,000 Reddit comments labeled with 27 emotion categories plus Neutral.

The dataset provides a much more detailed emotion representation than a
simple positive/negative sentiment classification task.

### Relevance to HumanLens

HumanLens requires an emotion component that can provide structured
emotional signals to the multimodal fusion engine.

GoEmotions can therefore be used to investigate:

- anger
- annoyance
- fear
- sadness
- disappointment
- disapproval
- nervousness
- and other emotional states

### Limitation

Emotion detection from text is inherently uncertain because the emotional
state of a person cannot always be determined reliably from a written
message alone.

Therefore, HumanLens should treat emotion predictions as observable
communication signals rather than psychological diagnoses.

---

# 4. Offensive Language and Aggression

## Automated Hate Speech Detection and the Problem of Offensive Language

Davidson et al. investigated the difficulty of distinguishing hate speech
from other offensive language.

Their work demonstrates that simple lexical approaches can incorrectly
classify text containing particular words and that distinguishing
different types of harmful language is challenging.

### Relevance to HumanLens

This supports the decision to avoid defining aggression using only a list
of offensive words.

HumanLens should combine multiple signals such as:

- insults
- threats
- severe toxicity
- emotional intensity
- contextual information

rather than relying on a single keyword rule.

### Research implication

A rule-based detector will be implemented as a baseline, but machine
learning models will be evaluated against it.

---

# 5. Limitations of Text Emotion Detection

## Uncovering the Limits of Text-based Emotion Detection

Alvarez-Gonzalez et al. investigated the limitations of emotion detection
from text using datasets including GoEmotions.

Their work highlights an important distinction between emotions expressed
by writers and emotions perceived by readers.

### Relevance to HumanLens

This finding supports the use of uncertainty-aware emotion analysis.

HumanLens should not treat a predicted emotion as a fact about the user.

Instead, the model should produce an estimated signal such as:

emotion = anger
confidence = 0.72

rather than:

user_is_angry = True

This distinction is important for safety and responsible interpretation.

---

# 6. Bias in Toxic Language Datasets

## Detecting Unintended Social Bias in Toxic Language Datasets

Sahoo et al. studied unintended social bias in toxic-language datasets
and specifically investigated bias categories associated with identity
groups.

### Relevance to HumanLens

Bias analysis is an important part of HumanLens because a toxicity model
could incorrectly associate identity-related words with harmful behavior.

HumanLens will therefore evaluate:

- false-positive rate
- false-negative rate
- precision
- recall
- F1-score

across relevant available groups.

The system should not use demographic identity as a simple proxy for
behavioral risk.

---

# 7. Multimodal Emotion Recognition

## Multimodal Emotion Recognition in Conversations

Recent research in multimodal emotion recognition investigates the
combination of:

- text
- speech
- visual information

for improved emotional understanding.

A 2025 survey reviews methods, evaluation strategies, challenges and
future directions in multimodal emotion recognition.

### Relevance to HumanLens

This directly supports the HumanLens architecture:

Text Layer
+
Voice Layer
+
Face Layer
        ↓
Multimodal Fusion Engine

However, HumanLens will initially avoid an opaque end-to-end multimodal
model.

Instead, structured modality-specific scores will be combined using an
interpretable fusion strategy.

---

# 8. Research Gap

Based on the reviewed work, several important limitations remain relevant
to HumanLens.

### Gap 1 — Single-modality dependence

Many systems focus primarily on text.

HumanLens investigates whether text can be complemented by voice,
facial-expression and behavioral-context signals.

### Gap 2 — Interpretability

Highly complex multimodal systems can be difficult to interpret.

HumanLens will initially use structured and weighted fusion so that the
contribution of each modality can be examined.

### Gap 3 — False positives

A toxicity detector may incorrectly classify:

- sarcasm
- jokes
- political criticism
- disagreement
- profanity without harmful intent

as escalation.

HumanLens will therefore explicitly analyze false positives.

### Gap 4 — Bias

Toxicity models may behave differently when identity-related terms appear.

HumanLens will include dedicated bias and error analysis.

### Gap 5 — Intervention

Detection alone does not necessarily improve communication.

HumanLens therefore investigates whether a pause/rewrite intervention can
reduce the toxicity or aggression of a message.

---

# 9. Research Direction for HumanLens

The literature review supports the following research direction:

Text
 ↓
Toxicity + Aggression + Emotion

Voice
 ↓
Pitch + Rate + Pauses + Intensity

Face
 ↓
Broad Expression Signals

Behavior
 ↓
Longitudinal Context

All signals
 ↓
Explainable Multimodal Fusion
 ↓
Escalation Score
 ↓
Pause / Rewrite / Explain

The research will compare text-only and multimodal approaches and evaluate
whether additional modalities improve performance without introducing
unacceptable false positives, bias, latency, or privacy risks.

---

# 10. Conclusion

Existing research provides strong foundations for toxicity detection,
emotion recognition, offensive-language detection, bias evaluation and
multimodal analysis.

However, HumanLens combines these areas into a single research-oriented
pipeline focused on explainable escalation assessment and constructive
intervention.

The next research stage is therefore dataset selection and verification.