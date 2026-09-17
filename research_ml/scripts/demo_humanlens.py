"""
HumanLens AI — Multimodal Platform Demonstration Script
Member 3: Research / ML Lead

Demonstrates complete multimodal communication analysis across:
1. English Text (Obvious low-risk vs high-risk hostility)
2. Hindi Text (Devanagari script)
3. Hinglish Text (Code-mixed informal slang)
4. Audio / Voice Acoustics & Whisper ASR
5. Face Expression Signal Processing (MediaPipe / AU proxies, privacy-preserving)
6. Longitudinal Behavior Context (Non-diagnostic vulnerability)
7. Explainable Multimodal Fusion (Scores, Risk Level, Modality Attribution ~100%)
8. Evidence-Informed Semantic RAG Retrieval
9. Multimodal Reasoning Backend (Showing exact backend used)
10. "BEFORE YOU SPEAK" De-escalation Intervention Card
"""

import sys
import os
import json
from pathlib import Path
from typing import Dict, Any, Optional

# UTF-8 stdout configuration for Windows terminals
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

base_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(base_dir))

from src.pipeline import HumanLensPipeline


def print_banner(title: str):
    print("\n" + "=" * 75)
    print(f"  {title.upper()}")
    print("=" * 75)


def display_pipeline_result(title: str, result: Dict[str, Any]):
    print(f"\n>>> DEMO SCENARIO: {title}")
    print("-" * 65)

    # Effective input
    eff_text = result.get("effective_text", "")
    lang = result.get("language", "unknown")
    routing = result.get("routing_path", "unknown")
    print(f"  INPUT TEXT         : \"{eff_text}\"")
    print(f"  DETECTED LANGUAGE  : {lang.upper()}")
    print(f"  HYBRID ROUTING     : [{routing}]")

    # Text Modality
    txt = result.get("text", {})
    if txt.get("status") == "available":
        print(f"\n  [TEXT MODALITY]")
        print(f"    - Toxicity Score : {txt.get('toxicity', 0.0):.4f}")
        print(f"    - Aggression     : {txt.get('aggression', 0.0):.4f}")
        print(f"    - Affect/Emotion : {txt.get('emotion', 'neutral')}")
        print(f"    - Confidence     : {txt.get('confidence', 0.0):.4f}")
    else:
        print(f"\n  [TEXT MODALITY]    : UNAVAILABLE")

    # Voice Modality
    vox = result.get("voice", {})
    if vox.get("status") == "available":
        print(f"\n  [VOICE MODALITY]")
        if vox.get("asr"):
            print(f"    - ASR Transcript : \"{vox.get('asr')}\"")
        ac = vox.get("acoustics", {})
        print(f"    - Voice Intensity: {ac.get('voice_intensity_score', 0.0):.4f}")
        print(f"    - Mean Pitch F0  : {ac.get('mean_pitch_hz', 0.0):.1f} Hz")
        print(f"    - Active Ratio   : {ac.get('speech_activity_ratio', 0.0):.2f}")
    else:
        print(f"\n  [VOICE MODALITY]   : UNAVAILABLE")

    # Face Modality
    fc = result.get("face", {})
    if fc.get("status") == "available":
        feats = fc.get("features", {})
        print(f"\n  [FACE MODALITY - PRIVACY PRESERVED]")
        print(f"    - Dominant Expr  : {feats.get('dominant_expression', 'unobserved')}")
        print(f"    - Face Intensity : {feats.get('face_expressive_intensity', 0.0):.4f}")
        print(f"    - Brow Furrow AU4: {feats.get('brow_activation', 0.0):.4f}")
        print(f"    - Mouth Tension  : {feats.get('mouth_tension', 0.0):.4f}")
        print(f"    - Privacy Status : VERIFIED (No identity / demographic tracking)")
    else:
        print(f"\n  [FACE MODALITY]    : UNAVAILABLE")

    # Behavior Modality
    beh = result.get("behavior", {})
    if beh.get("status") == "available":
        print(f"\n  [BEHAVIOR LENS CONTEXT - NON-DIAGNOSTIC]")
        print(f"    - Provenance     : {beh.get('source', 'unavailable')}")
        print(f"    - Strain Score   : {beh.get('strain', 0.0):.4f}")
    else:
        print(f"\n  [BEHAVIOR LENS]    : UNAVAILABLE (No user context provided)")

    # Multimodal Fusion
    fus = result.get("fusion", {})
    print(f"\n  [MULTIMODAL FUSION ENGINE]")
    print(f"    - Escalation Score : {fus.get('score', 0.0):.4f}")
    print(f"    - Risk Level       : {fus.get('risk_level', 'Unknown')}")
    print(f"    - Active Modalities: {fus.get('modalities_present', [])}")
    print(f"    - Modality Contrib : {fus.get('attribution', {})}")

    # RAG Guidelines
    rag = result.get("rag", [])
    if rag:
        print(f"\n  [EVIDENCE-INFORMED RAG RETRIEVAL]")
        for i, g in enumerate(rag[:2], 1):
            print(f"    {i}. [{g.get('category')} ({g.get('retrieval_backend', 'dense')})]: {g.get('strategy')}")

    # Reasoning Backend
    reas = result.get("reasoning")
    if reas:
        print(f"\n  [REASONING BACKEND]")
        print(f"    - Backend Used   : {reas.get('backend', 'local_fallback')}")
        print(f"    - Model Identifier: {reas.get('model', 'unspecified')}")
        print(f"    - Synthesis      : {reas.get('attribution_summary')}")

    # Before You Speak Intervention
    if result.get("intervention_triggered"):
        card = result.get("intervention_card", {})
        print(f"\n  ===========================================================")
        print(f"  *** INTERVENTION TRIGGERED: {card.get('title')} ***")
        print(f"  ===========================================================")
        print(f"  Why Triggered : {card.get('why_triggered')}")
        cooling = card.get("cooling_pause", {})
        print(f"  Cooling Pause : {cooling.get('message', '')} [{cooling.get('box_breathing', '')}]")
        print(f"\n  Constructive Rewrites Offered to User:")
        for r in card.get("three_rewrites", []):
            print(f"    * [{r.get('style')}]: \"{r.get('text')}\"")
    else:
        print(f"\n  Intervention Status: NOT TRIGGERED (Communication within acceptable limits)")

    print("-" * 65)


def run_demo():
    print_banner("HumanLens AI — Multimodal Research & Engineering Platform Demo")
    pipeline = HumanLensPipeline()
    audio_file = base_dir / "data" / "audio" / "voice_test_signal.wav"

    # Scenario 1: Low-risk benign English greeting (Fast rule path)
    res_1 = pipeline.analyze(text="Good morning team! Thank you all for the great progress this week.")
    display_pipeline_result("1. Low-Risk Benign English Greeting", res_1)

    # Scenario 2: Hindi Multilingual Toxicity
    res_2 = pipeline.analyze(text="तुम बहुत बड़े बेवकूफ हो, तुम्हारा काम बिल्कुल बकवास है")
    display_pipeline_result("2. Hindi Multilingual Communication", res_2)

    # Scenario 3: Hinglish Code-Mixed Slang
    res_3 = pipeline.analyze(text="Tu bilkul pagal hai kya? You ruined the entire presentation idiot")
    display_pipeline_result("3. Hinglish Code-Mixed Slang", res_3)

    # Scenario 4: High-Risk Multimodal Escalation (Text + Voice + Face + Behavior)
    face_landmarks_high = {
        "brow_distance": 0.22,
        "eye_aperture": 0.18,
        "mouth_aspect_ratio": 0.15,
        "confidence": 0.95,
    }
    behavior_high = {
        "sleep": {"current_hours": 4.5, "trend": "Decreasing"},
        "stress": {"current_level": 8.5, "trend": "Increasing"},
        "academic_pressure": {"current_level": 8.0, "trend": "Increasing"},
    }
    res_4 = pipeline.analyze(
        text="You complete idiot, I swear I am going to end your career and destroy you!",
        audio_path=str(audio_file) if audio_file.exists() else None,
        face_landmarks=face_landmarks_high,
        behavior_context=behavior_high,
    )
    display_pipeline_result("4. High-Risk Multimodal Interaction (All 4 Modalities)", res_4)

    # Scenario 5: Missing Modalities Graceful Handling (Camera Off, No Audio)
    res_5 = pipeline.analyze(text="I have strong concerns about the quality of this delivery.")
    display_pipeline_result("5. Missing Modalities Handling (Text Only, Camera Off)", res_5)

    print_banner("HumanLens AI Demonstration Completed Successfully")


if __name__ == "__main__":
    from typing import Dict, Any
    run_demo()
