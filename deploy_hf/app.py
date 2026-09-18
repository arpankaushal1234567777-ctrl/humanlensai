from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR / "research_ml" if (BASE_DIR / "research_ml").exists() else BASE_DIR.parent / "research_ml"
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml_service import analyze_text, analyze_audio, analyze_multimodal

app = FastAPI(
    title="HumanLens AI — ML Microservice",
    description="Zero-cost cloud deployment for HumanLens Multimodal Behavior Analysis & De-escalation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextPayload(BaseModel):
    text: str
    behavior_context: Optional[Dict[str, Any]] = None

class MultimodalPayload(BaseModel):
    text: Optional[str] = None
    audio_path: Optional[str] = None
    face_landmarks: Optional[Dict[str, Any]] = None
    behavior_context: Optional[Dict[str, Any]] = None

@app.get("/health")
def health():
    return {
        "status": "online",
        "service": "HumanLens AI ML Service",
        "version": "1.0.0",
        "environment": "Hugging Face Spaces Cloud (Free CPU 16GB)"
    }

@app.post("/analyze/text")
def endpoint_analyze_text(payload: TextPayload):
    if not payload.text:
        raise HTTPException(status_code=400, detail="Text field cannot be empty")
    return analyze_text(payload.text)

@app.post("/analyze/multimodal")
def endpoint_analyze_multimodal(payload: MultimodalPayload):
    return analyze_multimodal(
        text=payload.text,
        audio_path=payload.audio_path,
        face_landmarks=payload.face_landmarks,
        behavior_context=payload.behavior_context
    )

# Optional Interactive Gradio UI for Teacher & Browser Testing
try:
    import gradio as gr

    def interactive_eval(text):
        if not text or not text.strip():
            return "Please enter a message to analyze."
        res = analyze_text(text)
        txt = res.get("text", {})
        fus = res.get("fusion", {})
        lines = [
            "=== MODEL PREDICTIONS (SCIKIT-LEARN .PKL) ===",
            f"Toxicity Score: {txt.get('toxicity', 0):.4f}",
            f"Aggression Score: {txt.get('aggression', 0):.4f}",
            f"Detected Emotion: {txt.get('emotion', 'neutral')}",
            f"Multimodal Fusion Risk: {fus.get('risk_level', 'Low Risk')} (Score: {fus.get('score', 0):.4f})",
            f"Intervention Triggered: {res.get('intervention_triggered', False)}"
        ]
        card = res.get("intervention_card")
        if card:
            lines.append("\n=== EVIDENCE-BASED DE-ESCALATION REWRITES ===")
            for rw in card.get("three_rewrites", []):
                lines.append(f"\n[{rw.get('style')}]:\n\"{rw.get('text')}\"")
        return "\n".join(lines)

    with gr.Blocks(title="HumanLens AI Research ML Studio") as demo:
        gr.Markdown("# 🧠 HumanLens AI — Multimodal Research ML Studio")
        gr.Markdown("Live Scikit-Learn `.pkl` Models, MediaPipe Action Units, and Fusion Regression for Academic Evaluation.")
        with gr.Row():
            with gr.Column():
                inp = gr.Textbox(lines=4, placeholder="Type message (e.g. 'You made a huge mistake and this is your fault')...", label="Input Draft")
                btn = gr.Button("Analyze with Trained Models", variant="primary")
            with gr.Column():
                out = gr.Textbox(label="Model Predictions & De-escalation Rewrites", lines=12)
        btn.click(interactive_eval, inputs=inp, outputs=out)

    app = gr.mount_gradio_app(app, demo, path="/")
except Exception as e:
    @app.get("/")
    def root():
        return {
            "status": "online",
            "service": "HumanLens AI ML Service",
            "note": "FastAPI endpoints available at /analyze/text and /analyze/multimodal"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
