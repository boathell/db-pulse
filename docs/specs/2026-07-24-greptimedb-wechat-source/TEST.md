# 测试方案

- 目录总数为 50，两条 Greptime 微信来源的 Tier、角色、地域、语言、生命周期和策略字段符合规格。
- seed 将两个账号的 `socialHandles` 持久化到内部 source config，公开 `sources.json` 不包含账号 Biz ID、username 或文章 endpoint。
- 来源契约清单包含两条来源；元数据 fixture 只保存账号、署名、标题、时间、原文链接和身份核验引用，不包含正文。
- 两条来源的审计结果均为 `skipped / restricted`，并验证 fetcher 和 adapter 均未被调用。
- 独立性测试确认官方号与个人号只计一个 Greptime owner。
- 专家观察矩阵显示“庄晓丹 / Dennis Zhuang”且保持“身份观测”，不显示自动 feed 已接入。
- 全量来源审计、快照重建、`npm run check`、`npm run build`、隐私扫描和 `/sources/` 浏览器 smoke 通过。
