# HumanLens AI — System Limitations & Real-World Challenges

- **Author**: Member 3 (Research & Machine Learning Lead)
- **Document Version**: 1.0.0

---

## 1. Multimodal Asynchronous Alignment
In real-world live conversations, spoken audio, facial muscle contractions, and transcribed text do not arrive simultaneously:
- **Challenge**: Audio and video packet delays or variable frame rates can cause facial tension from a subsequent reaction to align incorrectly with a prior neutral sentence.
- **HumanLens Solution**: Implemented a sliding window buffer (2.5 seconds) and confidence decay weighting that prevents transient video blips from dominating sustained conversational signals.

## 2. Handling Sarcasm, Irony & Friendly Banter
- **Challenge**: Sarcastic jokes frequently use toxic words in jest ("You are literally the worst human alive haha"). A high-sensitivity threshold will alienate users by misinterpreting humor as hostility.
- **HumanLens Solution**: Bimodal verification! Voice pitch modulation, speech rate, and laughter pause frequency counteract lexical toxicity. If vocal energy is relaxed and face tension is low, the escalation score is dampened below 0.85.

## 3. False Positive Fatigue
- **Challenge**: Frequent, unneeded "Before You Speak" interruptions cause alert fatigue, prompting users to disable or ignore the assistant.
- **HumanLens Solution**: High-precision intervention threshold ($S_{\text{escalation}} \ge 0.85$) combined with deterministic fast bypass for common greetings, ensuring interventions trigger only during genuinely destructive moments.

## 4. Hardware & Acoustic Noise Constraints
- **Challenge**: Cheap microphone hardware, background noise, or poor room lighting degrade feature fidelity.
- **HumanLens Solution**: Dynamic weight re-normalization in `ExplainableWeightedFusion`. If audio SNR or facial landmark confidence drops below 0.50, the engine smoothly shifts weight to text and behavioral trends.
