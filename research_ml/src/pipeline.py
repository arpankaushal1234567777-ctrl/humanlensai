"""
HumanLens AI — Unified Multimodal Pipeline
Member 3: Research / ML Lead

End-to-end multimodal orchestrator integrating:
1. Multilingual Text Analysis (Toxicity, Aggression, Emotion, Language Detection)
2. Speech & Voice Analysis (Faster-Whisper ASR + Librosa Acoustic Proxies)
3. Privacy-Preserving Facial Analysis (MediaPipe Face Landmarker / AU Proxies)
4. Longitudinal Behavioral Context (Non-Diagnostic Strain / Vulnerability)
5. Explainable Multimodal Fusion Engine (Weighted Operational + Learned PoC)
6. Hybrid Routing & De-escalation (Semantic RAG + Qwen Reasoning + Before You Speak)
"""

from pathlib import Path
from typing import Dict, Any, Optional, Union
import numpy as np

from src.config import HumanLensConfig, classify_risk
from src.text.preprocessing import clean_text, extract_text_features, is_low_risk_greeting_or_benign
from src.text.toxicity import ToxicityScorer
from src.text.aggression import AggressionScorer
from src.text.emotion import EmotionScorer
from src.voice.features import AcousticFeatureExtractor, WhisperTranscriber
from src.face.features import FaceExpressionExtractor
from src.behavior.model import BehaviorLensModel
from src.fusion.weighted_fusion import ExplainableWeightedFusion
from src.fusion.learned_fusion import LearnedMultimodalFusion
from src.rag.retriever import DeEscalationRetriever
from src.reasoning.qwen_reasoning import QwenMultimodalReasoning
from src.rag.intervention_cards import InterventionCardGenerator


class HumanLensPipeline:
    """
    Unified Pipeline for HumanLens AI.
    Executes flexible single-modality and multimodal analysis with graceful fallbacks
    and zero crashes when modalities are missing.
    """

    def __init__(self, config_path: Optional[str] = None):
        self.config_manager = HumanLensConfig(config_path)
        self.config = self.config_manager.raw_config

        # 1. Text Layer
        self.toxicity_scorer = ToxicityScorer(
            use_transformer=True,
            device=self.config_manager.get("text", "device", "cpu"),
        )
        self.aggression_scorer = AggressionScorer()
        self.emotion_scorer = EmotionScorer()

        # 2. Voice Layer
        self.acoustic_extractor = AcousticFeatureExtractor(
            target_sr=int(self.config_manager.get("voice", "sample_rate", 16000))
        )
        self.whisper_transcriber = WhisperTranscriber(
            model_size=self.config_manager.get("voice", "asr_model_size", "tiny"),
            device=self.config_manager.get("voice", "device", "cpu"),
            compute_type=self.config_manager.get("voice", "compute_type", "int8"),
        )

        # 3. Face Layer
        self.face_extractor = FaceExpressionExtractor(
            privacy_mode=bool(self.config_manager.get("face", "privacy_mode", True)),
            min_confidence=float(self.config_manager.get("face", "min_detection_confidence", 0.50)),
        )

        # 4. Behavior Lens Module
        self.behavior_model = BehaviorLensModel(
            demo_mode=bool(self.config_manager.get("behavior", "demo_mode", False)),
            use_synthetic_behavior=bool(self.config_manager.get("behavior", "use_synthetic_behavior", False)),
        )

        # 5. Multimodal Fusion Engine
        self.weighted_fusion = ExplainableWeightedFusion()
        self.learned_fusion = LearnedMultimodalFusion(
            model_type=self.config_manager.get("fusion", "primary_model", "random_forest")
        )

        # 6. RAG, Reasoning & Intervention
        self.retriever = DeEscalationRetriever(
            backend=self.config_manager.get("rag", "backend", "sentence_transformers"),
            embedding_model=self.config_manager.get("rag", "embedding_model", "sentence-transformers/all-MiniLM-L6-v2"),
            top_k=int(self.config_manager.get("rag", "top_k", 3)),
            fallback_to_tfidf=bool(self.config_manager.get("rag", "fallback_to_tfidf", True)),
        )

        reason_cfg = self.config_manager.get("reasoning", None, {})
        self.reasoning_engine = QwenMultimodalReasoning(
            enabled=bool(reason_cfg.get("enabled", False)),
            backend=reason_cfg.get("backend", "local_fallback"),
            model_name=reason_cfg.get("model_name", "Qwen/Qwen2.5-Omni-7B"),
            device=reason_cfg.get("device", "cpu"),
            quantization=reason_cfg.get("quantization", "none"),
            max_new_tokens=int(reason_cfg.get("max_new_tokens", 256)),
        )
        self.card_generator = InterventionCardGenerator()

    def analyze(
        self,
        text: Optional[str] = None,
        audio_path: Optional[str] = None,
        face_landmarks: Optional[Dict[str, Any]] = None,
        face_image: Optional[Any] = None,
        face_video: Optional[Any] = None,
        behavior_context: Optional[Dict[str, Any]] = None,
        use_learned_fusion: bool = False,
    ) -> Dict[str, Any]:
        """
        Execute communication analysis across any subset of modalities:
        - TEXT ONLY
        - AUDIO ONLY
        - FACE ONLY
        - BEHAVIOR ONLY
        - MULTIMODAL COMBINATIONS
        """
        # 1. Voice / Audio Processing
        whisper_transcript = ""
        voice_features = {}
        voice_status = "unavailable"
        voice_conf = 0.0

        if audio_path and Path(audio_path).exists():
            asr_res = self.whisper_transcriber.transcribe(audio_path)
            whisper_transcript = asr_res.get("text", "")
            voice_features = self.acoustic_extractor.extract_features(audio_path)
            voice_status = voice_features.get("status", "available")
            voice_conf = voice_features.get("acoustic_confidence", 0.85)

        # 2. Resolve Effective Text
        effective_text = text if (text is not None and text.strip()) else whisper_transcript
        effective_text = clean_text(effective_text) if effective_text else ""

        # Fast path check: low-risk benign greeting with no visual or acoustic escalation
        has_audio = audio_path is not None and Path(audio_path).exists()
        has_face_input = bool(face_landmarks or face_image or face_video)
        
        if is_low_risk_greeting_or_benign(effective_text) and not has_audio and not has_face_input:
            risk_lvl, is_high = classify_risk(0.05)
            return {
                "status": "success",
                "language": "en",
                "routing_path": "fast_rule",
                "text": {
                    "toxicity": 0.02,
                    "aggression": 0.0,
                    "emotion": "greeting",
                    "confidence": 0.98,
                    "status": "available",
                },
                "voice": {"asr": "", "acoustics": {}, "confidence": 0.0, "status": "unavailable"},
                "face": {"features": {}, "confidence": 0.0, "privacy_verified": True, "status": "unavailable"},
                "behavior": {"strain": 0.0, "source": "unavailable", "status": "unavailable"},
                "fusion": {
                    "score": 0.05,
                    "risk_level": risk_lvl,
                    "attribution": {"text": 100.0},
                    "confidence": 0.98,
                    "modalities_present": ["text"],
                    "modalities_missing": ["voice", "face", "behavior"],
                },
                "rag": [],
                "reasoning": None,
                "intervention_triggered": False,
                "intervention_card": None,
                # Compatibility keys
                "escalation_score": 0.05,
                "risk_level": risk_lvl,
                "is_high_risk": False,
                "fast_path_triggered": True,
                "effective_text": effective_text,
                "whisper_transcript": "",
                "attribution": {"text": 100.0},
                "modality_scores": {"text_toxicity": 0.02, "text_aggression": 0.0, "text_emotion": "greeting"},
                "qwen_reasoning": None,
            }

        # 3. Text Analysis
        text_status = "unavailable"
        toxicity_score = 0.0
        aggression_score = 0.0
        primary_emotion = "neutral"
        emotional_intensity = 0.0
        detected_lang = "unknown"
        text_conf = 0.0

        if effective_text:
            tox_res = self.toxicity_scorer.score(effective_text, model_type="fast")
            toxicity_score = float(tox_res.get("toxicity_score", 0.0))
            detected_lang = tox_res.get("language", "unknown")
            text_conf = float(tox_res.get("confidence", 0.85))

            agg_res = self.aggression_scorer.score(effective_text, toxicity_score=toxicity_score)
            aggression_score = float(agg_res.get("aggression_score", 0.0))

            emo_res = self.emotion_scorer.score(effective_text)
            primary_emotion = emo_res.get("primary_emotion", "neutral")
            emotional_intensity = float(emo_res.get("emotional_intensity", 0.0))
            text_status = "available"

        # 4. Face Processing (Strict Privacy)
        face_features = {}
        face_status = "unavailable"
        face_conf = 0.0

        if face_landmarks:
            face_features = self.face_extractor.extract_from_landmarks(face_landmarks)
            face_status = face_features.get("status", "available")
            face_conf = face_features.get("landmark_confidence", 0.90)
        elif face_image is not None:
            face_features = self.face_extractor.process_image(face_image)
            face_status = face_features.get("status", "available")
            face_conf = face_features.get("landmark_confidence", 0.80)
        elif face_video is not None:
            face_features = self.face_extractor.process_video(face_video)
            face_status = face_features.get("status", "available")
            face_conf = face_features.get("landmark_confidence", 0.80)
        else:
            face_features = self.face_extractor._default_features(face_detected=False, status="unavailable")

        face_intensity = float(face_features.get("face_expressive_intensity", 0.0))

        # 5. Behavior Lens Context
        beh_eval = self.behavior_model.evaluate(behavior_context)
        behavior_strain = beh_eval.get("strain")
        behavior_source = beh_eval.get("source", "unavailable")
        behavior_status = beh_eval.get("status", "unavailable")

        # 6. Multimodal Fusion Execution
        voice_intensity = float(voice_features.get("voice_intensity_score", 0.0))
        pitch_std = float(voice_features.get("pitch_std_hz", 0.0))
        text_escalation = float(max(toxicity_score, aggression_score, emotional_intensity * 0.8)) if text_status == "available" else None

        if use_learned_fusion:
            feat_vec = LearnedMultimodalFusion.build_feature_vector(
                toxicity=toxicity_score,
                aggression=aggression_score,
                emotion_intensity=emotional_intensity,
                voice_intensity=voice_intensity if voice_status == "available" else 0.0,
                pitch_std=pitch_std if voice_status == "available" else 0.0,
                face_intensity=face_intensity if face_status == "available" else 0.0,
                behavior_strain=behavior_strain if behavior_status == "available" else 0.0,
            )
            learned_pred = self.learned_fusion.predict(feat_vec)
            escalation_score = float(learned_pred["escalation_score"])
            risk_level, is_high_risk = classify_risk(escalation_score)
            attribution = {"learned_model": 100.0}
            fusion_conf = 0.85
            present = [m for m, s in [("text", text_status), ("voice", voice_status), ("face", face_status), ("behavior", behavior_status)] if s == "available"]
            missing = [m for m in ["text", "voice", "face", "behavior"] if m not in present]
        else:
            fusion_res = self.weighted_fusion.fuse(
                text_score=text_escalation,
                voice_score=voice_intensity if voice_status == "available" else None,
                face_score=face_intensity if face_status == "available" else None,
                behavior_score=behavior_strain if behavior_status == "available" else None,
                text_confidence=text_conf,
                voice_confidence=voice_conf,
                face_confidence=face_conf,
                behavior_confidence=0.85 if behavior_status == "available" else 0.0,
            )
            escalation_score = float(fusion_res["escalation_score"])
            risk_level = fusion_res["risk_level"]
            is_high = fusion_res["is_high_risk"] or escalation_score >= 0.70 or aggression_score >= 0.70
            is_high_risk = is_high
            risk_level = "High Risk" if is_high else fusion_res["risk_level"]
            attribution = fusion_res["attribution_percent"]
            fusion_conf = fusion_res.get("confidence", 0.85)
            present = fusion_res.get("modalities_present", [])
            missing = fusion_res.get("modalities_missing", [])

        # 7. Hybrid AI Routing Logic
        if is_high_risk or escalation_score >= 0.70:
            routing_path = "high_risk_reasoning"
        elif len(present) > 1:
            routing_path = "multimodal_analysis"
        elif text_status == "available":
            routing_path = "text_ml"
        else:
            routing_path = "fallback"

        # 8. RAG & Optional Reasoning Intervention Trigger
        rag_guidelines = []
        reasoning_output = None
        intervention_card = None

        if is_high_risk or escalation_score >= 0.70 or (aggression_score >= 0.70):
            query_ctx = f"{effective_text} emotion:{primary_emotion} aggression:{aggression_score:.2f} voice:{voice_intensity:.2f}"
            rag_guidelines = self.retriever.retrieve(query_ctx, top_k=2)

            reasoning_output = self.reasoning_engine.reason(
                text=effective_text,
                whisper_transcript=whisper_transcript,
                toxicity_score=toxicity_score,
                aggression_score=aggression_score,
                emotion=primary_emotion,
                voice_intensity=voice_intensity,
                mean_pitch=voice_features.get("mean_pitch_hz", 0.0),
                face_intensity=face_intensity,
                dominant_face_expression=face_features.get("dominant_expression", "neutral"),
                behavior_context=beh_eval.get("context"),
                rag_guidelines=rag_guidelines,
            )

            intervention_card = self.card_generator.create_card(
                original_text=effective_text or "[Voice Spoken Communication]",
                escalation_score=escalation_score,
                modality_breakdown={
                    "toxicity": toxicity_score,
                    "aggression": aggression_score,
                    "voice": voice_intensity,
                    "face": face_intensity,
                    "behavior": behavior_strain or 0.0,
                },
                reasoning_output=reasoning_output,
                rag_guidelines=rag_guidelines,
                attribution=attribution,
                confidence=fusion_conf,
            )

        return {
            "status": "success",
            "language": detected_lang,
            "text": {
                "toxicity": toxicity_score,
                "aggression": aggression_score,
                "emotion": primary_emotion,
                "confidence": text_conf,
                "status": text_status,
            },
            "voice": {
                "asr": whisper_transcript,
                "acoustics": voice_features,
                "confidence": voice_conf,
                "status": voice_status,
            },
            "face": {
                "features": face_features,
                "confidence": face_conf,
                "privacy_verified": True,
                "status": face_status,
            },
            "behavior": {
                "strain": behavior_strain,
                "source": behavior_source,
                "status": behavior_status,
            },
            "fusion": {
                "score": escalation_score,
                "risk_level": risk_level,
                "attribution": attribution,
                "confidence": fusion_conf,
                "modalities_present": present,
                "modalities_missing": missing,
            },
            "routing_path": routing_path,
            "rag": rag_guidelines,
            "reasoning": reasoning_output,
            "intervention_triggered": intervention_card is not None,
            "intervention_card": intervention_card,
            # Backwards compatibility keys
            "escalation_score": escalation_score,
            "risk_level": risk_level,
            "is_high_risk": is_high_risk,
            "effective_text": effective_text,
            "whisper_transcript": whisper_transcript,
            "attribution": attribution,
            "modality_scores": {
                "text_toxicity": toxicity_score,
                "text_aggression": aggression_score,
                "text_emotion": primary_emotion,
                "emotional_intensity": emotional_intensity,
                "voice_intensity": voice_intensity,
                "face_intensity": face_intensity,
                "behavioral_strain": behavior_strain or 0.0,
            },
            "qwen_reasoning": reasoning_output,
        }
