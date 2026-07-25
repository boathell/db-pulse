export const productVersion = "0.1.0";

export const capabilities = [
  {
    slug: "china-database-source-catalog",
    name: "中国数据库信源目录",
    domain: "sensing",
    status: "operational",
    maturity: 45,
    release: "0.1.0",
    evidence:
      "26 governed source records across retained products, policy, research, media, and community",
  },
  {
    slug: "database-domain-isolation",
    name: "行业领域隔离",
    domain: "governance",
    status: "operational",
    maturity: 70,
    release: "0.1.0",
    evidence:
      "database-cn filters across collection, Events, Scout, snapshots, API, and static export",
  },
  {
    slug: "bilingual-database-events",
    name: "中英双语数据库事件",
    domain: "understanding",
    status: "operational",
    maturity: 55,
    release: "0.1.0",
    evidence: "36 public database Events with mandatory English localization and source links",
  },
  {
    slug: "database-narratives",
    name: "数据库行业主线",
    domain: "intelligence",
    status: "operational",
    maturity: 50,
    release: "0.1.0",
    evidence: "six strategic lines, eight branch tracks, five stages, and four decision lenses",
  },
  {
    slug: "database-selection-cost",
    name: "数据库选型与成本",
    domain: "decision",
    status: "operational",
    maturity: 45,
    release: "0.1.0",
    evidence:
      "evidence-backed version scope, deployment, licensing, compatibility, pricing-model, and verification fields",
  },
  {
    slug: "evidence-gated-publication",
    name: "证据与双语发布门禁",
    domain: "governance",
    status: "operational",
    maturity: 65,
    release: "0.1.0",
    evidence:
      "primary-source, content-completeness, heat-support, track, and localization blockers",
  },
  {
    slug: "qualitative-outlook",
    name: "定性行业预测",
    domain: "forecasting",
    status: "operational",
    maturity: 42,
    release: "0.1.0",
    evidence:
      "futureOutlook, nextSignal, invalidation conditions, and role-specific actions remain visible",
  },
  {
    slug: "probabilistic-forecasting",
    name: "概率预测与校准",
    domain: "forecasting",
    status: "planned",
    maturity: 10,
    release: "planned",
    evidence: "probability forecasts, resolution records, and Brier scoring are not implemented",
  },
] as const;

export const roadmap = [
  {
    state: 1,
    name: "中国数据库公开基线",
    promise: "用可回链证据理解产品、技术、政策与采用变化。",
    status: "operational",
    milestones: ["8 个核心生态", "26 条来源记录", "36 个双语 Event", "选型与成本 DTO"],
  },
  {
    state: 2,
    name: "连续观测与独立验证",
    promise: "让更多 shadow 来源通过真实运行晋级，并补强社区和生产证据。",
    status: "in-progress",
    milestones: ["来源契约覆盖", "真实健康窗口", "独立生产案例", "价格新鲜度"],
  },
  {
    state: 3,
    name: "预测校准",
    promise: "把下一信号升级为可结算、可复盘的概率预测。",
    status: "planned",
    milestones: ["预测对象", "结算规则", "Brier Score", "角色偏好校准"],
  },
] as const;

export const releases: Array<{
  status: "unreleased" | "released";
  version: string;
  date: string;
  name: string;
  summary: string;
  capabilities: string[];
  changes: string[];
  nameEn?: string;
  summaryEn?: string;
  capabilitiesEn?: string[];
  changesEn?: string[];
}> = [
  {
    status: "unreleased",
    version: "0.1.0",
    date: "",
    name: "DB Pulse Initial Baseline",
    nameEn: "DB Pulse Initial Baseline",
    summary: "将产品转型为中国数据库行业认知与决策系统；0.1.0 在正式发布前保持开发中状态。",
    summaryEn:
      "The product is becoming a China database industry intelligence and decision system. Version 0.1.0 remains in development until an explicit release.",
    capabilities: [
      "中国数据库行业领域隔离",
      "8 个当前跟踪的核心数据库生态",
      "36 个中英双语 Event",
      "数据库选型与成本模型",
      "六条行业主线与四类决策角色",
    ],
    capabilitiesEn: [
      "China database industry domain isolation",
      "8 retained core database ecosystems",
      "36 bilingual Events",
      "Database selection and cost model",
      "Six industry lines and four decision roles",
    ],
    changes: [
      "品牌、仓库、站点和版本重置为 DB Pulse 0.1.0",
      "公开数据集切换为 db-pulse-cn-v1，旧 AI 数据只保留内部 provenance",
      "新增事件英文发布门禁、双语 timeline 和数据库资源 DTO",
      "选型与成本资源卡增加产品版本口径并回链发布证据",
      "六条数据库主线使用行业词表匹配观察源池",
      "管理台选型与成本工作流切换到数据库产品字段",
      "管理台支持直接维护产品版本口径，定价与证据状态保持只读",
      "角色按厂商、开源项目、机构、政策主体与专家观察入口分类，分开表达收录与有效观测状态",
      "英文 Changelog 提供完整的 0.1.0 能力和变更说明",
      "对齐中英文 canonical、hreflang、sitemap 与 robots，并禁止索引 404 页面",
      "Pages、每日刷新与来源审计在每次静态导出后执行隐私扫描",
      "热点取消跨地区硬门槛，但继续要求真实独立来源与平台宽度",
      "按关注范围软退役 10 个数据库生态和 4 条辅助来源；保留历史 provenance，不再进入当前观察目录",
      "GreptimeDB 官方微信公众号作为受限 shadow 来源收录，不自动抓取微信正文",
      "庄晓丹“此间山林”公众号作为受限专家来源收录，与 Greptime 官方号共享证据所有者",
      "概率预测与 Brier Score 保持 planned，不描述为已实现能力",
    ],
    changesEn: [
      "Reset the brand, repository, website, and version to DB Pulse 0.1.0",
      "Switch public output to db-pulse-cn-v1 while retaining legacy AI provenance internally",
      "Add bilingual publication gates, localized timelines, and database resource DTOs",
      "Add an evidence-linked product version scope to every Selection & Cost resource card",
      "Match each of the six database lines to its observation pool with database-industry terms",
      "Move the admin Selection & Cost workflow to database product fields",
      "Allow direct version-scope maintenance in the admin while keeping pricing and evidence status read-only",
      "Classify actors as vendors, open-source projects, institutions, policy bodies, or expert-observation endpoints while separating catalog presence from effective observation",
      "Provide complete 0.1.0 capability and change notes on the English Changelog",
      "Align bilingual canonical, hreflang, sitemap, and robots metadata while keeping 404 pages out of search indexes",
      "Run the static privacy gate after every Pages, daily-refresh, and source-audit export",
      "Remove the cross-region heat requirement while retaining measured independent-source and platform-width gates",
      "Soft-retire 10 database ecosystems and four supporting sources from the focus scope while retaining historical provenance",
      "Catalog the official GreptimeDB WeChat account as a restricted shadow source without automated article-body collection",
      "Catalog Zhuang Xiaodan's Cijian Shanlin WeChat account as a restricted expert source that shares Greptime's evidence owner",
      "Keep probabilistic forecasts and Brier scoring planned rather than describing them as implemented",
    ],
  },
];
