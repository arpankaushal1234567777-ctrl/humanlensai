"""
HumanLens AI — Environment & Hardware Diagnostic Utility
Member 3: Research / ML Lead

Accurately reports environment readiness and distinguishes:
AVAILABLE | MISSING | OPTIONAL | FAILED | FALLBACK
"""

import sys
import os
import platform
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

print("=" * 70)
print("HUMANLENS AI — SYSTEM & ENVIRONMENT DIAGNOSTIC")
print("=" * 70)

# 1. System & Hardware
print("\n[1] SYSTEM & HARDWARE SPECIFICATIONS:")
print(f"  OS                 : {platform.system()} {platform.release()} ({platform.version()})")
print(f"  Platform           : {platform.platform()} [{platform.machine()}]")
print(f"  Python Version     : {platform.python_version()} ({platform.architecture()[0]})")
print(f"  Python Executable  : {sys.executable}")

# CPU & RAM
cpu_count = os.cpu_count() or 1
print(f"  CPU Logical Cores  : {cpu_count}")

try:
    import psutil
    vm = psutil.virtual_memory()
    total_ram_gb = vm.total / (1024 ** 3)
    avail_ram_gb = vm.available / (1024 ** 3)
    print(f"  System RAM Total   : {total_ram_gb:.2f} GB (Available: {avail_ram_gb:.2f} GB)")
except Exception:
    print("  System RAM Total   : psutil not queried (os reporting only)")

# GPU & Acceleration
try:
    import torch
    cuda_avail = torch.cuda.is_available()
    if cuda_avail:
        dev_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        print(f"  GPU Acceleration   : AVAILABLE ({dev_name}, {vram_gb:.2f} GB VRAM)")
    else:
        print("  GPU Acceleration   : NOT DETECTED (CPU-first INT8/FP32 execution mode)")
except Exception as e:
    print(f"  GPU Acceleration   : PyTorch not available ({e})")

# 2. Dependency Audit
print("\n[2] CORE & OPTIONAL DEPENDENCY AUDIT:")

core_packages = [
    ("numpy", "NumPy", False),
    ("pandas", "Pandas", False),
    ("scipy", "SciPy", False),
    ("sklearn", "Scikit-Learn", False),
    ("joblib", "Joblib", False),
    ("yaml", "PyYAML", False),
    ("torch", "PyTorch", False),
    ("transformers", "Hugging Face Transformers", False),
    ("faster_whisper", "Faster-Whisper (ASR)", False),
    ("librosa", "Librosa (Acoustic Processing)", False),
    ("soundfile", "SoundFile", False),
    ("cv2", "OpenCV", False),
    ("mediapipe", "MediaPipe (Face Landmarker)", False),
    ("sentence_transformers", "Sentence-Transformers (Semantic RAG)", False),
    ("PIL", "Pillow (Image Processing)", False),
    ("matplotlib", "Matplotlib (Plotting)", False),
    ("seaborn", "Seaborn (Visualizations)", False),
]

all_core_ok = True
for mod_name, label, is_optional in core_packages:
    try:
        mod = __import__(mod_name)
        ver = getattr(mod, "__version__", "installed")
        status = "AVAILABLE"
        print(f"  [{status:9s}] {label:38s} : v{ver}")
    except Exception as e:
        status = "OPTIONAL" if is_optional else "MISSING"
        if not is_optional:
            all_core_ok = False
        print(f"  [{status:9s}] {label:38s} : {e}")

# 3. Optional Reasoning Backend (Qwen)
print("\n[3] OPTIONAL REASONING BACKEND (QWEN STATUS):")
qwen_weights_local = False
try:
    import torch
    from transformers import AutoConfig
    # Check if Qwen model is available in local cache
    try:
        AutoConfig.from_pretrained("Qwen/Qwen2.5-Omni-7B", local_files_only=True)
        qwen_weights_local = True
    except Exception:
        qwen_weights_local = False
except Exception:
    pass

if qwen_weights_local:
    print("  [AVAILABLE] Qwen/Qwen2.5-Omni-7B : Cached locally and ready for inference")
else:
    print("  [OPTIONAL ] Qwen/Qwen2.5-Omni-7B : Not cached locally. Pipeline uses verified LocalFallbackReasoner")

# 4. Model Artifacts Check
base_dir = Path(__file__).resolve().parent.parent
print("\n[4] TRAINED MODEL ARTIFACTS AUDIT:")

artifacts = [
    ("models/text/toxicity_model.pkl", "Toxicity Baseline Classifier", False),
    ("models/text/vectorizer.pkl", "Text TF-IDF Vectorizer", False),
    ("models/text/threat_model.pkl", "Threat Classifier (Civil Comments)", False),
    ("models/text/insult_model.pkl", "Insult Classifier (Civil Comments)", False),
    ("models/emotion_logistic_regression.pkl", "GoEmotions Emotion Model", False),
    ("models/emotion_tfidf_vectorizer.pkl", "GoEmotions TF-IDF Vectorizer", False),
    ("models/fusion/fusion_model.pkl", "Multimodal Fusion Engine (Learned PoC)", False),
    ("models/behavior/behavior_model.pkl", "Behavior Lens Model Artifact", True),
]

artifacts_ok = True
for rel_path, desc, optional in artifacts:
    p = base_dir / rel_path
    if p.exists() and p.stat().st_size > 200:
        status = "AVAILABLE"
        size_kb = p.stat().st_size / 1024.0
        print(f"  [{status:9s}] {desc:40s} : {size_kb:.1f} KB ({rel_path})")
    else:
        status = "OPTIONAL" if optional else "MISSING"
        if not optional:
            artifacts_ok = False
        print(f"  [{status:9s}] {desc:40s} : NOT FOUND ({rel_path})")

print("\n" + "=" * 70)
if all_core_ok and artifacts_ok:
    print("OVERALL STATUS: FULLY READY — All core dependencies and artifacts available.")
elif all_core_ok:
    print("OVERALL STATUS: PACKAGES READY — Train/validate script needs to generate missing artifacts.")
else:
    print("OVERALL STATUS: INCOMPLETE — Some dependencies or artifacts missing.")
print("=" * 70)
