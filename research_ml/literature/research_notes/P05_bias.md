# Paper Note P05: Detecting Unintended Social Bias in Toxic Language Datasets

- **Citation**: Sahoo et al. (2022). *Detecting Unintended Social Bias in Toxic Language Datasets*. CoNLL 2022.
- **Core Contribution**: Evaluates unintended demographic bias across intersectional identities and examines bias mitigation techniques.
- **Key Findings**: Mitigation strategies (such as balanced sampling and counterfactual data augmentation) must be monitored continuously to prevent sacrificing minority group recall.
- **HumanLens AI Application**:
  1. Integrated false positive rate spread ($\Delta_{\text{FPR}} \le 0.08$) into our pipeline validation criteria (`src/evaluation/bias.py`).
  2. Incorporated bias auditing reports directly into our formal research methodology deliverables.
