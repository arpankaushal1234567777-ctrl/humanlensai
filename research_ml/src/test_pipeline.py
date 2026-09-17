import sys
from pathlib import Path

# --------------------------------------------------
# HUMANLENS AI — STANDALONE PIPELINE TEST
# --------------------------------------------------

PROJECT_ROOT = Path(r"E:\VS CODE\Data_Science\HUMANLENS AI\research_ml")

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

print("=" * 60)
print("HUMANLENS AI — STANDALONE PIPELINE TEST")
print("=" * 60)

print("\n[1] Importing pipeline...")

from src.pipeline import HumanLensPipeline

print("✅ Pipeline imported.")

print("\n[2] Initializing pipeline...")

humanlens = HumanLensPipeline()

print("✅ Pipeline initialized.")

# sklearn compatibility fix
if hasattr(humanlens.toxicity_scorer, "fast_model"):
    if humanlens.toxicity_scorer.fast_model is not None:
        if not hasattr(humanlens.toxicity_scorer.fast_model, "multi_class"):
            humanlens.toxicity_scorer.fast_model.multi_class = "auto"

print("✅ sklearn model compatibility fix applied.")


# --------------------------------------------------
# sklearn compatibility fix
# Saved models were created with sklearn 1.8.0
# Current runtime is sklearn 1.7.2
# --------------------------------------------------

if hasattr(humanlens.toxicity_scorer, "fast_model"):
    if humanlens.toxicity_scorer.fast_model is not None:
        if not hasattr(humanlens.toxicity_scorer.fast_model, "multi_class"):
            humanlens.toxicity_scorer.fast_model.multi_class = "auto"

print("✅ sklearn model compatibility fix applied.")

# --------------------------------------------------
# VOICE PIPELINE TEST
# --------------------------------------------------

audio_path = PROJECT_ROOT / "data" / "audio" / "my_english_test.wav"

print("\n[3] Running voice analysis...")
print("Audio:", audio_path)

result = humanlens.analyze(
    audio_path=str(audio_path)
)

print("\n" + "=" * 60)
print("🎤 HUMANLENS VOICE ANALYSIS COMPLETED")
print("=" * 60)

print("\nSTATUS")
print("Status:", result.get("status"))
print("Language:", result.get("language"))

print("\nVOICE / ASR")
print("Transcript:", result.get("voice", {}).get("asr"))
print("Voice Status:", result.get("voice", {}).get("status"))
print("Voice Confidence:", result.get("voice", {}).get("confidence"))

print("\nTEXT ANALYSIS FROM TRANSCRIPT")
print("Toxicity:", result.get("text", {}).get("toxicity"))
print("Aggression:", result.get("text", {}).get("aggression"))
print("Emotion:", result.get("text", {}).get("emotion"))

print("\nFUSION")
print("Fusion Score:", result.get("fusion", {}).get("score"))
print("Risk Level:", result.get("fusion", {}).get("risk_level"))

print("\nROUTING")
print("Routing Path:", result.get("routing_path"))

print("\nINTERVENTION")
print("Triggered:", result.get("intervention_triggered"))

print("\n" + "=" * 60)
print("VOICE TEST FINISHED")
print("=" * 60)

print("\n[3] Running text analysis...")
print("Input:", test_text)

result = humanlens.analyze(text=test_text)

print("\n" + "=" * 60)
print("✅ HUMANLENS ANALYSIS COMPLETED")
print("=" * 60)

print("\nSTATUS")
print("Status:", result.get("status"))
print("Language:", result.get("language"))

print("\nTEXT ANALYSIS")
print("Toxicity:", result.get("text", {}).get("toxicity"))
print("Aggression:", result.get("text", {}).get("aggression"))
print("Emotion:", result.get("text", {}).get("emotion"))
print("Confidence:", result.get("text", {}).get("confidence"))

print("\nFUSION")
print("Fusion Score:", result.get("fusion", {}).get("score"))
print("Risk Level:", result.get("fusion", {}).get("risk_level"))
print("Fusion Confidence:", result.get("fusion", {}).get("confidence"))

print("\nROUTING")
print("Routing Path:", result.get("routing_path"))

print("\nINTERVENTION")
print("Triggered:", result.get("intervention_triggered"))

print("\n" + "=" * 60)
print("TEST FINISHED")
print("=" * 60)