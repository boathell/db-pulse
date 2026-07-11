# 系统设计

## 水位判断

```text
Stage 1  可信时间轴
         Signal -> Event -> 主线/角色 -> 审核 -> 静态发布
         当前：主体完成，但少量规格与实现存在落差

Stage 2  可运营情报流水线                       <- 本轮进入
         Source OS + 运行可观测性 + 质量门禁 + Scout v1

Stage 3  行业认知图谱
         Entity / Claim / Evidence / Contradiction / Theme
         多语言语义聚类、观点谱系、技术与资本传导关系

Stage 4  个性化决策副驾
         关注组合、情景推演、领先指标、预测与事后校准
         面向 CEO / 投资 / 技术 / 个人目标的不同决策界面

Stage 5  受治理的自治情报机构
         自主发现候选来源、生成适配器提案、组织 agent 调研和实验
         以权限、预算、审计、人工发布门槛和反馈声誉约束自治
```

当前约为 Stage 1.2：产品已有可演示骨架，但公开样例主要来自 seed，来源可靠性仍停留在适配器级，尚不具备生产化 Source OS；改造前星探不存在。本轮完成后应称为“Stage 2 foundation”，只有来源 SLA、真实热点质量、发布闭环和星探命中率经过持续运行验证后才算 Stage 2 完成。

## Source Platform 架构

```text
Source Registry
  -> lifecycle gate
  -> bounded scheduler / manual trigger
  -> policy-aware fetcher
       SSRF + size + timeout
       conditional request
       retry classification + Retry-After + backoff/jitter
  -> SourceAdapter contract validation
  -> normalized Signal + dedupe
  -> SourceRun metrics
  -> health reducer
       active -> degraded -> quarantined
  -> admin control plane
```

### 错误分类

- `network`：DNS、连接、连接重置；可重试。
- `timeout`：请求超时；可重试。
- `rate_limit`：429；尊重 Retry-After 后重试。
- `upstream`：408、425、5xx；可重试。
- `permanent_http`：其他 4xx；不可盲目重试。
- `security`：SSRF、非法协议、凭据 URL、响应过大；不可重试，优先隔离。
- `contract`：字段/格式不满足适配器契约；不可网络重试，进入 degraded。
- `configuration`：缺少 URL 或适配器；不可重试。
- `internal`：写库等内部错误；记录并人工处理。

### 运行与健康

每个来源拉取创建独立 `source_runs`，全局 `jobs` 只做批次汇总。健康分采用可解释 reducer：成功 `+8`，304 `+3`，瞬时失败 `-15`，契约/永久失败 `-25`，范围 0-100。连续失败达到 2 时 degraded，达到 5 时 quarantined。管理员手工状态优先，退役不允许自动恢复。

“卸载”定义为软退役：adapter 可以从注册表移除，但只要存在 signal/event provenance，就不得级联删除 source。未来 adapter package 可独立安装，本轮先建立 lifecycle 与 contract 边界。

### 并发与增量

- 批次使用 `COLLECTOR_CONCURRENCY` 有界 worker pool，不无限并发。
- 单来源内部请求默认串行，尊重来源限速。
- 状态保存 ETag、Last-Modified 与 adapter cursor；304 视为成功但无新增数据。
- 重试次数、timeout 和 backoff 可由 source policy 覆盖，但受系统最大值约束。
- 所有适配器返回统一 `CollectedSignal[]`；pipeline 的 fetch wrapper 负责捕获 ETag、Last-Modified、304 和运行遥测。cursor/pagination 需要的 `CollectionResult + statePatch` 是下一步契约升级。

## 数据模型

### `sources` 新增

`lifecycle_status`、`health_score`、`consecutive_failures`、`success_count`、`failure_count`、`priority`、`timeout_ms`、`max_retries`、`base_backoff_ms`、`rate_limit_per_minute`、`next_run_at`、`retired_at`。

### `source_runs`

保存 source/job、status、attempts、duration、collected/created/skipped、HTTP 状态、error type/code/summary、response bytes、started/finished。它是来源运维和 SLO 的事实表。

### `scout_insights` / `scout_evidence`

`scout_insights` 保存卡片正文、类型、状态、目标受众、时间跨度、各维评分、综合分、冷却键和生命周期；`scout_evidence` 连接已发布 Event，保存证据角色和权重。

## 星探引擎 v1

```text
published Events + Tracks + Actors
    -> opportunity detectors
       1. 高影响 + 低商业成熟度
       2. 中国追赶 + 成本/开源变化
       3. 技术能力跨入新受众
       4. 多事件形成内容/数据资产
    -> evidence requirement
    -> score(confidence, evidence, novelty, leverage)
    -> cooldown/dedupe
    -> private inbox
    -> human feedback
    -> optional public export
```

v1 的目标是“可解释、可反馈”，不是最大生成量。规则生成器必须引用至少一个 published Event；相同 `cooldown_key` 在 72 小时内不得重复。未来 LLM enhancer 读取结构化候选并按 schema 输出，但不能绕过证据和发布门禁。

## 第三到第五阶段的成长方式

- Stage 3：来源平台积累的 provenance 升级为 Claim/Evidence 图谱；同一实体的发布、融资、招聘、论文、开源和产品信号形成时空轨迹；中英文同义事件与互相矛盾的观点可被识别。
- Stage 4：用户建立关注组合和决策问题，系统给出情景、领先指标和反证；预测必须保存时间戳、概率和事后结果，防止“事后诸葛亮”。星探从通用机会卡升级为个人战略副驾。
- Stage 5：系统可发现来源缺口、提出并测试 adapter、委派调研、评估信源价值和淘汰低价值来源；任何外部写入、公开发布、权限扩大和预算消耗仍需政策引擎与人工批准。

成长不是不断堆 agent，而是每一阶段都积累可验证资产：来源运行记录、证据图谱、预测校准和用户反馈。

## 能力核算与评测架构

`src/catalog/product.ts` 是当前 Capability / Roadmap / Release 的代码侧事实源；`CHANGELOG.md` 是人类可读 release 记录；`evaluation_runs` 保存每次评测的维度、样本、能力快照和版本。后台评测中心读取真实运行数据，公开 Evolution 只输出隐私安全摘要。

综合分只聚合 `measured` 维度，`insufficient_data` 只展示缺口。这样避免 seed 样例或少量 SourceRun 产生虚假的高质量分。初始维度：source coverage、source quality、source reliability、confidence、value、realtime、timeliness、effectiveness、governance。
