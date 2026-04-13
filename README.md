# Claw Voice Agent

一个局域网可访问的本地语音 Agent 项目。

当前已经接起来的主链路：

- 浏览器工作台
- 唤醒词进入对话
- 录音上传
- 本地 ASR
- 本地 LLM
- 本地 / API 可切换 TTS

## 现在用到的东西

- Agent runtime: `OpenClaw`
- LLM: `Qwen2.5-7B-Instruct`
- LLM serving: `vLLM`
- ASR: `faster-whisper large-v3`
- Local TTS: `CosyVoice-300M-SFT`
- API TTS fallback: `Microsoft edge-tts`
- Wake word:
  - 当前稳定主路径：中文固定词走本地 ASR 唤醒
  - `sherpa-kws` 已接入，继续调优

## 代码在哪

### 前端和主集成层

- `services/webchat/server.py`

这里面同时包含：
- 网页 UI
- 前端交互
- `/api/chat`
- `/api/transcribe`
- `/api/tts`
- `/api/wake-check`

如果要改 UI、状态机、录音交互、唤醒流程可视化，先看这里。

### 本地 TTS

- `services/tts/cosyvoice_server.py`

### 唤醒词

- `services/wake/sherpa_kws_server.py`
- `services/wake/wake_keywords.txt`

### 部署模板

- `deploy/systemd/`
- `deploy/config/openclaw.json.example`

## 目录怎么分工

- `services/webchat/`
  前端工作台 + 主集成层

- `services/wake/`
  唤醒词、待机检测、关键词策略

- `services/asr/`
  ASR 服务与转写链路

- `services/tts/`
  本地 TTS / API TTS

- `services/agent/`
  OpenClaw、LLM、prompt、多 agent

- `deploy/`
  systemd、配置模板、部署文件

## 给组员的最短说明

### 前端组

改这里：
- `services/webchat/server.py`

负责：
- 页面 UI
- 状态栏
- 对话流程
- 录音和唤醒交互

### 唤醒词组

改这里：
- `services/wake/sherpa_kws_server.py`
- `services/wake/wake_keywords.txt`
- `services/webchat/server.py` 里的 `/api/wake-check` 路由

负责：
- 中文唤醒词稳定性
- `sherpa-kws`
- ASR fallback

### ASR 组

重点看：
- `deploy/systemd/fw-whisper.service`
- `services/webchat/server.py` 里的转写调用

负责：
- 本地转写质量
- 中文短句稳定性

### TTS 组

改这里：
- `services/tts/cosyvoice_server.py`
- `services/webchat/server.py` 里的 `/api/tts`

负责：
- CosyVoice
- API / 本地切换
- 音色和质量

### Agent / LLM 组

重点看：
- `deploy/config/openclaw.json.example`
- `services/webchat/server.py` 里的 `run_openclaw()`

负责：
- OpenClaw
- prompt
- tool routing
- 多 agent

### 平台组

重点看：
- `deploy/systemd/`
- `deploy/config/openclaw.json.example`

负责：
- 部署
- 局域网访问
- 证书
- 回滚

## 现在最重要的事

1. 中文唤醒词真正稳定
2. 前端待机态 / 对话态彻底分层
3. 多 agent 方案落地

## 文档

- `docs/architecture.md`
- `docs/module-ownership.md`
- `docs/project-management.md`
- `docs/execution-guardrails.md`
