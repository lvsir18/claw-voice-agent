# OpenClaw WebChat Fast Mode

This is a separate lightweight WebChat backend for low-latency natural voice dialogue.
It does not replace the original WebChat services.

## Service

- Unit: `openclaw-webchat-fast.service`
- Port: `18890`
- HTTPS unit: `openclaw-webchat-fast-https.service`
- HTTPS port: `18444`
- Backend: `/home/aa-3090/.openclaw/webchat/server_fast.py`
- Data: `/home/aa-3090/.openclaw/webchat-fast/data`
- Uploads: `/home/aa-3090/.openclaw/webchat-fast/uploads`
- TTS output: `/home/aa-3090/.openclaw/webchat-fast/tts`
- Log: `/home/aa-3090/.openclaw/webchat-fast/debug.log`

The original services remain unchanged on ports `18889` and `18443`.

## Fast Path

The normal `/api/chat` path calls the OpenClaw agent wrapper, which adds orchestration overhead.
Fast mode keeps the same WebChat API surface but calls the local vLLM OpenAI-compatible endpoint directly:

```text
browser audio -> /api/transcribe -> ASR 9460
transcript -> /api/chat -> vLLM 8000 directly
reply text -> /api/tts -> TTS file -> browser playback
```

Key fast-mode settings:

- `OPENCLAW_WEBCHAT_FAST_MODE=1`
- `OPENCLAW_FAST_LLM_URL=http://127.0.0.1:8000/v1/chat/completions`
- `OPENCLAW_FAST_LLM_MODEL=qwen-local`
- `OPENCLAW_FAST_LLM_MAX_TOKENS=96`
- `OPENCLAW_FAST_HISTORY_TURNS=3`
- `OPENCLAW_FAST_TTS_MAX_CHARS=0`

TTS truncation is disabled in the fast service so the spoken reply matches the full text reply.

## Commands

```bash
systemctl --user start openclaw-webchat-fast.service
systemctl --user start openclaw-webchat-fast-https.service
systemctl --user stop openclaw-webchat-fast.service
systemctl --user stop openclaw-webchat-fast-https.service
systemctl --user status openclaw-webchat-fast.service
systemctl --user status openclaw-webchat-fast-https.service
```

The service is intentionally not enabled for auto-start and uses `Restart=no`.
