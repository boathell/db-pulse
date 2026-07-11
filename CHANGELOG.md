# Changelog

所有值得用户感知的 Agent Pulse 变化都会记录在这里。版本遵循语义化版本，能力状态分为 planned、experimental 和 operational；只有拥有代码、测试或运行证据的能力才会进入 release。

## [0.2.0] - 2026-07-11

### Added

- 100+ 高价值知识源目录，覆盖全球与中国厂商、研究评测、开源、Agent、机器人、芯片云、资本、政策、专家、媒体和社交热度。
- Source lifecycle、健康分、SourceRun、策略字段和管理台操作。
- 有界并发、结构化错误、瞬时错误重试、退避抖动、Retry-After、ETag/Last-Modified、逐跳 SSRF 检查和流式响应上限。
- Opportunity Scout v1：证据绑定、三类机会、冷却去重、状态流转、人工公开门禁和静态观测站。
- Capability Map、State 1–5 Roadmap、多维 Evaluation Scorecard 和公开 Evolution Spine。

### Changed

- 重新审计项目水位，从“第一阶段已完成”修正为 Stage 1.2 / 5 的可演示骨架。
- 产品空间收敛为 Today、Timeline、Radar、Inbox；Changelog 与 Roadmap 进入产品自身。
- README 和旧 TASKS 去除热点、管理台、测试与发布闭环方面的过度承诺。

### Known limitations

- 公开事件仍以精选 seed 为主，不代表真实跨平台热点系统已经成立。
- Source Catalog 不等于全部已接入：只有少量来源 active，大部分处于 candidate/manual/restricted。
- 尚缺 Document/Observation 分离、调度、per-host 限流、完整 adapter fixtures、MySQL CI 和浏览器端到端测试。

## [0.1.0] - 2026-07-11

### Added

- Node.js + TypeScript + Fastify + Kysely 工程骨架。
- SQLite 默认数据库与 MySQL dialect。
- Signal、Event、Track、Actor、Model Resource、View 数据模型。
- 基础采集、聚类、评分、管理台、静态 Timeline、主题、详情抽屉与 GitHub Pages。

[0.2.0]: https://github.com/barretlee/agent-pulse/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/barretlee/agent-pulse/releases/tag/v0.1.0
