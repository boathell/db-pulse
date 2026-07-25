# 产品需求

## 目标

- 将 `greptimedb-wechat` 作为 Tier 1 官方数据库厂商来源纳入 DB Pulse。
- 将 `zhuang-xiaodan-wechat` 作为 Tier 3 个人专家来源纳入 DB Pulse，并完成庄晓丹与 Greptime 的身份、机构关系核验。
- 保存两个公众号的名称、微信账号标识、公开身份主页和已核验文章链接。
- 在来源页明确表达两条来源已收录但尚不能自动观测，并将庄晓丹列入身份观测中的可信专家。

## 边界

- 两条来源均保持 `disabled + shadow + restricted`。
- 未取得平台批准的稳定 API/RSS 前，不自动抓取微信页面或正文。
- 文章只用于核验来源身份，不自动成为 Signal、Event 或事实结论。
- “此间山林”文章明确属于非官方社区发布，不得表述为 Greptime 官方发布。
- 官方号与个人号共享 Greptime 证据所有者，不得计为相互独立的两份证据。
- 公开 DTO 只输出既有 allowlist 字段，不输出文章 endpoint、Biz ID 或内部身份配置。
