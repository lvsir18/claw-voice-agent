# services/asr

当前 ASR 服务本体还在部署机环境里，仓库里保留的是接入点和部署模板。

相关入口：

- `deploy/systemd/fw-whisper.service`
- `services/webchat/server.py`

重点函数：

- `transcribe_audio()`
- `transcribe_via_asr_service()`
- `/api/transcribe`
