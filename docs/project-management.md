# Project Management

## 项目目标

把当前 `Claw Voice Agent` 收成一个可维护、可协作、可上线演示的局域网语音 Agent 系统。

## 近期里程碑

### Milestone 1: 文档与仓库基线

目标：

- README 清楚
- 模块边界明确
- GitHub 仓库初始化
- 团队成员知道各自责任

交付物：

- `README.md`
- `MODULE_OWNERSHIP.md`
- `PROJECT_MANAGEMENT.md`

### Milestone 2: 单机可演示版稳定

目标：

- 中文固定唤醒词稳定
- 录音 / 转写 / 回复 / 播放链路稳定
- 页面状态不串

交付物：

- 可稳定演示的网页工作台
- 明确的回滚版本

### Milestone 3: 模块并行开发

目标：

- 前端 / Wake / ASR / TTS / Agent / Infra 分开推进
- 每组只改自己模块

交付物：

- 模块化目录
- 分支策略
- 基础 issue 列表

## 分支策略

建议：

- `main`: 稳定演示版
- `dev`: 集成分支
- `feat/frontend-workbench`
- `feat/wakeword`
- `feat/asr`
- `feat/tts`
- `feat/agent-routing`
- `feat/infra`

规则：

1. 每个功能只在一个模块分支上推进。
2. 不允许把 UI、模型、部署混在同一个 PR。
3. 所有回退都必须以“恢复到上一已接受版本”为目标，不夹带优化。

## Issue 拆分建议

### Frontend

- `frontend-001` 待机态和对话态彻底分层
- `frontend-002` 唤醒流程可视化增强
- `frontend-003` 语音播放体验优化

### Wake

- `wake-001` 中文固定唤醒词稳定方案
- `wake-002` `sherpa-kws` 中文策略调优
- `wake-003` wake fallback 行为明确化

### ASR

- `asr-001` 中文短句识别稳定性
- `asr-002` chunk 长度与误触发实验
- `asr-003` 录音预处理与降噪

### TTS

- `tts-001` CosyVoice 本地模式质量评估
- `tts-002` API / 本地切换体验
- `tts-003` 语音播放延迟优化

### Agent

- `agent-001` session 生命周期治理
- `agent-002` 多 agent 编排设计
- `agent-003` 对话上下文清理机制

### Infra

- `infra-001` GitHub 仓库初始化
- `infra-002` systemd 模板整理
- `infra-003` 局域网部署文档

## 每周节奏建议

### 周一

- 锁定本周目标
- 每个模块只认一个主 issue

### 周三

- 中期同步
- 只汇报：
  - 做了什么
  - 卡在哪
  - 需要谁支持

### 周五

- 合并到 `dev`
- 做一次完整演示回归

## 演示回归清单

每次合并前至少回归：

1. 页面能打开
2. token 能连接
3. 文本对话正常
4. 录音上传正常
5. ASR 正常
6. TTS 正常
7. 唤醒词逻辑符合当前版本定义

## 当前版本定义

当前可以对外说明的版本是：

- 单机局域网语音 Agent 工作台
- 本地 LLM
- 本地 ASR
- 本地 / API 可切换 TTS
- 中文固定词唤醒在持续调优中

不要对外过度承诺：

- 中文专用 KWS 已完全稳定
- 多 agent 已接入网页层
- 完整生产级部署已经完成

## GitHub 建议操作顺序

1. 初始化仓库
2. 先提交文档基线
3. 再提交现有服务脚本和页面
4. 再按模块拆 issue
5. 最后再让组员并行开发
