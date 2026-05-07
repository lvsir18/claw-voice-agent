#!/usr/bin/env python3
import os
import shutil
import threading
import time
from pathlib import Path


def _env_bool(name, default=False):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_float(name, default):
    value = os.environ.get(name)
    if value is None or not value.strip():
        return default
    try:
        return float(value)
    except ValueError:
        return default


def _safe_float(value):
    if value is None:
        return None
    try:
        if hasattr(value, "detach"):
            value = value.detach()
        if hasattr(value, "cpu"):
            value = value.cpu()
        if hasattr(value, "item"):
            value = value.item()
        return float(value)
    except Exception:
        try:
            return float(value)
        except Exception:
            return None


class SpeakerVerifier:
    def __init__(self):
        home = Path.home() / ".openclaw"
        self.default_speaker_id = os.environ.get("OPENCLAW_SPEAKER_ID", "owner").strip() or "owner"
        self.threshold = _env_float("OPENCLAW_SPEAKER_THRESHOLD", 0.70)
        self.profile_dir = Path(
            os.environ.get("OPENCLAW_SPEAKER_PROFILE_DIR", str(home / "webchat/speakers"))
        ).expanduser()
        self.model_dir = Path(
            os.environ.get("OPENCLAW_SPEAKER_MODEL_DIR", str(home / "webchat/speaker_model"))
        ).expanduser()
        self.model_source = os.environ.get(
            "OPENCLAW_SPEAKER_MODEL_SOURCE", "speechbrain/spkrec-ecapa-voxceleb"
        ).strip() or "speechbrain/spkrec-ecapa-voxceleb"
        self._model = None
        self._model_error = None
        self._lock = threading.Lock()

    def is_enabled(self):
        return _env_bool("OPENCLAW_SPEAKER_VERIFY_ENABLED", False)

    def _speaker_id(self, speaker_id=None):
        return str(speaker_id or self.default_speaker_id or "owner").strip() or "owner"

    def _speaker_dir(self, speaker_id=None):
        safe_id = "".join(ch if ch.isalnum() or ch in "._-" else "-" for ch in self._speaker_id(speaker_id))
        return self.profile_dir / safe_id

    def _samples(self, speaker_id=None):
        directory = self._speaker_dir(speaker_id)
        if not directory.exists():
            return []
        suffixes = {".wav", ".flac", ".mp3", ".ogg", ".m4a", ".webm"}
        return sorted(path for path in directory.iterdir() if path.is_file() and path.suffix.lower() in suffixes)

    def has_profile(self, speaker_id=None):
        return bool(self._samples(speaker_id))

    def _load_model(self):
        if self._model is not None:
            return self._model
        if self._model_error is not None:
            raise RuntimeError(self._model_error)
        with self._lock:
            if self._model is not None:
                return self._model
            if self._model_error is not None:
                raise RuntimeError(self._model_error)
            try:
                try:
                    from speechbrain.inference.speaker import SpeakerRecognition
                except Exception:
                    from speechbrain.pretrained import SpeakerRecognition

                self.model_dir.mkdir(parents=True, exist_ok=True)
                self._model = SpeakerRecognition.from_hparams(
                    source=self.model_source,
                    savedir=str(self.model_dir),
                )
                return self._model
            except Exception as exc:
                self._model_error = str(exc)
                raise

    def enroll(self, audio_path, speaker_id="owner"):
        sid = self._speaker_id(speaker_id)
        src = Path(audio_path)
        if not src.exists() or not src.is_file():
            return {"ok": False, "speaker_id": sid, "error": "audio file not found"}
        try:
            directory = self._speaker_dir(sid)
            directory.mkdir(parents=True, exist_ok=True)
            stamp = time.strftime("%Y%m%d_%H%M%S")
            target = directory / f"enroll_{stamp}.wav"
            if target.exists():
                target = directory / f"enroll_{stamp}_{int(time.time() * 1000)}.wav"
            shutil.copy2(src, target)
            samples = self._samples(sid)
            return {
                "ok": True,
                "speaker_id": sid,
                "num_samples": len(samples),
                "profile_dir": str(directory),
                "message": "speaker enrolled",
            }
        except Exception as exc:
            return {"ok": False, "speaker_id": sid, "error": str(exc)}

    def verify(self, audio_path, speaker_id="owner"):
        sid = self._speaker_id(speaker_id)
        if not self.is_enabled():
            return {
                "ok": True,
                "enabled": False,
                "matched": True,
                "score": None,
                "reason": "speaker verification disabled",
            }

        src = Path(audio_path)
        if not src.exists() or not src.is_file():
            return {
                "ok": False,
                "enabled": True,
                "matched": False,
                "score": None,
                "reason": "audio file not found",
            }

        samples = self._samples(sid)
        if not samples:
            return {
                "ok": False,
                "enabled": True,
                "matched": False,
                "score": None,
                "reason": "speaker profile not enrolled",
                "speaker_id": sid,
                "num_samples": 0,
            }

        try:
            model = self._load_model()
            best_score = None
            best_prediction = None
            best_sample = None
            for sample in samples:
                score, prediction = model.verify_files(str(src), str(sample))
                score_value = _safe_float(score)
                if score_value is not None and (best_score is None or score_value > best_score):
                    best_score = score_value
                    best_prediction = prediction
                    best_sample = sample

            matched = bool(best_score is not None and best_score >= self.threshold)
            return {
                "ok": True,
                "enabled": True,
                "matched": matched,
                "score": best_score,
                "threshold": self.threshold,
                "speaker_id": sid,
                "num_samples": len(samples),
                "prediction": bool(_safe_float(best_prediction)) if best_prediction is not None else None,
                "best_sample": str(best_sample) if best_sample else None,
            }
        except Exception as exc:
            return {
                "ok": False,
                "enabled": True,
                "matched": False,
                "score": None,
                "threshold": self.threshold,
                "speaker_id": sid,
                "num_samples": len(samples),
                "error": str(exc),
            }

    def status(self, speaker_id="owner"):
        sid = self._speaker_id(speaker_id)
        samples = self._samples(sid)
        return {
            "ok": True,
            "enabled": self.is_enabled(),
            "speaker_id": sid,
            "threshold": self.threshold,
            "has_profile": bool(samples),
            "num_samples": len(samples),
            "profile_dir": str(self._speaker_dir(sid)),
            "model_dir": str(self.model_dir),
            "model_source": self.model_source,
            "model_loaded": self._model is not None,
            "model_error": self._model_error,
        }
