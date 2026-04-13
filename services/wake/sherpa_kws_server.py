#!/usr/bin/env python3
import io
import json
import os
import sys
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np

PYDEPS = "/home/aa-3090/.openclaw/sherpa-kws-pydeps"
if PYDEPS not in sys.path:
    sys.path.insert(0, PYDEPS)

import sherpa_onnx

HOST = "127.0.0.1"
PORT = int(os.environ.get("SHERPA_KWS_PORT", "9462"))
MODEL_DIR = os.environ.get(
    "SHERPA_KWS_MODEL_DIR",
    "/home/aa-3090/.openclaw/sherpa-kws/sherpa-onnx-kws-zipformer-zh-en-3M-2025-12-20",
)
KEYWORDS_FILE = os.environ.get(
    "SHERPA_KWS_KEYWORDS_FILE",
    "/home/aa-3090/.openclaw/sherpa-kws/wake_keywords.txt",
)
TARGET_PHRASE = os.environ.get("SHERPA_KWS_TARGET_PHRASE", "机器人你好")


def normalize(text: str) -> str:
    return "".join(ch for ch in str(text or "").lower() if ch.isalnum())


SPOTTER = sherpa_onnx.KeywordSpotter(
    tokens=f"{MODEL_DIR}/tokens.txt",
    encoder=f"{MODEL_DIR}/encoder-epoch-13-avg-2-chunk-8-left-64.int8.onnx",
    decoder=f"{MODEL_DIR}/decoder-epoch-13-avg-2-chunk-8-left-64.onnx",
    joiner=f"{MODEL_DIR}/joiner-epoch-13-avg-2-chunk-8-left-64.int8.onnx",
    keywords_file=KEYWORDS_FILE,
    provider="cpu",
    num_threads=1,
    keywords_threshold=float(os.environ.get("SHERPA_KWS_THRESHOLD", "0.05")),
)


def check_wav_bytes(raw: bytes) -> str:
    with wave.open(io.BytesIO(raw), "rb") as wf:
        sample_rate = wf.getframerate()
        sample_width = wf.getsampwidth()
        channels = wf.getnchannels()
        frames = wf.readframes(wf.getnframes())

    if sample_width != 2:
        raise RuntimeError(f"unsupported wav sample width: {sample_width}")

    samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
    if channels > 1:
        samples = samples.reshape(-1, channels).mean(axis=1)

    stream = SPOTTER.create_stream()
    stream.accept_waveform(sample_rate, samples)
    stream.input_finished()
    while SPOTTER.is_ready(stream):
        SPOTTER.decode_stream(stream)
    return SPOTTER.get_result(stream) or ""


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self._send_json(
                200,
                {
                    "ok": True,
                    "model_dir": MODEL_DIR,
                    "keywords_file": KEYWORDS_FILE,
                    "target_phrase": TARGET_PHRASE,
                },
            )
            return
        self._send_json(404, {"error": "not_found"})

    def do_POST(self):
        if self.path != "/check":
            self._send_json(404, {"error": "not_found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            phrase = self.headers.get("X-Wake-Phrase", TARGET_PHRASE)
            if normalize(phrase) != normalize(TARGET_PHRASE):
                self._send_json(200, {"ok": True, "matched": False, "text": "", "engine": "sherpa-kws"})
                return
            result = check_wav_bytes(raw)
            matched = normalize(result) == normalize(TARGET_PHRASE)
            self._send_json(200, {"ok": True, "matched": matched, "text": result, "engine": "sherpa-kws"})
        except Exception as exc:
            self._send_json(500, {"error": type(exc).__name__, "detail": str(exc)})

    def log_message(self, fmt, *args):
        return


if __name__ == "__main__":
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
