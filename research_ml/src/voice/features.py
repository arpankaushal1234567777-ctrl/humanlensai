"""
HumanLens AI — Speech & Voice Processing Module
Member 3: Research / ML Lead

Implements:
1. Local Speech Recognition (ASR): faster-whisper (English, Hindi, Hinglish support)
2. Acoustic Activation Proxies: librosa (Pitch F0, RMS energy, spectral centroid, pause analytics)
3. Fixed empirical baseline normalization (never normalize single sample against itself)
4. Robust fallback to scipy/wave if librosa encounters platform errors
5. Audio duration consistency (uses duration_seconds everywhere)
"""

from pathlib import Path
from typing import Dict, Any, Optional, List
import numpy as np


class WhisperTranscriber:
    """
    ASR module powered by faster-whisper with automatic language detection and lazy loading.
    """

    def __init__(self, model_size: str = "tiny", device: str = "cpu", compute_type: str = "int8"):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self._model = None
        self.status = "unloaded"

    def _get_model(self):
        if self._model is None:
            try:
                from faster_whisper import WhisperModel
                self._model = WhisperModel(
                    self.model_size,
                    device=self.device,
                    compute_type=self.compute_type
                )
                self.status = "available"
            except Exception as e:
                self.status = "unavailable"
                raise RuntimeError(f"Could not load faster-whisper model ({self.model_size}): {e}")
        return self._model

    def transcribe(self, audio_path: str, language: Optional[str] = None) -> Dict[str, Any]:
        """
        Transcribes audio with language auto-detection or optional forced language.
        Returns timestamps, word counts, duration_seconds, and language probability.
        """
        path = Path(audio_path)
        if not path.exists():
            return {
                "text": "",
                "detected_language": "unknown",
                "language_probability": 0.0,
                "duration_seconds": 0.0,
                "duration": 0.0,
                "word_count": 0,
                "segment_timestamps": [],
                "status": "failed",
                "error": f"Audio file not found: {audio_path}",
            }

        try:
            model = self._get_model()
            segments, info = model.transcribe(str(path), language=language, beam_size=3)

            text_parts = []
            segment_list = []
            for seg in segments:
                text_parts.append(seg.text.strip())
                segment_list.append({
                    "start": round(float(seg.start), 2),
                    "end": round(float(seg.end), 2),
                    "text": seg.text.strip(),
                })

            full_text = " ".join(text_parts).strip()
            word_count = len(full_text.split())
            dur = round(float(info.duration), 2)

            return {
                "text": full_text,
                "detected_language": info.language,
                "language_probability": round(float(info.language_probability), 4),
                "duration_seconds": dur,
                "duration": dur,  # Backwards compatibility alias
                "word_count": word_count,
                "segment_timestamps": segment_list,
                "status": "available",
                "error": None,
            }

        except Exception as e:
            return {
                "text": "",
                "detected_language": "unknown",
                "language_probability": 0.0,
                "duration_seconds": 0.0,
                "duration": 0.0,
                "word_count": 0,
                "segment_timestamps": [],
                "status": "failed",
                "error": str(e),
            }


class AcousticFeatureExtractor:
    """
    Extracts acoustic proxies without retaining raw audio.
    Normalizes metrics against fixed empirical conversational baselines.
    """

    # Empirical conversational baselines for adult speech
    BASELINE_BOUNDS = {
        "rms_min": 0.015,
        "rms_max": 0.25,
        "pitch_std_min": 5.0,
        "pitch_std_max": 55.0,
        "activity_min": 0.20,
        "activity_max": 0.85,
    }

    def __init__(self, target_sr: int = 16000):
        self.target_sr = target_sr

    def extract_features(self, audio_path: str) -> Dict[str, Any]:
        path = Path(audio_path)
        if not path.exists():
            return self._default_features(error=f"File not found: {audio_path}", status="error")

        try:
            import librosa

            y, sr = librosa.load(str(path), sr=self.target_sr, mono=True)
            duration = float(librosa.get_duration(y=y, sr=sr))

            if duration <= 0.08 or len(y) < 512:
                return self._default_features(duration=duration, error="Audio duration too short (<80ms)", status="too_short")

            # 1. RMS Energy (Volume intensity proxy)
            rms = librosa.feature.rms(y=y, hop_length=512)[0]
            mean_rms = float(np.mean(rms))
            rms_std = float(np.std(rms))
            energy_range = float(np.percentile(rms, 95) - np.percentile(rms, 5))

            # 2. Pitch (F0) estimation via probabilistic YIN
            fmin = librosa.note_to_hz("C2")  # ~65 Hz
            fmax = librosa.note_to_hz("B4")  # ~494 Hz
            
            try:
                f0, voiced_flag, voiced_prob = librosa.pyin(
                    y, fmin=fmin, fmax=fmax, sr=sr, hop_length=512, fill_na=None
                )
                valid_f0 = f0[~np.isnan(f0)] if f0 is not None else np.array([])
            except Exception:
                valid_f0 = np.array([])

            if len(valid_f0) > 2:
                mean_pitch = float(np.mean(valid_f0))
                pitch_std = float(np.std(valid_f0))
                voiced_ratio = float(len(valid_f0) / len(rms))
            else:
                mean_pitch = 0.0
                pitch_std = 0.0
                voiced_ratio = 0.0

            # 3. Speech Activity & Pause Analytics
            energy_floor = np.percentile(rms, 20)
            threshold = energy_floor + 0.18 * (np.max(rms) - energy_floor)
            active_mask = rms > threshold
            active_ratio = float(np.mean(active_mask))
            pause_ratio = float(1.0 - active_ratio)

            # Count pauses and mean pause duration
            pause_transitions = int(np.sum(np.diff(active_mask.astype(int)) == -1))
            frame_duration_sec = 512 / sr
            pause_durations = []
            current_pause_frames = 0
            for is_active in active_mask:
                if not is_active:
                    current_pause_frames += 1
                else:
                    if current_pause_frames > 2:
                        pause_durations.append(current_pause_frames * frame_duration_sec)
                    current_pause_frames = 0
            mean_pause_sec = float(np.mean(pause_durations)) if pause_durations else 0.0

            # 4. Spectral & Signal Quality Features
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=512)[0]
            mean_centroid = float(np.mean(spectral_centroids))
            zcr = librosa.feature.zero_crossing_rate(y=y, hop_length=512)[0]
            mean_zcr = float(np.mean(zcr))

            # 5. Fixed Baseline Normalization (Eliminating single-sample normalization bug)
            b = self.BASELINE_BOUNDS
            norm_rms = float(np.clip((mean_rms - b["rms_min"]) / (b["rms_max"] - b["rms_min"]), 0.0, 1.0))
            norm_pitch_std = float(np.clip((pitch_std - b["pitch_std_min"]) / (b["pitch_std_max"] - b["pitch_std_min"]), 0.0, 1.0))
            norm_active = float(np.clip((active_ratio - b["activity_min"]) / (b["activity_max"] - b["activity_min"]), 0.0, 1.0))

            # Communication-level acoustic activation proxy [0, 1]
            voice_intensity = (0.40 * norm_rms) + (0.35 * norm_pitch_std) + (0.25 * norm_active)
            voice_intensity = float(np.clip(voice_intensity, 0.0, 1.0))

            # Speech-rate proxy: approximate syllable nuclei via local energy peaks
            if len(rms) > 4:
                peak_mask = (rms[1:-1] > rms[:-2]) & (rms[1:-1] > rms[2:]) & (rms[1:-1] > np.mean(rms))
                num_peaks = int(np.sum(peak_mask))
                speech_rate_proxy = round(float(num_peaks / max(0.5, duration)), 2)
            else:
                speech_rate_proxy = 0.0

            # Acoustic Quality & Confidence
            is_valid = bool(mean_rms > 0.001 and duration > 0.2 and not np.isnan(mean_rms))
            acoustic_confidence = float(np.clip(min(1.0, (duration / 2.0) * (mean_rms / 0.05)), 0.30, 0.98))

            return {
                "sample_rate": sr,
                "duration_seconds": round(duration, 3),
                "duration": round(duration, 3),
                "mean_rms_energy": round(mean_rms, 4),
                "energy": round(mean_rms, 4),
                "rms_energy_std": round(rms_std, 4),
                "energy_dynamic_range": round(energy_range, 4),
                "mean_pitch_hz": round(mean_pitch, 2),
                "pitch": round(mean_pitch, 2),
                "pitch_std_hz": round(pitch_std, 2),
                "voiced_ratio": round(voiced_ratio, 4),
                "speech_activity_ratio": round(active_ratio, 4),
                "speech_rate": speech_rate_proxy,
                "pause_ratio": round(pause_ratio, 4),
                "pause_count": pause_transitions,
                "mean_pause_duration_sec": round(mean_pause_sec, 3),
                "spectral_centroid_mean": round(mean_centroid, 2),
                "zero_crossing_rate_mean": round(mean_zcr, 4),
                "voice_intensity_score": round(voice_intensity, 4),
                "audio_quality_valid": is_valid,
                "audio_features_available": is_valid,
                "acoustic_confidence": round(acoustic_confidence, 4),
                "quality": round(acoustic_confidence, 4),
                "proxy_type": "communication_acoustic_activation_proxy",
                "status": "available",
                "error": None,
            }

        except Exception as e:
            # Fallback to standard library wave / scipy
            return self._fallback_wav_features(path, reason=str(e))

    def _fallback_wav_features(self, path: Path, reason: str = "") -> Dict[str, Any]:
        """Graceful fallback reading WAV via standard wave module."""
        try:
            import wave
            with wave.open(str(path), "rb") as wf:
                sr = wf.getframerate()
                n_frames = wf.getnframes()
                duration = float(n_frames / max(1, sr))
                raw_bytes = wf.readframes(min(n_frames, sr * 5))
                samples = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0

            if len(samples) < 512:
                return self._default_features(duration=duration, error="Audio too short", status="too_short")

            mean_rms = float(np.sqrt(np.mean(samples ** 2)))
            zcr = float(np.mean(np.abs(np.diff(np.sign(samples)))) / 2.0)
            b = self.BASELINE_BOUNDS
            norm_rms = float(np.clip((mean_rms - b["rms_min"]) / (b["rms_max"] - b["rms_min"]), 0.0, 1.0))
            intensity = float(np.clip(norm_rms * 0.8, 0.0, 1.0))

            return {
                "sample_rate": sr,
                "duration_seconds": round(duration, 3),
                "duration": round(duration, 3),
                "mean_rms_energy": round(mean_rms, 4),
                "energy": round(mean_rms, 4),
                "rms_energy_std": 0.0,
                "energy_dynamic_range": round(mean_rms, 4),
                "mean_pitch_hz": 0.0,
                "pitch": 0.0,
                "pitch_std_hz": 0.0,
                "voiced_ratio": 0.5,
                "speech_activity_ratio": 0.5,
                "speech_rate": 0.0,
                "pause_ratio": 0.5,
                "pause_count": 0,
                "mean_pause_duration_sec": 0.0,
                "spectral_centroid_mean": 0.0,
                "zero_crossing_rate_mean": round(zcr, 4),
                "voice_intensity_score": round(intensity, 4),
                "audio_quality_valid": True,
                "audio_features_available": True,
                "acoustic_confidence": 0.50,
                "quality": 0.50,
                "proxy_type": "communication_acoustic_activation_proxy",
                "status": "fallback",
                "error": f"librosa fallback: {reason}",
            }
        except Exception as e:
            return self._default_features(error=f"Acoustic extraction error: {e}", status="error")

    def _default_features(self, duration: float = 0.0, error: Optional[str] = None, status: str = "unavailable") -> Dict[str, Any]:
        return {
            "sample_rate": self.target_sr,
            "duration_seconds": duration,
            "duration": duration,
            "mean_rms_energy": 0.0,
            "energy": 0.0,
            "rms_energy_std": 0.0,
            "energy_dynamic_range": 0.0,
            "mean_pitch_hz": 0.0,
            "pitch": 0.0,
            "pitch_std_hz": 0.0,
            "voiced_ratio": 0.0,
            "speech_activity_ratio": 0.0,
            "speech_rate": 0.0,
            "pause_ratio": 0.0,
            "pause_count": 0,
            "mean_pause_duration_sec": 0.0,
            "spectral_centroid_mean": 0.0,
            "zero_crossing_rate_mean": 0.0,
            "voice_intensity_score": 0.0,
            "audio_quality_valid": False,
            "audio_features_available": False,
            "acoustic_confidence": 0.0,
            "quality": 0.0,
            "proxy_type": "communication_acoustic_activation_proxy",
            "status": status,
            "error": error,
        }


def process_audio_pipeline(audio_path: str, transcribe: bool = True, language: Optional[str] = None) -> Dict[str, Any]:
    extractor = AcousticFeatureExtractor()
    acoustics = extractor.extract_features(audio_path)

    asr_data = {
        "text": "",
        "detected_language": "unknown",
        "duration_seconds": acoustics.get("duration_seconds", 0.0),
        "status": "unavailable",
    }
    if transcribe and Path(audio_path).exists():
        try:
            transcriber = WhisperTranscriber()
            asr_data = transcriber.transcribe(audio_path, language=language)
        except Exception as e:
            asr_data = {
                "text": "",
                "detected_language": "unknown",
                "duration_seconds": acoustics.get("duration_seconds", 0.0),
                "status": "unavailable",
                "error": str(e),
            }

    asr_avail = asr_data.get("status") == "available"
    audio_feat_avail = acoustics.get("status") in ["available", "fallback"]

    return {
        "asr_available": asr_avail,
        "audio_features_available": audio_feat_avail,
        "transcript": asr_data.get("text", ""),
        "pitch": acoustics.get("pitch", 0.0),
        "speech_rate": acoustics.get("speech_rate", 0.0),
        "pause_ratio": acoustics.get("pause_ratio", 0.0),
        "energy": acoustics.get("energy", 0.0),
        "quality": acoustics.get("quality", 0.0),
        "detected_language": asr_data.get("detected_language", "unknown"),
        "language_probability": asr_data.get("language_probability", 0.0),
        "voice_intensity_score": acoustics.get("voice_intensity_score", 0.0),
        "acoustic_confidence": acoustics.get("acoustic_confidence", 0.0),
        "asr_details": asr_data,
        "acoustics": acoustics,
        "status": "available" if (asr_avail or audio_feat_avail) else "unavailable",
    }
