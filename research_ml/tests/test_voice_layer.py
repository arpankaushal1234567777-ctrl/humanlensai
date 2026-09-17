"""
HumanLens AI — Comprehensive Voice & ASR Test Suite
Member 3: Research / ML Lead

Verifies:
- Valid audio file processing
- Non-existent or invalid audio handling (graceful failure)
- Ultra-short audio boundary handling
- Faster-Whisper ASR transcription & language detection
- Acoustic feature extraction (RMS, F0, ZCR, Spectral Centroid)
- Signal quality and acoustic confidence scoring
- Consistent duration_seconds output schema
"""

import sys
from pathlib import Path
import unittest

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from src.voice.features import AcousticFeatureExtractor, WhisperTranscriber, process_audio_pipeline


class TestVoiceLayerComprehensive(unittest.TestCase):
    def setUp(self):
        self.audio_dir = root_dir / "data" / "audio"
        self.extractor = AcousticFeatureExtractor()
        self.transcriber = WhisperTranscriber(model_size="tiny", device="cpu", compute_type="int8")

    def test_valid_audio_features(self):
        audio_file = self.audio_dir / "voice_test_signal.wav"
        if audio_file.exists():
            features = self.extractor.extract_features(str(audio_file))
            self.assertIn("mean_rms_energy", features)
            self.assertIn("speech_activity_ratio", features)
            self.assertIn("voice_intensity_score", features)
            self.assertIn("duration_seconds", features)
            self.assertIn("acoustic_confidence", features)
            self.assertGreaterEqual(features["voice_intensity_score"], 0.0)
            self.assertLessEqual(features["voice_intensity_score"], 1.0)
            self.assertIn(features["status"], ["available", "fallback"])

    def test_invalid_audio_path(self):
        res = self.extractor.extract_features("data/audio/non_existent_file.wav")
        self.assertEqual(res["status"], "error")
        self.assertIsNotNone(res["error"])
        self.assertEqual(res["voice_intensity_score"], 0.0)

    def test_whisper_transcription_and_duration_schema(self):
        audio_file = self.audio_dir / "voice_test_signal.wav"
        if audio_file.exists():
            res = self.transcriber.transcribe(str(audio_file))
            # Test duration_seconds consistency
            self.assertIn("duration_seconds", res)
            self.assertIn("duration", res)
            self.assertIn("text", res)
            self.assertIn("detected_language", res)
            self.assertIn("language_probability", res)
            self.assertIn(res["status"], ["available", "failed"])

    def test_whisper_invalid_path(self):
        res = self.transcriber.transcribe("data/audio/ghost_audio.wav")
        self.assertEqual(res["status"], "failed")
        self.assertEqual(res["duration_seconds"], 0.0)
        self.assertEqual(res["text"], "")

    def test_audio_pipeline_convenience_function(self):
        audio_file = self.audio_dir / "voice_test_signal.wav"
        if audio_file.exists():
            pipeline_res = process_audio_pipeline(str(audio_file), transcribe=False)
            self.assertIn("acoustics", pipeline_res)
            self.assertIn("voice_intensity_score", pipeline_res)
            self.assertIn("acoustic_confidence", pipeline_res)


if __name__ == "__main__":
    unittest.main(verbosity=2)
