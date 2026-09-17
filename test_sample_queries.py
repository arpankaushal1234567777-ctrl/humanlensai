import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent / "research_ml"))
from ml_service import analyze_text, analyze_multimodal

scenarios = [
    ("Scenario 1: Blatant Hostility & Insults", "You complete idiot, stop ruining our project with your careless mistakes!"),
    ("Scenario 2: Hinglish Workplace Slang", "Ye sab bakwaas hai, tum pagalon ki tarah code likh rahe ho!"),
    ("Scenario 3: Passive Aggression & Frustration", "As per my previous email which you clearly did not bother reading."),
    ("Scenario 4: Constructive Teamwork", "Thanks for sending the updates. Let us review the test results tomorrow morning."),
    ("Scenario 5: High Acute Threat", "I swear I am going to destroy you and make sure you regret ever joining this team.")
]

for label, text in scenarios:
    print("\n" + "=" * 65)
    print(f"TEST: {label}")
    print(f"INPUT: \"{text}\"")
    res = analyze_text(text)
    
    text_data = res.get("text", {})
    fusion = res.get("fusion", {})
    
    print(f"-> Language Detected: {res.get('language')}")
    print(f"-> Toxicity: {text_data.get('toxicity', 0):.3f} | Insult: {text_data.get('insult', 0):.3f} | Threat: {text_data.get('threat', 0):.3f}")
    print(f"-> Affect / Emotion: {text_data.get('emotion')}")
    print(f"-> Multimodal Fusion Score: {fusion.get('score', 0):.3f} ({fusion.get('risk_level')})")
    
    triggered = res.get("intervention_triggered")
    print(f"-> Before You Speak Modal Triggered: {triggered}")
    
    if triggered:
        card = res.get("intervention_card", {})
        print(f"-> Modal Header: {card.get('title')}")
        pause = card.get("cooling_pause", {})
        print(f"-> Cooling Pause: {pause.get('duration_seconds', 20)}s | {pause.get('breathing_pattern', 'Box breathing')}")
        print("-> Constructive Rewrites Generated:")
        for rw in card.get("alternative_rewrites", []):
            print(f"   * [{rw.get('style')}]: \"{rw.get('text')}\"")
    else:
        print("-> Safe communication: No intervention required (Sent directly).")

print("\n" + "=" * 65)
