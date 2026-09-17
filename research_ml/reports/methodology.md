# HumanLens AI — Comprehensive Research Methodology

- **Author**: Member 3 (Research & Machine Learning Lead)
- **Document Version**: 1.0.0
- **Scope**: Mathematical formulations, architectural workflows, and evaluation protocols.

---

## 1. System Architecture
HumanLens AI implements a hybrid, multi-tier intelligence architecture:

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

## 2. Modality Feature Formulations

### 2.1 Text Layer
1. **Multilingual Toxicity ($S_{\text{tox}}$)**:
   - Primary: `textdetox/bert-multilingual-toxicity-classifier` producing posterior probability $P(\text{toxic} \mid x) \in [0, 1]$.
   - Fast Baseline: N-gram TF-IDF ($n \in \{1, 2\}$, 15k features) + Calibrated Logistic Regression.
2. **Composite Aggression ($S_{\text{agg}}$)**:
   $$S_{\text{agg}} = \min\left(1.0, \, \left(w_{\text{threat}} S_{\text{threat}} + w_{\text{insult}} S_{\text{insult}} + w_{\text{tox}} S_{\text{tox}}\right) \cdot I_{\text{caps}}\right)$$
   Where $w_{\text{threat}} = 0.45$, $w_{\text{insult}} = 0.35$, $w_{\text{tox}} = 0.20$, and $I_{\text{caps}} = 1.15$ if capitalized letters $> 70\%$.
3. **Fine-Grained Emotion & Intensity ($S_{\text{emo}}$)**:
   - 28-class GoEmotions logistic model. Emotional intensity:
     $$S_{\text{intensity}} = \sum_{c \in C} \alpha_c \cdot P(c \mid x)$$
     Where $\alpha_{\text{anger}} = 1.0, \alpha_{\text{annoyance}} = 0.75, \alpha_{\text{disgust}} = 0.70, \alpha_{\text{fear}} = 0.65$.

### 2.2 Voice Layer (Librosa & faster-whisper)
1. **ASR**: Local WhisperModel (`tiny`, int8 CPU) transcribing audio into text $T_{\text{whisper}}$.
2. **Acoustic Features**:
   - Normalized RMS Energy: $\tilde{E} = \min(1.0, \, \mu_{\text{RMS}} / 0.25)$
   - Pitch Volatility: $\tilde{\sigma}_{F_0} = \min(1.0, \, \sigma_{F_0} / 50.0)$ via `librosa.pyin`
   - Speech Activity Ratio: $R_{\text{active}} = \frac{1}{N} \sum_{i=1}^N \mathbb{I}(E_i > \theta_{\text{silence}})$
   - Composite Voice Intensity:
     $$S_{\text{voice}} = 0.40 \tilde{E} + 0.35 \tilde{\sigma}_{F_0} + 0.25 R_{\text{active}}$$

### 2.3 Face Expression Layer (Privacy-Preserving Landmarks)
- Brow Furrow (AU4 proxy): $I_{\text{brow}} = \text{clip}(1.0 - 1.5 \cdot d_{\text{inner\_brow}}, \, 0, 1)$
- Mouth Tension (AU15/23 proxy): $I_{\text{mouth}} = \text{clip}(1.0 - 1.6 \cdot \text{MAR}, \, 0, 1)$
- Eye Squint (AU7 proxy): $I_{\text{squint}} = \text{clip}(1.0 - 1.8 \cdot \text{EAR}, \, 0, 1)$
- Composite Facial Expression Intensity:
  $$S_{\text{face}} = 0.40 I_{\text{brow}} + 0.35 I_{\text{mouth}} + 0.25 I_{\text{squint}}$$

### 2.4 Behavior Lens Module
- 7-day rolling baseline: $\mu_{7d, k} = \frac{1}{7} \sum_{i=0}^6 x_{t-i, k}$
- Rolling delta: $\Delta_{t, k} = x_{t, k} - \mu_{7d, k}$
- Composite Behavioral Strain Score:
  $$S_{\text{behavior}} = 0.30 \cdot \text{Strain}_{\text{stress}} + 0.30 \cdot \text{Deficit}_{\text{sleep}} + 0.20 \cdot \text{Strain}_{\text{academic}} + 0.10 \cdot \text{Screen} + 0.10 \cdot \text{Isolation}$$

---

## 3. Multimodal Fusion Engine
### 3.1 Explainable Weighted Fusion
$$S_{\text{escalation}} = \sum_{m \in M_{\text{active}}} \tilde{w}_m \cdot S_m, \quad \tilde{w}_m = \frac{w_m c_m}{\sum_{k} w_k c_k}$$
Where $c_m \in [0, 1]$ represents modality confidence (accommodating missing sensors).

### 3.2 Learned Fusion Architectures
Feature vector $X \in \mathbb{R}^{10}$ combining main effects and interaction terms ($S_{\text{text}} \times S_{\text{voice}}$, $S_{\text{text}} \times S_{\text{face}}$, $S_{\text{emo}} \times S_{\text{behavior}}$).
Evaluates:
1. Logistic Regression
2. Random Forest
3. Small MLP ($32 \times 16$)

---

## 4. Intervention & RAG Protocol
When $S_{\text{escalation}} \ge 0.85$:
1. Retrieve targeted evidence from the de-escalation knowledge base using TF-IDF vector similarity.
2. Synthesize multimodal signals using Qwen Multimodal Reasoning.
3. Emit interactive **"BEFORE YOU SPEAK"** card offering a 20-second cooling pause and 3 constructive alternative rewrites.
