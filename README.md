# Claw Voice Agent

一个本地语音 Agent 项目，当前主链路是：

- 唤醒词进入对话
- 浏览器录音 / 音频上传
- 服务器端 ASR
- 本地 LLM 回复
- 本地 / API 可切换 TTS

## 当前技术栈

- Agent runtime: `OpenClaw`
- LLM: `Qwen2.5-7B-Instruct`
- LLM serving: `vLLM`
- ASR: `faster-whisper large-v3`
- Local TTS: `CosyVoice-300M-SFT`
- API TTS fallback: `Microsoft edge-tts`
- Wake word:
  - 当前稳定主路径：中文固定词走本地 ASR 唤醒
  - `sherpa-kws` 已接入，继续调优

## 代码划分

### `frontend/`

前端静态文件。

- `index.html`
- `styles.css`
- `app.js`

这里主要放：
- 页面结构
- 样式
- 前端交互
- 录音、唤醒、播放的浏览器逻辑

### `services/webchat/`

主集成层。

- `server.py`

这里主要负责：
- 网页入口
- 静态资源加载
- `/api/chat`
- `/api/transcribe`
- `/api/tts`
- `/api/wake-check`
- 前后端总集成

### `services/wake/`

唤醒词服务。

- `sherpa_kws_server.py`
- `wake_keywords.txt`

这里主要负责：
- 专用 KWS
- 关键词配置
- 唤醒检测服务

### `services/asr/`

ASR 相关入口和说明。

当前仓库里主要通过：
- `services/webchat/server.py`
- `deploy/systemd/fw-whisper.service`

这里对应：
- 音频转写
- ASR 调用链路
- 短句识别稳定性

### `services/tts/`

TTS 服务。

- `cosyvoice_server.py`

这里主要负责：
- 本地 CosyVoice
- 本地 TTS 输出
- TTS 服务接口

### `services/agent/`

Agent / LLM 相关入口。

当前主要通过：
- `deploy/config/openclaw.json.example`
- `services/webchat/server.py` 里的 `run_openclaw()`

这里对应：
- OpenClaw
- prompt
- tool routing
- 多 agent

### `deploy/`

部署模板。

- `systemd/`
- `config/openclaw.json.example`

这里主要放：
- systemd service 模板
- 配置模板
- 部署相关文件

## 当前最重要的入口

- 改 UI：`frontend/`
- 改集成逻辑：`services/webchat/server.py`
- 改唤醒词：`services/wake/`
- 改 TTS：`services/tts/`
- 改部署：`deploy/`
