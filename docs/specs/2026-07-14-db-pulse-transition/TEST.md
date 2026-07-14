# 测试与验收

- migration：旧行默认为 `ai-industry`；新表、索引和默认值正确；fresh SQLite 与已应用 012 的 SQLite 均能升级至 013，重复迁移幂等。
- source asset：48 个来源均持久化 owner、robots/policy、freshness SLO 与 adapter version，并进入 snapshot、管理 API、公开来源 DTO 与来源健康报告。
- domain：公开 API、公开 Signal、Scout、来源列表和 snapshot 仅包含 `database-cn`。
- localization：英文缺字段时 readiness 阻止发布；中英文 timeline 与事件详情内容对应。
- snapshot：v2 包含 datasetId 和本地化；v1 或错误 datasetId 恢复失败。
- catalog：48 条首批来源唯一、18 个生态有 Tier 1 官方入口、默认 draft/shadow；不少于 36 个 Event 全部绑定来源和英文翻译。
- scoring：国内热点不要求跨地区，但仍要求热度、置信度、独立来源和平台宽度。
- resource：公开 DTO 不再出现模型 token 价格字段，且所有证据 URL 为 HTTP(S)。
- resource：admin 可更新 version note，旧 012 数据库升级后 seed/export 不出现缺列错误。
- static：中英全部路由、筛选、搜索、抽屉、移动端、主题和资源页通过 smoke；产物不含旧 AI slug、私有字段、原始 payload、token 或本机路径。
- metadata：包名、0.1.0、仓库 URL、Pages URL、canonical、sitemap 和 GitHub 链接一致。
- commands：`npm ci`、`npm run check`、`npm run build`、snapshot/source-health 重建和隐私扫描通过。
