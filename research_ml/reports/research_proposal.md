# HumanLens AI — Research Proposal: Multimodal Escalation Detection & De-escalation Interventions

- **Project Lead**: Member 3 (Research & Machine Learning Lead)
- **Institution / Team**: HumanLens AI Research Group
- **Status**: Approved & Active

---

## 1. Executive Summary
Modern digital communication lacks nonverbal cues, frequently accelerating misunderstandings into interpersonal escalation. Current content moderation models operate primarily as punitive, post-hoc text filters that delete content or ban users without providing formative, in-the-moment guidance. 

HumanLens AI pioneers a proactive, formative paradigm: a real-time multimodal intelligence system that assesses communication escalation across **Text**, **Audio (Whisper ASR + Librosa)**, **Face (Privacy-Preserving Action Units)**, and **Longitudinal Behavioral Context (Sleep, Stress, Activity)**. When escalation risks exceed calibrated thresholds ($> 0.85$), the system triggers an interactive **"Before You Speak"** intervention card offering cooling pauses and evidence-informed rewrites grounded in Nonviolent Communication principles.

---

## 2. Research Questions & Hypotheses
- **RQ1 (Text Precision & Recall)**: Can text-based models identify toxic and aggressive escalation with useful precision and recall across multiple languages?
  - *H1*: Multilingual BERT fine-tuned on toxic communication achieves $F_1 \ge 0.85$ across English, Hindi, and Hinglish.
- **RQ2 (Multimodal Value-Add)**: Does late multimodal fusion combining text with acoustic proxies and facial action units improve escalation detection over text alone?
  - *H2*: Multimodal fusion reduces false positive rates on ambiguous banter by at least 30% compared to text-only classification.
- **RQ3 (Behavioral Compounding)**: Are longitudinal behavioral trends (chronic sleep loss, acute stress spikes) significantly associated with communication escalation?
  - *H3*: Decreasing sleep and increasing stress correlate with higher self-reported irritability and lower linguistic patience.
- **RQ4 (Intervention Efficacy)**: Does a structured "Before You Speak" cooling pause and rewrite prompt significantly reduce message toxicity?
  - *H4*: Over 65% of simulated users adopt constructive rewrites when presented with transparent modality attributions.
- **RQ5 (Fairness & Bias Parity)**: Can the system ensure demographic fairness without utilizing demographic traits as risk features?
  - *H5*: False Positive Rate (FPR) parity across identity groups remains within a strict $\Delta_{\text{FPR}} \le 0.08$ bound.

---

## 3. Methodological Scope & Ethical Guardrails
1. **Non-Diagnostic Stance**: The system monitors observable communication signals and behavioral strain; it makes zero medical, psychiatric, or psychological diagnostic assertions.
2. **Zero-Identity Video Processing**: Face analysis extracts purely relative action unit coordinates (brow furrow, eye squint, mouth tension). Raw pixels and biometric embeddings are discarded immediately.
3. **Local & On-Device First**: Whisper ASR and Librosa acoustic feature extraction are executed locally, eliminating raw audio transmission to external servers.
