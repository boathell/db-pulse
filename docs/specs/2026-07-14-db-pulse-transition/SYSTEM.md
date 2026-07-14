# 系统设计

## 领域隔离

`sources`、`events`、`scout_insights` 增加 `content_domain`。迁移前数据默认 `ai-industry`，新内容使用 `database-cn`。公开查询、采集、Scout、快照与静态导出只消费当前领域；旧数据保留在本地数据库中用于审计和回滚。

## 本地化与资源

`event_localizations` 按 `(event_id, locale)` 保存标题、事实、摘要、技术判断、行业判断、下一观察和业务价值。中文继续保存在 Event 主表，英文发布需要完整行。

`database_resources` 替代公开的 `model_resources`，记录厂商、产品、引擎类型、版本、部署形态、许可证、兼容性、定价模式、采购/文档/证据 URL、核验时间和证据状态。旧模型资源表不删除且不再导出。

`sources` 通过独立 `013_source_asset_contract` migration 补齐 owner、robots/policy 状态、freshness SLO 和 adapter version。该 migration 必须兼容已经记录 012 的 SQLite 数据库；旧 Track、Actor 和默认 View 在 013 中软禁用，随后只由 DB Pulse seed 显式恢复当前目录。

证据独立性门禁接受一个 Tier 1 原始来源，或两个独立 Tier 2 来源。当前最小实现同时按 source id、规范化 owner 和可用 author 去重；owner 暂作为媒体集团/发布矩阵代理，后续新增独立 media group 实体时再迁移，聚合来源永不计入独立证据。

## 快照与公开接口

- snapshot schema 升级到 v2，固定 `datasetId = db-pulse-cn-v1`，只包含 `database-cn` 的来源、信号、事件、关联、本地化和 Scout。
- restore 在写入前校验 schema 与 datasetId；不兼容快照直接失败。
- `GET /api/public/timeline?locale=zh-CN|en` 默认中文并返回 schema v2。
- 静态导出生成 `timeline.json` 与 `timeline.en.json`，两者仅使用 allowlist DTO。

## 发布与回滚

旧来源软退役，旧 Track/Actor 禁用，旧 Event 保留但不公开。回滚可以恢复旧代码和本地数据库，不需要删除 provenance。SQLite 是唯一经过本轮验收的数据库。
