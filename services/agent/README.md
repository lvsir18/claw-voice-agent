# services/agent

当前 agent 代码还没有单独抽出来。

现在和 agent 相关的入口主要在：

- `deploy/config/openclaw.json.example`
- `services/webchat/server.py` 里的 `run_openclaw()`

后面这里建议承接：

- OpenClaw agent 配置
- prompt 版本
- tool routing
- 多 agent 编排代码
