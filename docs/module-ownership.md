# Module Ownership

## 模块拆分

### 1. Frontend Workbench

范围：

- 网页布局与视觉设计
- 状态栏 / 侧边栏 / 流程可视化
- 麦克风设备选择
- 待机 / 唤醒 / 对话 / 播放状态切换
- 唤醒流程可视化

不负责：

- ASR 模型本身
- TTS 模型本身
- OpenClaw 推理逻辑

建议 owner：

- 1 名前端主负责人
- 1 名交互 / UI 辅助负责人

### 2. Wake Word

范围：

- 唤醒词检测服务
- `sherpa-kws`
- 唤醒词 fallback 策略
- chunk 长度、阈值、关键词格式
- 中文 / 英文固定词策略

不负责：

- 正式录音转写
- 回复播报

建议 owner：

- 1 名语音算法负责人

### 3. ASR

范围：

- `faster-whisper`
- 模型精度 / 延迟调优
- 中文短语稳定性
- 音频预处理
- 录音 / 上传 / 转写接口

建议 owner：

- 1 名 ASR 负责人

### 4. TTS

范围：

- `CosyVoice-300M-SFT`
- `Microsoft edge-tts` fallback
- `/api/tts`
- 音频输出质量、音色选择、播放体验

建议 owner：

- 1 名 TTS 负责人

### 5. Agent / LLM

范围：

- OpenClaw gateway
- `localqwen`
- prompt / memory / tool use
- vLLM 与模型切换
- 多 agent 编排

建议 owner：

- 1 名 Agent/LLM 负责人

### 6. Infra / Deployment

范围：

- `systemd` 服务
- 局域网访问
- HTTPS 证书
- 回滚策略
- 日志、监控、服务编排

建议 owner：

- 1 名平台 / 运维负责人

## 建议目录归属

### frontend/

- owner: Frontend Workbench

### services/wake/

- owner: Wake Word

### services/asr/

- owner: ASR

### services/tts/

- owner: TTS

### services/agent/

- owner: Agent / LLM

### deploy/ or infra/

- owner: Infra / Deployment

## 协作边界

1. 前端不直接改模型配置。
2. ASR 不直接改 TTS。
3. TTS 不直接改 wake-word。
4. Agent 组不直接改网页视觉。
5. Infra 只提供服务边界、配置和回滚能力，不负责功能逻辑。

## 当前最应该并行化的任务

### Frontend

- 收敛待机态 / 对话态 / 错误态视觉表达
- 把唤醒流程、正式对话流程、历史消息彻底分层

### Wake

- 中文固定词 `你好` / `机器人你好` 稳定性实验
- `sherpa-kws` 与 ASR fallback 的路由策略

### ASR

- 中文短句稳定识别
- 更短 chunk 对唤醒的影响

### TTS

- `CosyVoice` 声音稳定性与延迟
- 页面上本地 / API 切换体验

### Agent

- 单 agent 到多 agent 的编排方案
- Session 管理和上下文清理

### Infra

- GitHub 仓库整理
- 服务配置模板
- 一键部署与回滚
