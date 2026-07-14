# DB Pulse

> DB Pulse 是面向 CEO、DBA、数据架构师和数据库从业者的中国数据库行业认知与决策系统，把官方发布、产品文档、论文、资本动作、政策变化与社区信号收敛为可验证事件、战略判断和下一步行动。

[English](README.md) · [打开产品](https://boathell.github.io/db-pulse/) · [Changelog](CHANGELOG.md) · [来源政策](docs/SOURCES.md)

## 产品能力

- 以 Event 作为唯一公开事实节点，保留原始证据回链；
- 沿内核架构、分布式与云、实时分析与多模、稳定运维与成本、商业落地、政策标准六条主线形成长期判断；
- 为 CEO、DBA、数据架构师和数据库从业者提供不同决策镜头；
- 在“选型与成本”中展示部署、许可、兼容性、定价口径和核验时间，不生成无证据排名；
- 用来源生命周期、健康检查、证据门禁和隐私安全快照支持持续运营；
- 用 Scout 把已公开事件转成可验证的最小实验和产物建议。

## 首批中国生态

0.1.0 覆盖达梦、人大金仓、GBase、GoldenDB、OceanBase、TiDB、openGauss、GaussDB、PolarDB、TDSQL、Vastbase、SequoiaDB、MatrixOne、Apache Doris、StarRocks、TDengine、NebulaGraph 与 Milvus。

首期不建立海外数据库独立主线；海外产品只可作为国内事件的比较证据。

## 证据边界

- 重大事实至少需要一个 Tier 1 一手来源，或两个相互独立的 Tier 2 来源；
- 未取得真实传播证据的历史事件热度为 0；
- “已收录”不等于“已有效观测”；
- 事实、推断、观点、预测和机会假设分开表达；
- 静态站只使用 allowlist DTO，不导出原始 payload、数据库、token、本机路径或管理字段。

## 架构

```text
Source registry -> SourceAdapter -> Signal -> 去重 / 聚类
                -> Event 证据门禁 -> Track / Actor / Scout
                -> 隐私安全静态导出 -> GitHub Pages
```

技术栈为 TypeScript、Node.js、Fastify、Kysely 与 SQLite。SQLite 是零配置并完成验证的默认数据库；没有真实 MySQL 集成证据前不宣称兼容。

## 本地运行

```bash
git clone https://github.com/boathell/db-pulse.git
cd db-pulse
npm ci
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

提交前执行：

```bash
npm run check
npm run build
```

为迁移并保留现有 provenance，默认 SQLite 文件名暂时保持 `var/agent-pulse.db`；该文件永不进入公开导出。

## 版本状态

包与产品版本重置为 `0.1.0`。在显式执行正式发布前，网站 Changelog 将其标记为“开发中”，仓库变化记录在 `[Unreleased]`。

## 许可与责任

[MIT License](LICENSE) 适用于源代码和仓库原创文档。第三方发布说明、文章、论文、商标与 Feed 的权利归原权利人。DB Pulse 只提供研究与决策辅助，不构成采购、投资、法律或财务建议。详见[版权、来源与责任边界](docs/LEGAL.md)和[第三方声明](THIRD_PARTY_NOTICES.md)。
