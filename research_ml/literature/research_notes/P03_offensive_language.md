# Paper Note P03: Automated Hate Speech Detection and the Problem of Offensive Language

- **Citation**: Davidson et al. (2017). *Automated Hate Speech Detection and the Problem of Offensive Language*. ICWSM 2017.
- **Core Contribution**: Distinguishes between hate speech, offensive language, and benign colloquial profanity.
- **Key Findings**: Lexical matching (e.g. searching for swear words) generates massive false positive rates, misclassifying in-group slang and benign emphasis as harmful hate speech.
- **HumanLens AI Application**:
  1. Separated base toxicity from composite aggression (`src/text/aggression.py`).
  2. Weighted explicit threats ($w=0.45$) and targeted insults ($w=0.35$) far more heavily than general profanity ($w=0.20$).
  3. Structured the error analysis module (`src/evaluation/error_analysis.py`) to explicitly isolate `FP_Benign_Profanity_Without_Malice`.
