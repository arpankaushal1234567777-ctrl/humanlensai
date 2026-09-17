# Experiment EXP-006: Bimodal Text + Voice Fusion

- **Experiment ID**: EXP-006
- **Date**: Week 8 (Roadmap Phase 2)
- **Author**: Member 3 (Research & ML Lead)
- **Status**: Completed

## 1. Objective
Evaluate whether combining text toxicity signals with voice acoustic features (extracted via **librosa**) and automatic speech recognition (**faster-whisper**) reduces false positives in sarcastic or ambiguous statements.

## 2. Methodology
- **Speech-to-Text**: `faster-whisper` (tiny model, CPU int8) transcribing speech in under 450 ms.
- **Acoustic Extraction**: Librosa extracting F0 pitch std, RMS energy, and speech activity ratio.
- **Bimodal Fusion**:
  $$S_{\text{bimodal}} = 0.60 \cdot S_{\text{text}} + 0.40 \cdot S_{\text{voice\_intensity}}$$

## 3. Results
- On friendly sarcastic banter ("Yeah right, you are the worst haha"):
  - Text-only model triggered False Positive ($S_{\text{text}} = 0.72$)
  - Voice features revealed low vocal energy, normal pitch stability, and laughter pauses ($S_{\text{voice}} = 0.18$)
  - Bimodal fused score: $0.504$ (Below the escalation threshold of 0.85, successfully preventing false alarm!)
- Latency added by acoustic extraction: ~12 ms on 3-second audio clips.
