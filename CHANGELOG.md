# Changelog

所有值得用户感知的 DB Pulse 变化都会记录在这里。版本遵循语义化版本；只有具有代码、测试或运行证据的能力才会进入正式发布。

## [Unreleased]

### Changed

- 产品从 AI 行业情报系统转型为面向 CEO、DBA、数据架构师和数据库从业者的中国数据库行业认知与决策系统。
- 品牌、包、仓库和公开站点重置为 DB Pulse 0.1.0、`boathell/db-pulse` 与 `https://boathell.github.io/db-pulse/`。
- 公开数据集升级为 `db-pulse-cn-v1`，旧 AI 行业数据保留内部 provenance，但不再进入公开 API、快照和静态页面。
- 新增 18 个核心数据库生态、48 条治理来源、36 个中英双语 Event、六条行业主线和四类决策角色。
- `/resources/` 改为“选型与成本”，公开产品版本口径、部署、许可、兼容性、定价口径、证据和核验时间，不生成产品排名。
- 六条数据库主线使用内核、分布式、湖仓多模、稳定运维、商业落地和政策标准词表匹配观察源池。
- 管理台“选型与成本”工作流切换到数据库产品、引擎、部署、定价与证据状态字段。
- 管理台支持直接维护产品版本口径；定价与证据状态继续作为只读核验信息。
- 角色页按厂商、开源项目、机构、政策主体和专家观察入口分类，并分开表达“已收录”与“已有效观测”；来源页不把社区包装成个人专家。
- 英文 Changelog 提供完整的 0.1.0 能力和变更说明。
- 中英文页面的 canonical、hreflang、sitemap 与 robots 保持一致，404 页面明确禁止索引。
- Pages、每日刷新和来源审计在每次静态导出后执行隐私扫描，阻止旧 AI 页面、管理数据、凭据与本机路径进入公开产物。
- 热点取消跨地区硬门槛，但仍要求真实热度、置信度、独立来源和平台宽度。
- 概率预测和 Brier Score 保持 planned；当前继续提供定性 `futureOutlook` 与 `nextSignal`。

### Verification

- 正式发布前必须通过 `npm run check`、`npm run build`、snapshot/source-health 重建、隐私扫描和中英文关键页面 smoke。

[Unreleased]: https://github.com/boathell/db-pulse/compare/v0.1.0...HEAD
