from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR / "research_ml"
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

@app.get("/")
def root():
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
