#!/usr/bin/env python3
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import soundfile as sf

ROOT = Path('/home/aa-3090/.openclaw/cosyvoice/CosyVoice')
PYDEPS = '/home/aa-3090/.openclaw/cosyvoice-pydeps'
MATCHA = str(ROOT / 'third_party/Matcha-TTS')
if PYDEPS not in sys.path:
    sys.path.insert(0, PYDEPS)
if str(ROOT) not in sys.path:
    sys.path.insert(1, str(ROOT))
if MATCHA not in sys.path:
    sys.path.insert(2, MATCHA)

from cosyvoice.cli.cosyvoice import AutoModel

HOST = '127.0.0.1'
PORT = int(os.environ.get('COSYVOICE_TTS_PORT', '9461'))
MODEL_DIR = os.environ.get(
    'COSYVOICE_TTS_MODEL_DIR',
    '/home/aa-3090/.openclaw/cosyvoice/models/CosyVoice-300M-SFT',
)
PROMPT_TEXT = os.environ.get('COSYVOICE_TTS_PROMPT_TEXT', '希望你以后能够做的比我还好呦。')
PROMPT_WAV = os.environ.get('COSYVOICE_TTS_PROMPT_WAV', str(ROOT / 'asset/zero_shot_prompt.wav'))
SPEAKER = os.environ.get('COSYVOICE_TTS_SPEAKER', '中文女')
OUT_DIR = Path(os.environ.get('COSYVOICE_TTS_OUT_DIR', '/home/aa-3090/.openclaw/cosyvoice/tts-out'))
OUT_DIR.mkdir(parents=True, exist_ok=True)

MODEL = AutoModel(model_dir=MODEL_DIR)
MODEL_KIND = 'sft' if '300M-SFT' in MODEL_DIR or 'SFT' in MODEL_DIR else 'zero_shot'

class Handler(BaseHTTPRequestHandler):
    def _send_json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/health':
            self._send_json(
                200,
                {
                    'ok': True,
                    'model_dir': MODEL_DIR,
                    'model_kind': MODEL_KIND,
                    'speaker': SPEAKER if MODEL_KIND == 'sft' else None,
                    'sample_rate': getattr(MODEL, 'sample_rate', None),
                },
            )
            return
        self._send_json(404, {'error': 'not_found'})

    def do_POST(self):
        if self.path != '/synthesize':
            self._send_json(404, {'error': 'not_found'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            payload = json.loads(self.rfile.read(length) or b'{}')
            text = str(payload.get('text') or '').strip()
            request_id = str(payload.get('request_id') or 'cosyvoice')
            if not text:
                self._send_json(400, {'error': 'text_required'})
                return
            out = OUT_DIR / f'{request_id}.wav'
            if MODEL_KIND == 'sft':
                iterator = MODEL.inference_sft(text, SPEAKER, stream=False)
            else:
                iterator = MODEL.inference_zero_shot(text, PROMPT_TEXT, PROMPT_WAV, stream=False)
            for item in iterator:
                wav = item['tts_speech'].squeeze().cpu().numpy()
                sf.write(str(out), wav, MODEL.sample_rate)
                break
            if not out.exists():
                self._send_json(500, {'error': 'output_missing'})
                return
            self._send_json(
                200,
                {
                    'ok': True,
                    'path': str(out),
                    'sample_rate': MODEL.sample_rate,
                    'bytes': out.stat().st_size,
                    'model_dir': MODEL_DIR,
                    'model_kind': MODEL_KIND,
                    'speaker': SPEAKER if MODEL_KIND == 'sft' else None,
                },
            )
        except Exception as exc:
            self._send_json(500, {'error': type(exc).__name__, 'detail': str(exc)})

    def log_message(self, fmt, *args):
        return

if __name__ == '__main__':
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
