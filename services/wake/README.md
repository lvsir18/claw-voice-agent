# services/wake

当前唤醒词相关代码入口：

- `services/wake/sherpa_kws_server.py`
- `services/wake/wake_keywords.txt`
- `services/webchat/server.py`

当前策略：

- 中文固定词先走本地 ASR 主路径
- `sherpa-kws` 已接入，继续调优

组员如果要改唤醒词，先看：

- `/api/wake-check`
- `checkWakeWord()`
- `flushWakeChunkIfReady()`
