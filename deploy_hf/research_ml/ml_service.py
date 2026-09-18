import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.pipeline import HumanLensPipeline


# --------------------------------------------------
# HumanLens AI — ML Service
# Member 3 → Backend Integration
# --------------------------------------------------

_pipeline = None


def get_pipeline():
    global _pipeline

    if _pipeline is None:
        _pipeline = HumanLensPipeline()

        # sklearn 1.8.0 model / 1.7.2 runtime compatibility
        if hasattr(_pipeline.toxicity_scorer, "fast_model"):
            if _pipeline.toxicity_scorer.fast_model is not None:
                if not hasattr(
                    _pipeline.toxicity_scorer.fast_model,
                    "multi_class"
                ):
                    _pipeline.toxicity_scorer.fast_model.multi_class = "auto"

    return _pipeline


def analyze_text(text: str):
    """
    Analyze text using the HumanLens multimodal pipeline.
    """

    if not text or not text.strip():
        return {
            "status": "error",
            "message": "Text cannot be empty."
        }

    pipeline = get_pipeline()

    return pipeline.analyze(
        text=text
    )


def analyze_audio(audio_path: str):
    """
    Analyze an audio file using Whisper + voice + text pipeline.
    """

    if not audio_path:
        return {
            "status": "error",
            "message": "Audio path is required."
        }

    path = Path(audio_path)

    if not path.exists():
        return {
            "status": "error",
            "message": f"Audio file not found: {audio_path}"
        }

    pipeline = get_pipeline()

    return pipeline.analyze(
        audio_path=str(path)
    )


def analyze_multimodal(
    text=None,
    audio_path=None,
    face_landmarks=None,
    behavior_context=None
):
    """
    Unified multimodal analysis interface.
    """

    pipeline = get_pipeline()

    return pipeline.analyze(
        text=text,
        audio_path=audio_path,
        face_landmarks=face_landmarks,
        behavior_context=behavior_context
    )


if __name__ == "__main__":

    print("=" * 60)
    print("HUMANLENS AI — ML SERVICE TEST")
    print("=" * 60)

    result = analyze_text(
        "I am angry and frustrated with this situation."
    )

    print("\nStatus:", result.get("status"))
    print("Language:", result.get("language"))

    print("\nText:")
    print("Toxicity:", result.get("text", {}).get("toxicity"))
    print("Aggression:", result.get("text", {}).get("aggression"))
    print("Emotion:", result.get("text", {}).get("emotion"))

    print("\nFusion:")
    print("Score:", result.get("fusion", {}).get("score"))
    print("Risk:", result.get("fusion", {}).get("risk_level"))

    print("\nIntervention:")
    print("Triggered:", result.get("intervention_triggered"))

    print("\n" + "=" * 60)
    print("ML SERVICE TEST FINISHED")
    print("=" * 60)