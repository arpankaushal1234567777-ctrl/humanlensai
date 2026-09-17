# Experiment EXP-005: Behavior Lens Baseline & Longitudinal Trend Analysis

- **Experiment ID**: EXP-005
- **Date**: Week 6 (Roadmap Phase 2)
- **Author**: Member 3 (Research & ML Lead)
- **Status**: Completed

## 1. Objective
Establish the Behavior Lens mathematical formulation to compute longitudinal trends across sleep, stress, academic pressure, social interaction, and screen time without making clinical diagnoses.

## 2. Methodology
- **Dataset**: `data/processed/behavior_lens_synthetic.csv` (30 consecutive daily logs).
- **Rolling Baseline**: 7-day rolling window computing rolling mean and deviation ($\Delta = x_t - \mu_{7d}$).
- **Categorical Classification**: Relative change exceeding $\pm 8\%$ of feature standard deviation flags `Increasing` or `Decreasing`, else `Stable`.
- **Composite Strain Formulation**: Weighted multi-attribute vulnerability score ($\Delta_{\text{behavior}} \in [0, 1]$).

## 3. Results & Findings
- Correlating synthetic irritability events against behavioral metrics revealed strong associations with:
  - Sleep deficit ($\Delta_{\text{sleep}} < -1.5\text{ hrs}$, $r = -0.58$)
  - Acute stress rise ($\Delta_{\text{stress}} > +2.0$, $r = +0.64$)
  - Compounding academic deadlines ($r = +0.49$)
- **Non-Diagnostic Constraint**: Behavior Lens outputs structured observational statements (e.g. "Sleep trend: Decreasing, Stress level: Elevated") that provide explanatory context to the AI assistant while strictly disclaiming medical diagnostic inference.
