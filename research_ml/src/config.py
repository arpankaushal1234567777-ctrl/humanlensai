"""
HumanLens AI — Central Configuration & Validation Manager
Member 3: Research / ML Lead

Authoritative single source of truth for all modules in HumanLens AI.
Eliminates magic numbers and conflicting threshold defaults.
"""

from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import yaml
from dataclasses import dataclass, field


@dataclass
class RiskThresholds:
    low_risk_cutoff: float = 0.40       # [0.00, 0.39] -> Low Risk
    moderate_risk_cutoff: float = 0.70  # [0.40, 0.69] -> Moderate / Elevated Caution
    high_caution_cutoff: float = 0.85   # [0.70, 0.84] -> High Caution
    high_risk_cutoff: float = 0.85      # [0.85, 1.00] -> High Risk / Intervention

    def validate(self):
        assert 0.0 <= self.low_risk_cutoff <= self.moderate_risk_cutoff <= self.high_caution_cutoff <= 1.0, (
            f"Invalid threshold ordering: {self.low_risk_cutoff} <= {self.moderate_risk_cutoff} <= {self.high_caution_cutoff}"
        )


def classify_risk(score: float, thresholds: Optional[RiskThresholds] = None) -> Tuple[str, bool]:
    """
    Centralized risk classification function used everywhere in HumanLens AI.
    
    Returns:
        (risk_level: str, is_high_risk: bool)
    
    Default mapping:
        0.00 - 0.39: Low Risk (is_high_risk=False)
        0.40 - 0.69: Moderate / Elevated Caution (is_high_risk=False)
        0.70 - 0.84: High Caution (is_high_risk=False)
        0.85 - 1.00: High Risk (is_high_risk=True, triggers intervention)
    """
    if thresholds is None:
        thresholds = DEFAULT_THRESHOLDS

    score = float(max(0.0, min(1.0, score)))

    if score < thresholds.low_risk_cutoff:
        return "Low Risk", False
    elif score < thresholds.moderate_risk_cutoff:
        return "Moderate / Elevated Caution", False
    elif score < thresholds.high_caution_cutoff:
        return "High Caution", False
    else:
        return "High Risk", True


DEFAULT_THRESHOLDS = RiskThresholds()


class HumanLensConfig:
    """
    Authoritative configuration manager loading configs/experiment_config.yaml.
    Guarantees consistent keys across Pipeline, Fusion, Text, Voice, Face, RAG, and Reasoning.
    """

    _instance = None

    def __init__(self, config_path: Optional[str] = None):
        if config_path is None:
            base_dir = Path(__file__).resolve().parent.parent
            config_path = base_dir / "configs" / "experiment_config.yaml"
        
        self.config_path = Path(config_path)
        self.raw_config: Dict[str, Any] = self._load()
        self.thresholds: RiskThresholds = self._parse_thresholds()

    def _load(self) -> Dict[str, Any]:
        if not self.config_path.exists():
            return {}
        with open(self.config_path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        return cfg or {}

    def _parse_thresholds(self) -> RiskThresholds:
        fusion_cfg = self.raw_config.get("fusion", {})
        t_dict = fusion_cfg.get("thresholds", {})
        
        # Support both naming conventions
        low = float(t_dict.get("low_risk", t_dict.get("low_risk_cutoff", 0.40)))
        mod = float(t_dict.get("moderate_risk", t_dict.get("moderate_risk_cutoff", 0.70)))
        caution = float(t_dict.get("high_caution", t_dict.get("high_caution_cutoff", 0.85)))
        high = float(t_dict.get("high_risk", t_dict.get("high_risk_cutoff", 0.85)))

        rt = RiskThresholds(
            low_risk_cutoff=low,
            moderate_risk_cutoff=mod,
            high_caution_cutoff=caution,
            high_risk_cutoff=high,
        )
        rt.validate()
        return rt

    def classify(self, score: float) -> Tuple[str, bool]:
        """Classify risk using this configuration's parsed thresholds."""
        return classify_risk(score, self.thresholds)

    def get(self, section: str, key: Optional[str] = None, default: Any = None) -> Any:
        sec = self.raw_config.get(section, {})
        if key is None:
            return sec if sec else default
        if isinstance(sec, dict):
            return sec.get(key, default)
        return default

    @classmethod
    def get_default(cls) -> "HumanLensConfig":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
