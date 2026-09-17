# Paper Note P01: Unintended Bias in Toxicity Classification (Jigsaw / Conversation AI)

- **Citation**: Borkan et al. (2019). *Nuanced Metrics for Measuring Unintended Bias with Real-world Applications for Machine Learning*. arXiv:1903.04561.
- **Dataset**: Civil Comments (2M public comments annotated for toxicity and identity attributes).
- **Core Contribution**: Introduces disaggregated subgroup evaluation and AUC-based fairness metrics (Subgroup AUC, BPSN AUC, BNSP AUC).
- **Key Findings**: Models trained on toxic comments frequently develop spurious correlations between identity mentions (e.g., "gay", "Muslim", "black") and toxicity labels, leading to unacceptable false positive rates on benign comments mentioning marginalized groups.
- **HumanLens AI Application**:
  1. Utilized Civil Comments as our primary text toxicity training dataset (`civil_comments_train_dev_100k.csv`).
  2. Implemented dedicated false-positive parity evaluation across all identity attributes in `src/evaluation/bias.py`.
  3. Established strict ethical guardrail: demographic labels are barred from acting as features in our multimodal fusion models.
