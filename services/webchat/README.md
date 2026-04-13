# services/webchat

网页工作台主服务。

范围：

- 浏览器聊天入口
- 录音 / 上传 / 转写交互
- 待机 / 唤醒 / 对话 / 回复状态机
- `/api/chat`
- `/api/transcribe`
- `/api/tts`
- `/api/wake-check`

说明：

- 当前仓库里的 `server.py` 来自 `pro600` 线上运行版本回收。
- 这是当前最重要的集成层，连接前端、wake、ASR、LLM、TTS。
