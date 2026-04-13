# services/tts

当前 TTS 代码入口：

- `services/tts/cosyvoice_server.py`
- `services/webchat/server.py`

关键点：

- 本地 TTS：`CosyVoice-300M-SFT`
- fallback：`Microsoft edge-tts`
- 页面切换逻辑在 `/api/tts`
