"""
HumanLens AI — Multimodal Reasoning Engine (Qwen Integration & Graceful Local Fallback)
Member 3: Research / ML Lead

Implements:
1. BaseReasoningBackend: Abstract interface for multimodal reasoning
2. LocalFallbackReasoner: Deterministic, non-diagnostic synthesis of multimodal signals
3. QwenOmniReasoner: Genuine transformer inference for Qwen/Qwen2.5-Omni-7B with lazy loading
4. Transparent failure reporting: Never fabricates model responses
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import numpy as np


class BaseReasoningBackend(ABC):
    """Abstract interface for HumanLens multimodal reasoning backends."""

    def format_prompt(
        self,
        text: str,
        whisper_transcript: str,
        toxicity_score: float,
        aggression_score: float,
        emotion: str,
        voice_intensity: float,
        mean_pitch: float,
        face_intensity: float,
        dominant_face_expression: str,
        behavior_context: Optional[Dict[str, Any]],
        rag_guidelines: List[Dict[str, Any]],
    ) -> str:
        stress_val = "unavailable"
        stress_trend = "stable"
        sleep_val = "unavailable"
        sleep_trend = "stable"

        if behavior_context:
            stress_val = behavior_context.get("stress", {}).get("current_level", "unknown")
            stress_trend = behavior_context.get("stress", {}).get("trend", "stable")
            sleep_val = behavior_context.get("sleep", {}).get("current_hours", "unknown")
            sleep_trend = behavior_context.get("sleep", {}).get("trend", "stable")

        guidelines_text = "\n".join(
            [f"- {g.get('category', 'Principle')}: {g.get('strategy', '')}" for g in rag_guidelines]
        ) if rag_guidelines else "- Standard de-escalation: Pause and reframe communication neutrally."

        prompt = f"""[HUMANLENS MULTIMODAL ESCALATION REASONING]
You are the HumanLens AI Communication & De-escalation Assistant.
Analyze the following observed multimodal communication signals to formulate an explainable, non-diagnostic reflection.

=== OBSERVED MODALITIES ===
1. Text Content: "{text}"
   - Multilingual Toxicity: {toxicity_score:.2f}
   - Aggression Score: {aggression_score:.2f}
   - Detected Affect: {emotion}

2. Spoken Audio (Whisper ASR + Librosa):
   - ASR Transcript: "{whisper_transcript}"
   - Voice Intensity Score: {voice_intensity:.2f}
   - Pitch: {mean_pitch:.1f} Hz

3. Facial Expression Signals (Privacy-Preserving Action Units):
   - Expression Intensity: {face_intensity:.2f}
   - Dominant Expression Proxy: {dominant_face_expression}

4. Longitudinal Behavioral Context (Non-Diagnostic):
   - Sleep: {sleep_val} hrs ({sleep_trend})
   - Stress Level: {stress_val}/10 ({stress_trend})

=== EVIDENCE-INFORMED DE-ESCALATION GUIDELINES ===
{guidelines_text}

=== INSTRUCTIONS ===
1. Explain the contributing escalation factors without making clinical or psychiatric assertions.
2. Outline why this communication risks damaging the interpersonal interaction.
3. Formulate three constructive alternative rewrites (Assertive, Empathetic, Direct).
"""
        return prompt

    @abstractmethod
    def reason(
        self,
        text: str,
        whisper_transcript: str,
        toxicity_score: float,
        aggression_score: float,
        emotion: str,
        voice_intensity: float,
        mean_pitch: float,
        face_intensity: float,
        dominant_face_expression: str,
        behavior_context: Optional[Dict[str, Any]],
        rag_guidelines: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        pass


class LocalFallbackReasoner(BaseReasoningBackend):
    """
    Deterministic rule-based reasoning synthesizer.
    Used when Qwen is disabled or unavailable. Produces transparent non-diagnostic rationales.
    """

    def __init__(self, reason: str = "Local fallback requested by configuration"):
        self.default_reason = reason

    def reason(
        self,
        text: str,
        whisper_transcript: str,
        toxicity_score: float,
        aggression_score: float,
        emotion: str,
        voice_intensity: float,
        mean_pitch: float,
        face_intensity: float,
        dominant_face_expression: str,
        behavior_context: Optional[Dict[str, Any]],
        rag_guidelines: List[Dict[str, Any]],
        override_reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        drivers = []
        if aggression_score >= 0.70 or toxicity_score >= 0.75:
            drivers.append("high verbal aggression and insulting phrasing")
        if voice_intensity >= 0.65:
            drivers.append("elevated vocal energy and pitch volatility")
        if face_intensity >= 0.65:
            drivers.append("notable facial tension / brow furrowing")
        
        if behavior_context:
            sleep_trend = behavior_context.get("sleep", {}).get("trend", "Stable")
            stress_trend = behavior_context.get("stress", {}).get("trend", "Stable")
            if sleep_trend == "Decreasing" or stress_trend == "Increasing":
                drivers.append("compounding behavioral fatigue and elevated stress")

        attribution_summary = (
            "Escalation triggered primarily by " + ", combined with ".join(drivers) + "."
            if drivers else "Elevated cumulative intensity across communication modalities."
        )

        prompt_str = self.format_prompt(
            text, whisper_transcript, toxicity_score, aggression_score, emotion,
            voice_intensity, mean_pitch, face_intensity, dominant_face_expression,
            behavior_context, rag_guidelines
        )

        rationale = (
            "The message contains language likely to trigger a defensive response. "
            "Observable vocal and facial strain suggests heightened physiological arousal, "
            "lowering patience and impulse resistance."
        )

        reason_str = override_reason or self.default_reason

        return {
            "backend": "local_fallback",
            "status": "fallback",
            "model": "local_rule_synthesizer",
            "attribution_summary": attribution_summary,
            "multimodal_prompt": prompt_str,
            "driving_factors": drivers,
            "non_diagnostic_rationale": rationale,
            "reason": reason_str,
        }


class QwenOmniReasoner(BaseReasoningBackend):
    """
    Genuine Qwen/Qwen2.5-Omni-7B integration.
    Performs real model inference when weights and hardware are available.
    Never fabricates inference; delegates to LocalFallbackReasoner if loading fails.
    """

    def __init__(
        self,
        model_name: str = "Qwen/Qwen2.5-Omni-7B",
        device: str = "cpu",
        quantization: str = "none",
        max_new_tokens: int = 256,
    ):
        self.model_name = model_name
        self.device = device
        self.quantization = quantization
        self.max_new_tokens = max_new_tokens
        self._model = None
        self._tokenizer = None
        self._load_attempted = False
        self._load_error = None
        self._fallback_reasoner = LocalFallbackReasoner()

    def _lazy_load(self) -> bool:
        if self._load_attempted:
            return self._model is not None

        self._load_attempted = True
        try:
            from transformers import Qwen2_5OmniForConditionalGeneration, AutoProcessor
            self._tokenizer = AutoProcessor.from_pretrained(self.model_name, trust_remote_code=True)
            model_cls = Qwen2_5OmniForConditionalGeneration
        except (ImportError, Exception):
            from transformers import AutoModelForCausalLM, AutoTokenizer
            self._tokenizer = AutoTokenizer.from_pretrained(self.model_name, trust_remote_code=True)
            model_cls = AutoModelForCausalLM

        try:
            import torch
            torch_device = "cuda" if (self.device == "cuda" and torch.cuda.is_available()) else "cpu"

            load_kwargs = {"trust_remote_code": True}
            if torch_device == "cuda":
                load_kwargs["torch_dtype"] = torch.bfloat16
                if self.quantization == "8bit":
                    load_kwargs["load_in_8bit"] = True
                elif self.quantization == "4bit":
                    load_kwargs["load_in_4bit"] = True
                load_kwargs["device_map"] = "auto"
            else:
                load_kwargs["torch_dtype"] = torch.float32

            self._model = model_cls.from_pretrained(self.model_name, **load_kwargs)
            if torch_device == "cpu":
                self._model.to("cpu")
            self._model.eval()
            return True

        except Exception as e:
            self._load_error = f"{type(e).__name__}: {str(e)}"
            self._model = None
            self._tokenizer = None
            return False

    def reason(
        self,
        text: str,
        whisper_transcript: str,
        toxicity_score: float,
        aggression_score: float,
        emotion: str,
        voice_intensity: float,
        mean_pitch: float,
        face_intensity: float,
        dominant_face_expression: str,
        behavior_context: Optional[Dict[str, Any]],
        rag_guidelines: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        prompt_str = self.format_prompt(
            text, whisper_transcript, toxicity_score, aggression_score, emotion,
            voice_intensity, mean_pitch, face_intensity, dominant_face_expression,
            behavior_context, rag_guidelines
        )

        loaded = self._lazy_load()
        if not loaded or self._model is None:
            # Explicit, unfeigned fallback
            fail_reason = self._load_error or "Qwen model not loaded"
            res = self._fallback_reasoner.reason(
                text, whisper_transcript, toxicity_score, aggression_score, emotion,
                voice_intensity, mean_pitch, face_intensity, dominant_face_expression,
                behavior_context, rag_guidelines,
                override_reason=f"Qwen model unavailable ({fail_reason}); used local fallback",
            )
            res["target_model"] = self.model_name
            return res

        # Real model inference
        try:
            import torch
            inputs = self._tokenizer(prompt_str, return_tensors="pt")
            target_dev = next(self._model.parameters()).device
            inputs = {k: v.to(target_dev) for k, v in inputs.items()}

            with torch.no_grad():
                output_ids = self._model.generate(
                    **inputs,
                    max_new_tokens=self.max_new_tokens,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=self._tokenizer.eos_token_id,
                )

            gen_tokens = output_ids[0][inputs["input_ids"].shape[1] :]
            response_text = self._tokenizer.decode(gen_tokens, skip_special_tokens=True).strip()

            return {
                "backend": "qwen_omni",
                "status": "success",
                "model": self.model_name,
                "attribution_summary": "Multimodal synthesis generated by Qwen reasoning model.",
                "multimodal_prompt": prompt_str,
                "driving_factors": ["multimodal_interactive_synthesis"],
                "non_diagnostic_rationale": response_text,
                "generated_guidance": response_text,
                "tokens_generated": len(gen_tokens),
            }

        except Exception as e:
            res = self._fallback_reasoner.reason(
                text, whisper_transcript, toxicity_score, aggression_score, emotion,
                voice_intensity, mean_pitch, face_intensity, dominant_face_expression,
                behavior_context, rag_guidelines,
                override_reason=f"Inference error ({type(e).__name__}: {str(e)}); used local fallback",
            )
            res["target_model"] = self.model_name
            return res


class QwenMultimodalReasoning:
    """
    Unified entrypoint dispatched from HumanLensPipeline.
    Configures either QwenOmniReasoner or LocalFallbackReasoner based on configuration.
    """

    def __init__(
        self,
        enabled: bool = False,
        backend: str = "local_fallback",
        model_name: str = "Qwen/Qwen2.5-Omni-7B",
        device: str = "cpu",
        quantization: str = "none",
        max_new_tokens: int = 256,
    ):
        self.enabled = enabled
        self.backend_type = backend
        self.model_name = model_name

        if self.enabled and self.backend_type in ["qwen_omni", "qwen"]:
            self._backend: BaseReasoningBackend = QwenOmniReasoner(
                model_name=model_name,
                device=device,
                quantization=quantization,
                max_new_tokens=max_new_tokens,
            )
        else:
            self._backend = LocalFallbackReasoner(
                reason="Reasoning disabled in config or configured as local_fallback"
            )

    def format_prompt(self, *args, **kwargs) -> str:
        return self._backend.format_prompt(*args, **kwargs)

    def reason(self, *args, **kwargs) -> Dict[str, Any]:
        return self._backend.reason(*args, **kwargs)
