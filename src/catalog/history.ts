export interface EventLocalizationSeed {
  title: string;
  fact: string;
  summary: string;
  technical: string;
  industry: string;
  future: string;
  business: string;
}

export interface CuratedEventSeed {
  slug: string;
  title: string;
  fact: string;
  summary: string;
  technical: string;
  industry: string;
  future: string;
  business: string;
  category: string;
  company: string;
  keywords: readonly string[];
  scores: readonly [confidence: number, heat: number, impact: number, value: number];
  date: string;
  source: string;
  url: string;
  tracks: readonly string[];
  actors: readonly string[];
  en?: EventLocalizationSeed;
  evidence?: readonly { source: string; url: string; title: string }[];
}

interface EcosystemSeed {
  slug: string;
  company: string;
  product: string;
  englishProduct?: string;
  source: string;
  url: string;
  actor: string;
  type: string;
  technical: string;
  decision: string;
  track: string;
  branch: string;
}

const ecosystemSeeds: EcosystemSeed[] = [
  {
    slug: "dameng",
    company: "武汉达梦",
    product: "达梦数据库",
    englishProduct: "Dameng Database",
    source: "dameng-official",
    url: "https://www.dameng.com/",
    actor: "dameng",
    type: "国产关系型数据库",
    technical: "集中式数据库、共享存储与分布式产品形成面向关键系统的产品组合",
    decision: "关注关键行业迁移工具、兼容性验证、容灾架构和长期服务能力",
    track: "kernel-architecture",
    branch: "private-xinchuang",
  },
  {
    slug: "kingbase",
    company: "人大金仓",
    product: "KingbaseES",
    source: "kingbase-official",
    url: "https://www.kingbase.com.cn/",
    actor: "kingbase",
    type: "国产关系型数据库",
    technical: "围绕事务处理、兼容迁移、高可用和工具体系持续建设",
    decision: "把应用兼容、迁移停机窗口、运维工具和服务覆盖纳入同一验收清单",
    track: "reliability-security-ops-cost",
    branch: "private-xinchuang",
  },
  {
    slug: "gbase",
    company: "南大通用",
    product: "GBase",
    source: "gbase-official",
    url: "https://www.gbase.cn/",
    actor: "gbase",
    type: "国产数据库产品族",
    technical: "产品覆盖事务、分析与分布式数据处理等工作负载",
    decision: "按具体引擎核对事务一致性、SQL 兼容、扩缩容和运维边界，避免只按品牌选型",
    track: "kernel-architecture",
    branch: "olap-htap",
  },
  {
    slug: "goldendb",
    company: "金篆信科",
    product: "GoldenDB",
    source: "goldendb-official",
    url: "https://www.goldendb.com/",
    actor: "goldendb",
    type: "金融级分布式数据库",
    technical: "以分布式事务、高可用和金融核心系统适配为主要产品方向",
    decision: "优先核验同城多活、容灾切换、批量窗口和核心账务一致性证据",
    track: "distributed-cloud",
    branch: "critical-industries",
  },
  {
    slug: "oceanbase",
    company: "OceanBase",
    product: "OceanBase",
    source: "oceanbase-official",
    url: "https://www.oceanbase.com/",
    actor: "oceanbase",
    type: "分布式关系型数据库",
    technical: "分布式事务、在线扩展与 HTAP 能力在同一内核路线中演进",
    decision: "使用真实业务峰值、故障恢复和运维人力验证扩展收益，而不是只比较基准峰值",
    track: "distributed-cloud",
    branch: "olap-htap",
  },
  {
    slug: "tidb",
    company: "PingCAP",
    product: "TiDB",
    source: "tidb-official",
    url: "https://docs.pingcap.com/tidb/stable/release-notes/",
    actor: "tidb",
    type: "开源分布式 SQL 数据库",
    technical: "计算与存储扩展、HTAP 和云托管构成主要技术与交付路径",
    decision: "评估分布式事务延迟、热点、统计信息、升级兼容与云上成本曲线",
    track: "distributed-cloud",
    branch: "open-source",
  },
  {
    slug: "opengauss",
    company: "openGauss 社区",
    product: "openGauss",
    source: "opengauss-official",
    url: "https://opengauss.org/zh/news/",
    actor: "opengauss",
    type: "开源关系型数据库",
    technical: "围绕内核、高可用、安全和伙伴发行版形成社区协作",
    decision: "区分社区能力、商业发行版能力和交付服务责任，验证升级与生态兼容",
    track: "china-ecosystem-policy",
    branch: "open-source",
  },
  {
    slug: "gaussdb",
    company: "华为云",
    product: "GaussDB",
    source: "gaussdb-official",
    url: "https://www.huaweicloud.com/product/gaussdb.html",
    actor: "gaussdb",
    type: "云原生分布式数据库",
    technical: "面向金融与政企工作负载组合分布式架构、容灾和云服务能力",
    decision: "同时核验云服务 SLA、跨可用区成本、迁移工具与私有化交付差异",
    track: "distributed-cloud",
    branch: "cloud-managed",
  },
  {
    slug: "polardb",
    company: "阿里云",
    product: "PolarDB",
    source: "polardb-official",
    url: "https://help.aliyun.com/zh/polardb/polardb-for-xscale/release-notes-11",
    actor: "polardb",
    type: "云原生关系型数据库",
    technical: "共享存储、计算存储分离和 Serverless 构成弹性数据库路线",
    decision: "用负载潮汐、冷启动、读写扩展和云资源账单验证弹性价值",
    track: "distributed-cloud",
    branch: "cloud-managed",
  },
  {
    slug: "tdsql",
    company: "腾讯云",
    product: "TDSQL",
    source: "tdsql-official",
    url: "https://cloud.tencent.com/document/product/1376/125147",
    actor: "tdsql",
    type: "云数据库产品族",
    technical: "覆盖分布式事务、云原生关系型与兼容型数据库服务",
    decision: "按产品形态分别验证分片、容灾、兼容、审计和资源计费，避免混用能力口径",
    track: "commercialization-adoption",
    branch: "cloud-managed",
  },
  {
    slug: "vastbase",
    company: "海量数据",
    product: "Vastbase",
    source: "vastbase-official",
    url: "https://www.vastdata.com.cn/",
    actor: "vastbase",
    type: "国产关系型数据库",
    technical: "围绕兼容迁移、高可用与政企交付建立产品和工具体系",
    decision: "核验目标应用的语法、驱动、存储过程和运维脚本兼容率",
    track: "reliability-security-ops-cost",
    branch: "private-xinchuang",
  },
  {
    slug: "sequoiadb",
    company: "巨杉数据库",
    product: "SequoiaDB",
    source: "sequoiadb-official",
    url: "https://www.sequoiadb.com/",
    actor: "sequoiadb",
    type: "分布式多模数据库",
    technical: "分布式存储与多模型访问用于承载结构化和非结构化数据场景",
    decision: "验证多模型接口是否共享一致治理、事务和运维能力，而不是形成新的数据孤岛",
    track: "realtime-lakehouse-multimodel",
    branch: "multimodel",
  },
  {
    slug: "matrixone",
    company: "矩阵起源",
    product: "MatrixOne",
    source: "matrixone-official",
    url: "https://docs.matrixorigin.cn/en/v26.3.0.13/MatrixOne/Release-Notes/v22.0.6.0/",
    actor: "matrixone",
    type: "云原生 HTAP 数据库",
    technical: "以统一数据引擎、实时分析和云原生部署连接交易与分析场景",
    decision: "重点验证混合负载隔离、数据新鲜度、资源弹性和生态工具兼容",
    track: "realtime-lakehouse-multimodel",
    branch: "olap-htap",
  },
  {
    slug: "apache-doris",
    company: "Apache Doris 社区",
    product: "Apache Doris",
    source: "doris-official",
    url: "https://doris.apache.org/zh-CN/releases/all-release/",
    actor: "apache-doris",
    type: "实时分析数据库",
    technical: "围绕高并发分析、湖仓查询、实时写入和物化视图持续演进",
    decision: "用查询并发、数据更新、湖上查询和运维复杂度验证分析平台整合收益",
    track: "realtime-lakehouse-multimodel",
    branch: "lakehouse-realtime",
  },
  {
    slug: "starrocks",
    company: "StarRocks 社区",
    product: "StarRocks",
    source: "starrocks-official",
    url: "https://docs.starrocks.io/zh/docs/release_notes/",
    actor: "starrocks",
    type: "实时分析数据库",
    technical: "向量化执行、实时更新、物化视图和数据湖查询构成核心路线",
    decision: "比较实时更新延迟、查询稳定性、外表性能与资源治理，而非只看单查询速度",
    track: "realtime-lakehouse-multimodel",
    branch: "lakehouse-realtime",
  },
  {
    slug: "tdengine",
    company: "涛思数据",
    product: "TDengine",
    source: "tdengine-official",
    url: "https://docs.tdengine.com/release-history/",
    actor: "tdengine",
    type: "时序数据库",
    technical: "面向物联网与工业数据优化写入、压缩、订阅和流处理",
    decision: "用设备基数、乱序写入、保留策略、压缩率与边缘部署验证总成本",
    track: "realtime-lakehouse-multimodel",
    branch: "multimodel",
  },
  {
    slug: "nebulagraph",
    company: "悦数科技",
    product: "NebulaGraph",
    source: "nebulagraph-official",
    url: "https://docs.nebula-graph.com.cn/3.8.0/20.appendix/release-notes/",
    actor: "nebulagraph",
    type: "分布式图数据库",
    technical: "图存储、图查询与分布式扩展服务于关系密集型数据场景",
    decision: "验证图模型是否真实降低查询复杂度，并核对一致性、导入、备份与生态成本",
    track: "realtime-lakehouse-multimodel",
    branch: "multimodel",
  },
  {
    slug: "milvus",
    company: "Zilliz / Milvus 社区",
    product: "Milvus",
    source: "milvus-official",
    url: "https://milvus.io/docs/zh/release_notes.md",
    actor: "milvus",
    type: "向量数据库",
    technical: "向量索引、混合检索、分布式扩展和云服务支撑检索型 AI 数据工作负载",
    decision: "关注召回率、过滤性能、索引构建、数据更新和资源成本，避免用向量规模替代业务效果",
    track: "realtime-lakehouse-multimodel",
    branch: "multimodel",
  },
];

function ecosystemEvent(seed: EcosystemSeed, index: number): CuratedEventSeed {
  const date = new Date(Date.UTC(2026, 6, 14, 1, index)).toISOString();
  const englishProduct = seed.englishProduct ?? seed.product;
  return {
    slug: `${seed.slug}-official-ecosystem-baseline`,
    title: `${seed.product}：建立可核验的官方产品与技术演进基线`,
    fact: `DB Pulse 已将${seed.product}官方产品页、文档或发布记录登记为 Tier 1 证据入口；当前公开资料将其定位为${seed.type}。`,
    summary: `该节点用于建立中国数据库行业的首批可追溯产品基线。它确认官方资料入口和核心技术口径，不把目录收录等同于生产验证，也不根据厂商表述生成排名。`,
    technical: seed.technical,
    industry: `${seed.product}进入同类产品的统一证据框架后，可以按架构、工作负载、部署方式、许可、兼容性和运维成本持续比较。`,
    future: `观察后续版本记录、真实用户案例、独立测试、兼容认证、故障恢复证据和价格口径是否持续公开。`,
    business: seed.decision,
    category: "ecosystem-baseline",
    company: seed.company,
    keywords: [seed.product, seed.type, "中国数据库", "官方证据"],
    scores: [94, 0, 82, 84],
    date,
    source: seed.source,
    url: seed.url,
    tracks: [seed.track, seed.branch],
    actors: [seed.actor],
    en: {
      title: `${englishProduct}: an official, verifiable ecosystem baseline`,
      fact: `DB Pulse has registered an official ${englishProduct} product, documentation, or release page as Tier 1 evidence for this China database ecosystem baseline.`,
      summary: `This node establishes a traceable starting point for the product ecosystem. Catalog inclusion is not presented as production validation, and vendor statements are not converted into rankings.`,
      technical: `${englishProduct}'s official material should be evaluated across architecture, workload semantics, deployment, compatibility, resilience, and operations.`,
      industry: `${englishProduct} can now be followed through a consistent evidence frame covering architecture, workload, deployment, licensing, compatibility, and operating cost.`,
      future: `Watch for version records, production references, independent tests, compatibility certification, recovery evidence, and verifiable pricing.`,
      business: `For ${englishProduct}, validate the target workload, compatibility, failure recovery, operating model, and long-term service cost before a production commitment.`,
    },
  };
}

type Theme = Omit<CuratedEventSeed, "scores" | "en"> & {
  enTitle: string;
  enFact: string;
  enSummary: string;
};

const theme = (value: Theme): CuratedEventSeed => ({
  ...value,
  scores: [94, 0, 88, 86],
  en: {
    title: value.enTitle,
    fact: value.enFact,
    summary: value.enSummary,
    technical:
      "The evidence is evaluated through architecture, workload boundaries, compatibility, reliability, and operating cost.",
    industry:
      "The shift changes how Chinese database products are compared, adopted, and governed without turning vendor claims into independent proof.",
    future:
      "Watch for reproducible production evidence, independent validation, stable release records, and transparent commercial terms.",
    business:
      "Build a workload-specific evidence checklist and validate failure recovery and total cost before a production commitment.",
  },
});

const architectureEvents: CuratedEventSeed[] = [
  theme({
    slug: "distributed-sql-enters-mainstream-evaluation",
    title: "分布式 SQL 从扩展能力进入核心系统选型清单",
    fact: "OceanBase、TiDB、GoldenDB 等国内生态持续公开分布式事务、弹性扩展与高可用资料，分布式 SQL 已成为核心系统选型中的独立路线。",
    summary: "真正的比较重点从节点数量转向事务语义、故障恢复、热点治理、在线扩缩容和运维复杂度。",
    technical: "跨节点事务、复制协议和资源调度必须在真实故障与峰值负载下联合验证。",
    industry: "国产数据库竞争由单机兼容扩展到分布式核心能力与交付证据。",
    future: "观察跨可用区延迟、故障切换 RTO/RPO、扩容扰动与运维人力。",
    business: "架构师应先判断业务是否真的需要分布式，再用黄金负载和故障演练验证。",
    category: "architecture",
    company: "中国分布式数据库生态",
    keywords: ["分布式 SQL", "事务", "高可用"],
    date: "2022-10-01T00:00:00.000Z",
    source: "oceanbase-official",
    url: "https://www.oceanbase.com/blog",
    tracks: ["distributed-cloud", "oltp"],
    actors: ["oceanbase", "tidb", "goldendb"],
    evidence: [
      {
        source: "tidb-official",
        url: "https://docs.pingcap.com/tidb/stable/release-notes/",
        title: "TiDB release notes",
      },
    ],
    enTitle: "Distributed SQL enters the core-system evaluation set",
    enFact:
      "Chinese ecosystems including OceanBase, TiDB, and GoldenDB maintain official material on distributed transactions, scaling, and availability.",
    enSummary:
      "The useful comparison moves from node counts to transaction semantics, failure recovery, hotspot control, online scaling, and operating complexity.",
  }),
  theme({
    slug: "cloud-native-separation-becomes-database-design-axis",
    title: "计算存储分离成为云数据库的核心设计轴",
    fact: "PolarDB、TiDB 与 MatrixOne 等官方资料持续围绕计算存储分离、弹性和云部署演进。",
    summary: "云原生数据库的价值需要同时由弹性速度、资源利用率、故障域和账单结构证明。",
    technical: "共享存储或解耦架构改变缓存、网络、恢复和资源隔离路径。",
    industry: "数据库产品与云基础设施的边界进一步融合。",
    future: "观察冷启动、网络放大、存储吞吐、跨区容灾和稳定成本。",
    business: "用业务潮汐和故障演练比较长期账单，不以峰值扩容演示代替 TCO。",
    category: "architecture",
    company: "中国云数据库生态",
    keywords: ["云原生", "计算存储分离", "弹性"],
    date: "2023-04-01T00:00:00.000Z",
    source: "polardb-official",
    url: "https://help.aliyun.com/zh/polardb/",
    tracks: ["distributed-cloud", "cloud-managed"],
    actors: ["polardb", "tidb", "matrixone"],
    enTitle: "Compute-storage separation becomes a primary database design axis",
    enFact:
      "Official PolarDB, TiDB, and MatrixOne material continues to develop compute-storage separation, elasticity, and cloud deployment.",
    enSummary:
      "Cloud-native value must be demonstrated through elasticity, utilization, fault domains, and billing behavior together.",
  }),
  theme({
    slug: "htap-moves-from-label-to-workload-isolation",
    title: "HTAP 竞争从产品标签转向混合负载隔离证据",
    fact: "OceanBase、TiDB、MatrixOne 等产品公开把事务与分析能力放入同一产品路线。",
    summary:
      "HTAP 是否成立取决于数据新鲜度、资源隔离、查询稳定性和运维复杂度，而非同时支持两类 SQL。",
    technical: "复制链路、列式副本、优化器和资源组共同决定混合负载体验。",
    industry: "事务与分析平台的采购边界开始重估。",
    future: "观察真实混部比例、分析延迟、写入影响和故障恢复。",
    business: "先选择一个需要新鲜数据的分析流程做隔离实验，再决定是否合并平台。",
    category: "architecture",
    company: "中国 HTAP 数据库生态",
    keywords: ["HTAP", "资源隔离", "实时分析"],
    date: "2023-10-01T00:00:00.000Z",
    source: "tidb-official",
    url: "https://docs.pingcap.com/tidb/stable/release-notes/",
    tracks: ["realtime-lakehouse-multimodel", "olap-htap"],
    actors: ["oceanbase", "tidb", "matrixone"],
    enTitle: "HTAP competition moves from labels to workload-isolation evidence",
    enFact:
      "OceanBase, TiDB, and MatrixOne publicly place transactional and analytical capabilities on a shared product path.",
    enSummary:
      "HTAP depends on freshness, resource isolation, query stability, and operational complexity—not merely supporting two SQL workload types.",
  }),
  theme({
    slug: "realtime-analytics-connects-to-lakehouse",
    title: "实时分析数据库开始向湖仓统一查询扩展",
    fact: "Apache Doris 与 StarRocks 的官方发布资料持续覆盖实时写入、物化视图和数据湖查询。",
    summary: "分析平台整合的判断重点转向湖上性能、元数据一致性、更新延迟与资源治理。",
    technical: "查询优化、缓存、外表和增量更新共同决定湖仓体验。",
    industry: "专用数仓、实时 OLAP 与数据湖的边界继续重组。",
    future: "观察开放表格式兼容、复杂查询稳定性与总资源成本。",
    business: "用代表性数据湖表和并发查询验证整合收益，保留回退路径。",
    category: "architecture",
    company: "中国实时分析数据库生态",
    keywords: ["实时分析", "湖仓", "OLAP"],
    date: "2024-06-01T00:00:00.000Z",
    source: "doris-official",
    url: "https://doris.apache.org/zh-CN/releases/all-release/",
    tracks: ["realtime-lakehouse-multimodel", "lakehouse-realtime"],
    actors: ["apache-doris", "starrocks"],
    evidence: [
      {
        source: "starrocks-official",
        url: "https://docs.starrocks.io/zh/docs/release_notes/",
        title: "StarRocks release notes",
      },
    ],
    enTitle: "Real-time analytical databases expand toward lakehouse queries",
    enFact:
      "Apache Doris and StarRocks release material continues to cover real-time ingestion, materialized views, and data-lake queries.",
    enSummary:
      "Platform consolidation now depends on lake performance, metadata consistency, update latency, and resource governance.",
  }),
  theme({
    slug: "specialized-databases-enter-composable-architecture",
    title: "图、时序与向量数据库进入可组合数据架构",
    fact: "NebulaGraph、TDengine 与 Milvus 分别持续公开图、时序和向量工作负载的产品演进。",
    summary: "专用数据库的价值不在品类新颖，而在能否降低特定查询复杂度并接入一致的数据治理。",
    technical: "数据同步、事务边界、备份恢复和可观测性决定多引擎架构是否可控。",
    industry: "多模与专用引擎同时发展，平台团队需要避免新的数据孤岛。",
    future: "观察混合检索、跨引擎同步、统一权限和运维工具。",
    business: "只在通用数据库无法满足可量化 SLA 时引入专用引擎。",
    category: "architecture",
    company: "中国专用数据库生态",
    keywords: ["图数据库", "时序数据库", "向量数据库"],
    date: "2024-12-01T00:00:00.000Z",
    source: "milvus-official",
    url: "https://milvus.io/docs/zh/release_notes.md",
    tracks: ["realtime-lakehouse-multimodel", "multimodel"],
    actors: ["milvus", "nebulagraph", "tdengine"],
    enTitle: "Graph, time-series, and vector databases enter composable data architecture",
    enFact:
      "NebulaGraph, TDengine, and Milvus continue to publish product evolution for graph, time-series, and vector workloads.",
    enSummary:
      "A specialized engine is valuable only when it reduces measurable workload complexity and fits shared governance.",
  }),
  theme({
    slug: "database-ai-features-require-operational-proof",
    title: "数据库 AI 能力进入查询与运维的可验证阶段",
    fact: "国内数据库生态开始把向量检索、智能诊断或自然语言辅助纳入产品资料，但这些能力仍需绑定数据库工作负载与证据。",
    summary:
      "DB Pulse 只跟踪直接改变查询、数据管理或运维结果的 AI 能力，不把泛 AI 宣传作为数据库事件。",
    technical: "评估应覆盖准确率、可解释性、回退机制、权限边界和资源开销。",
    industry: "AI 叙事正在被重新约束为数据库可测量能力。",
    future: "观察自动调优的回归率、向量混合查询成本与生产采用。",
    business: "为 AI 辅助功能设置只读、建议和自动执行的分级权限。",
    category: "architecture",
    company: "中国数据库生态",
    keywords: ["AI for Database", "向量检索", "智能运维"],
    date: "2026-03-01T00:00:00.000Z",
    source: "milvus-official",
    url: "https://milvus.io/docs/zh/release_notes.md",
    tracks: ["kernel-architecture", "reliability-security-ops-cost"],
    actors: ["milvus", "oceanbase", "tidb"],
    enTitle: "Database AI features enter a verifiable query and operations phase",
    enFact:
      "Chinese database ecosystems increasingly document vector search, diagnosis, and natural-language assistance, but each claim still requires workload evidence.",
    enSummary:
      "DB Pulse tracks AI only when it directly changes database query, management, or operations outcomes.",
  }),
];

const policyEvents: CuratedEventSeed[] = [
  theme({
    slug: "data-security-law-raises-database-control-baseline",
    title: "数据安全制度把数据库控制面提升为治理基础",
    fact: "中国数据安全、个人信息保护和网络安全制度持续要求数据分类分级、访问控制、审计和跨境治理。",
    summary: "数据库选型不再只比较性能，权限、审计、加密、脱敏、备份和责任边界成为硬门槛。",
    technical: "治理要求必须落到账号、行列权限、日志、密钥和恢复流程。",
    industry: "安全能力从附加模块转为采购与验收基础。",
    future: "观察数据库安全标准、审计留存和行业实施细则。",
    business: "DBA 与安全团队应共用一份可测试的控制清单。",
    category: "policy",
    company: "中国数据治理体系",
    keywords: ["数据安全", "审计", "访问控制"],
    date: "2022-09-01T00:00:00.000Z",
    source: "tc260-standard",
    url: "https://www.tc260.org.cn/portal/article/2/20250915154109",
    tracks: ["china-ecosystem-policy", "reliability-security-ops-cost"],
    actors: ["tc260"],
    enTitle: "Data-security rules raise the database control-plane baseline",
    enFact:
      "China's data-security, personal-information, and cybersecurity rules require classification, access control, auditability, and governed data movement.",
    enSummary:
      "Database evaluation now includes permissions, audit, encryption, masking, backup, and accountability alongside performance.",
  }),
  theme({
    slug: "xinchuang-expands-compatibility-evidence-demand",
    title: "信创落地扩大数据库兼容迁移的证据需求",
    fact: "国产化替代项目推动数据库、操作系统、中间件、芯片和应用共同进入兼容验证。",
    summary: "单项认证不能代替真实业务迁移；语法、驱动、存储过程、工具和故障恢复需要整体测试。",
    technical: "兼容性是一条端到端工程链，不是单一 SQL 百分比。",
    industry: "厂商竞争从产品可用扩展到迁移工具、伙伴和交付体系。",
    future: "观察规模化迁移成功率、停机窗口和回退案例。",
    business: "建立应用分层与双轨回退计划，先迁移可观测、可回滚的系统。",
    category: "policy",
    company: "中国信息技术应用创新生态",
    keywords: ["信创", "兼容迁移", "国产数据库"],
    date: "2023-03-01T00:00:00.000Z",
    source: "miit-policy",
    url: "https://www.miit.gov.cn/zwgk/zcwj/",
    tracks: ["china-ecosystem-policy", "private-xinchuang"],
    actors: ["dameng", "kingbase", "opengauss"],
    enTitle: "Xinchuang adoption expands demand for compatibility evidence",
    enFact:
      "Domestic substitution programs require databases, operating systems, middleware, processors, and applications to pass joint compatibility validation.",
    enSummary:
      "A certification badge cannot replace end-to-end migration tests for SQL, drivers, procedures, tools, recovery, and rollback.",
  }),
  theme({
    slug: "public-data-policy-strengthens-data-infrastructure",
    title: "公共数据政策强化数据基础设施建设需求",
    fact: "国家数据局持续发布公共数据开发利用和数据基础设施相关政策信息。",
    summary: "数据库与数据平台需要在授权运营、目录、质量、访问控制和审计之间形成闭环。",
    technical: "数据基础设施需要统一元数据、权限和可追溯交换机制。",
    industry: "政务数据项目从单库建设转向跨域治理与持续运营。",
    future: "观察授权运营规则、基础设施技术路线和地方实施。",
    business: "CEO 应把治理责任、数据质量和长期运营预算前置。",
    category: "policy",
    company: "国家数据局",
    keywords: ["公共数据", "数据基础设施", "授权运营"],
    date: "2024-10-01T00:00:00.000Z",
    source: "nda-policy",
    url: "https://www.nda.gov.cn/sjj/ywpd/szkjyjcss/0110/20250106095112713400492_pc.html",
    tracks: ["china-ecosystem-policy", "critical-industries"],
    actors: ["nda"],
    enTitle: "Public-data policy strengthens demand for governed data infrastructure",
    enFact:
      "China's National Data Administration continues to publish policy on public-data use and data infrastructure.",
    enSummary:
      "Database and data-platform programs must connect authorization, catalogs, quality, access control, and auditability.",
  }),
  theme({
    slug: "database-benchmark-governance-matures",
    title: "数据库评测从性能榜单转向能力与场景治理",
    fact: "中国信通院等机构持续推动数据库、云数据库与相关能力的研究和评测。",
    summary: "公开评测有助于建立共同语言，但不能直接替代用户负载、故障演练和长期成本验证。",
    technical: "评测需要同时覆盖正确性、稳定性、可恢复性和可运维性。",
    industry: "采购方开始要求可重复、可解释的测试证据。",
    future: "观察评测方法、样本规模、复现材料和生产相关性。",
    business: "将第三方评测用于缩小候选集，再运行自己的黄金负载。",
    category: "policy",
    company: "中国信通院",
    keywords: ["数据库评测", "基准测试", "采购"],
    date: "2025-01-01T00:00:00.000Z",
    source: "caict-database",
    url: "https://www.caict.ac.cn/kxyj/qwfb/bps/",
    tracks: ["china-ecosystem-policy", "commercialization-adoption"],
    actors: ["caict-database"],
    enTitle: "Database benchmarking matures from scoreboards to scenario governance",
    enFact:
      "CAICT and other Chinese institutions continue research and evaluation work for databases and cloud databases.",
    enSummary:
      "Public evaluation creates shared language but cannot replace workload tests, failure drills, and long-term cost evidence.",
  }),
  theme({
    slug: "database-security-standards-enter-procurement",
    title: "数据库安全标准进入采购与持续审计流程",
    fact: "TC260 等标准化渠道持续发布和征求数据安全、个人信息与系统安全相关标准意见。",
    summary: "数据库安全能力需要通过配置基线、审计证据和定期复核持续成立。",
    technical: "权限、密钥、日志、备份和漏洞响应必须形成可审计链。",
    industry: "安全从一次性验收转为全生命周期责任。",
    future: "观察标准落地、行业细则和供应链审计。",
    business: "把数据库安全控制纳入版本升级和变更审批。",
    category: "policy",
    company: "TC260",
    keywords: ["数据库安全", "标准", "审计"],
    date: "2025-09-01T00:00:00.000Z",
    source: "tc260-standard",
    url: "https://www.tc260.org.cn/portal/article/2/20250915154109",
    tracks: ["china-ecosystem-policy", "reliability-security-ops-cost"],
    actors: ["tc260"],
    enTitle: "Database security standards enter procurement and continuous audit",
    enFact:
      "TC260 and related standards channels continue to publish and solicit input on data, personal-information, and system-security standards.",
    enSummary:
      "Database security must remain verifiable through configuration baselines, audit evidence, and recurring review.",
  }),
  theme({
    slug: "dameng-listing-marks-database-capital-milestone",
    title: "达梦数据登陆科创板，数据库产业获得公开资本市场坐标",
    fact: "上海证券交易所公告确认，武汉达梦数据库股份有限公司 A 股于 2024 年 6 月 12 日在科创板上市交易，证券代码 688692。",
    summary:
      "上市把国产数据库厂商的研发投入、收入结构、客户集中度和持续经营表现带入公开披露体系，为产业观察提供了可核验的资本节点。",
    technical: "资本补充不能代替内核与交付验证，但公开披露让研发投入和商业化质量可以持续跟踪。",
    industry: "中国数据库产业从融资叙事进一步进入公开市场的连续经营与治理约束。",
    future: "观察研发投入强度、授权与服务收入结构、关键行业客户和募集资金项目进展。",
    business: "CEO 与投资负责人应把公开财报、研发投入和产品交付证据放在同一观察框架。",
    category: "capital",
    company: "达梦数据",
    keywords: ["达梦数据", "科创板", "资本市场"],
    date: "2024-06-11T00:00:00.000Z",
    source: "sse-dameng-listing",
    url: "https://www.sse.com.cn/disclosure/announcement/listing/ipo/c/c_20240611_10758581.shtml",
    tracks: ["china-ecosystem-policy", "commercialization-adoption"],
    actors: ["dameng"],
    enTitle: "Dameng's STAR Market listing creates a public capital-market milestone",
    enFact:
      "The Shanghai Stock Exchange confirmed that Wuhan Dameng Database Co., Ltd. began A-share trading on the STAR Market on June 12, 2024 under ticker 688692.",
    enSummary:
      "The listing brings R&D investment, revenue structure, customer concentration, and operating performance into continuous public disclosure for China's database industry.",
  }),
];

const adoptionEvents: CuratedEventSeed[] = [
  theme({
    slug: "financial-core-systems-drive-distributed-validation",
    title: "金融核心系统推动分布式数据库进入严苛验证",
    fact: "GoldenDB、OceanBase、GaussDB 等官方资料持续以金融级场景、分布式事务和高可用作为重要能力方向。",
    summary: "金融场景的价值不在案例数量，而在账务一致性、批量窗口、容灾演练和监管审计证据。",
    technical: "核心系统要求事务、容量、容灾和变更治理同时成立。",
    industry: "关键行业成为国产分布式数据库能力成熟的重要试验场。",
    future: "观察公开故障演练、迁移规模、长期稳定性与独立客户证据。",
    business: "用端到端业务对账和容灾切换作为采购硬门槛。",
    category: "adoption",
    company: "中国金融数据库生态",
    keywords: ["金融核心", "分布式数据库", "容灾"],
    date: "2023-08-01T00:00:00.000Z",
    source: "goldendb-official",
    url: "https://www.goldendb.com/",
    tracks: ["commercialization-adoption", "critical-industries"],
    actors: ["goldendb", "oceanbase", "gaussdb"],
    enTitle: "Financial core systems drive strict distributed-database validation",
    enFact:
      "GoldenDB, OceanBase, and GaussDB official material emphasizes financial workloads, distributed transactions, and high availability.",
    enSummary:
      "The meaningful proof is accounting consistency, batch windows, disaster-recovery drills, and auditability—not case-count marketing.",
  }),
  theme({
    slug: "open-source-database-commercialization-separates-roles",
    title: "开源数据库商业化开始明确社区、云服务与交付责任",
    fact: "TiDB、openGauss、Apache Doris、StarRocks 等生态同时存在社区版本、商业服务或云托管路径。",
    summary: "开源许可不等于零成本；升级、值守、兼容、云资源和组织能力决定长期投入。",
    technical: "社区版本与商业发行需要清晰的版本、补丁和支持边界。",
    industry: "开源成为分发与协作机制，商业价值更多来自托管、工具和服务。",
    future: "观察版本节奏、贡献者结构、商业支持和托管采用。",
    business: "在选型时明确谁负责补丁、升级、SLA 和故障升级。",
    category: "commercial",
    company: "中国开源数据库生态",
    keywords: ["开源数据库", "商业化", "云托管"],
    date: "2024-02-01T00:00:00.000Z",
    source: "tidb-releases",
    url: "https://github.com/pingcap/tidb",
    tracks: ["commercialization-adoption", "open-source"],
    actors: ["tidb", "opengauss", "apache-doris", "starrocks"],
    enTitle: "Open-source database commercialization separates community, cloud, and support roles",
    enFact:
      "TiDB, openGauss, Apache Doris, and StarRocks ecosystems combine community editions with commercial service or managed-cloud paths.",
    enSummary:
      "Open-source licensing is not zero cost; upgrades, support, compatibility, cloud resources, and team capability determine long-term investment.",
  }),
  theme({
    slug: "managed-database-procurement-shifts-to-unit-economics",
    title: "云数据库采购从规格价格转向单位工作负载经济性",
    fact: "PolarDB、TDSQL、GaussDB 等云数据库按实例、资源或弹性能力提供不同商业口径。",
    summary: "比较价格必须绑定工作负载、可用性、备份、网络和运维人力，不能只比较标价。",
    technical: "资源隔离、弹性策略和存储网络计费共同决定单位任务成本。",
    industry: "云数据库竞争从功能表扩展到可解释的成本与服务边界。",
    future: "观察公开计费口径、折扣依赖、弹性利用率和退出成本。",
    business: "建立每业务交易或每分析查询的成本基线，并进行季度回归。",
    category: "commercial",
    company: "中国云数据库生态",
    keywords: ["云数据库", "TCO", "定价"],
    date: "2024-08-01T00:00:00.000Z",
    source: "polardb-official",
    url: "https://help.aliyun.com/zh/polardb/polardb-for-xscale/release-notes-11",
    tracks: ["commercialization-adoption", "reliability-security-ops-cost", "cloud-managed"],
    actors: ["polardb", "tdsql", "gaussdb"],
    enTitle: "Managed-database procurement shifts from list prices to workload economics",
    enFact:
      "PolarDB, TDSQL, and GaussDB expose different instance, resource, and elasticity-based commercial models.",
    enSummary:
      "Price comparisons must include workload, availability, backup, networking, and operating labor—not list price alone.",
  }),
  theme({
    slug: "migration-tooling-becomes-database-product-moat",
    title: "迁移工具链成为国产数据库商业化护城河",
    fact: "达梦、人大金仓、Vastbase、openGauss 等生态持续建设兼容、迁移与运维工具。",
    summary: "数据库替换的真实成本集中在应用发现、语法改造、数据校验、双写切换和回退。",
    technical: "工具必须提供可重复扫描、差异报告、校验和可观察切换。",
    industry: "厂商竞争由内核扩展到迁移工厂和伙伴交付效率。",
    future: "观察自动化覆盖率、失败分类、停机窗口和规模化复用。",
    business: "用首批应用的迁移工时和缺陷数据校准后续预算。",
    category: "commercial",
    company: "国产关系型数据库生态",
    keywords: ["数据库迁移", "兼容性", "信创"],
    date: "2025-04-01T00:00:00.000Z",
    source: "dameng-docs",
    url: "https://eco.dameng.com/document/dm/zh-cn/start/index.html",
    tracks: ["commercialization-adoption", "private-xinchuang"],
    actors: ["dameng", "kingbase", "vastbase", "opengauss"],
    enTitle: "Migration tooling becomes a commercialization moat for domestic databases",
    enFact:
      "Dameng, Kingbase, Vastbase, and openGauss ecosystems continue to develop compatibility, migration, and operations tooling.",
    enSummary:
      "Replacement cost concentrates in discovery, SQL changes, data validation, cutover, and rollback—not license acquisition alone.",
  }),
  theme({
    slug: "database-observability-enters-platform-engineering",
    title: "数据库可观测性进入平台工程统一治理",
    fact: "DTCC 2025 公开议程把多引擎数据库运维、统一管理、故障定位、慢 SQL 与大规模监控列为实践议题；InfoQ 的 Database Mesh 实践材料也把可观测性与数据库可靠性工程纳入统一治理。",
    summary: "异构数据库增加了 DBA 平台的适配成本，也推动统一 SLO、告警和运行手册。",
    technical: "可观测模型需要保留各引擎特性，同时提供统一事件和责任边界。",
    industry: "DBA 工作从单库运维转向多引擎平台治理。",
    future: "观察标准指标、自动诊断、变更审计和跨引擎容量管理。",
    business: "先统一服务目录、SLO 和事件分级，再扩展自动化。",
    category: "commercial",
    company: "中国企业数据库平台",
    keywords: ["数据库可观测性", "DBA", "平台工程"],
    date: "2025-11-01T00:00:00.000Z",
    source: "dtcc",
    url: "https://dtcc.it168.com/yichengxiangqing.html",
    tracks: ["reliability-security-ops-cost", "commercialization-adoption"],
    actors: ["dtcc-expert-network"],
    evidence: [
      {
        source: "infoq-cn-database",
        url: "https://www.infoq.cn/article/6T0SKldyjbU2ecDcujGW",
        title: "Database Mesh 2.0 数据库治理实践",
      },
    ],
    enTitle: "Database observability enters unified platform engineering",
    enFact:
      "The DTCC 2025 agenda covers multi-engine operations, unified management, fault diagnosis, slow SQL, and large-scale monitoring, while an independent InfoQ Database Mesh practice links observability to database reliability engineering.",
    enSummary:
      "Heterogeneous databases increase platform-adapter cost while creating demand for shared SLOs, alerts, and runbooks.",
  }),
  theme({
    slug: "database-selection-requires-evidence-led-cost-model",
    title: "数据库选型进入证据与成本共同驱动阶段",
    fact: "中国信通院持续公开数据库与云数据库研究和评测材料，推动选型从单一性能数字转向场景、能力和使用边界。",
    summary:
      "第三方评测可以缩小候选范围，但部署、许可、兼容性、计费口径和证据时间仍需由采购方逐项核验。",
    technical: "选型记录应把可复现测试、官方资料、未知项和实测结果分层保存。",
    industry: "数据库选型开始从品牌与榜单转向场景化证据和长期成本共同约束。",
    future: "观察价格核验新鲜度、兼容实测、故障演练和实际 TCO。",
    business: "为每个候选产品记录证据日期、假设、实验结果和失效条件。",
    category: "commercial",
    company: "中国数据库评测生态",
    keywords: ["数据库选型", "成本", "证据"],
    date: "2026-03-01T00:30:00.000Z",
    source: "caict-database",
    url: "https://www.caict.ac.cn/kxyj/qwfb/bps/",
    tracks: ["commercialization-adoption", "reliability-security-ops-cost"],
    actors: ["caict-database"],
    enTitle: "Database selection becomes jointly driven by evidence and cost",
    enFact:
      "CAICT continues to publish database and cloud-database research and evaluation material, moving selection beyond a single performance score toward workload scenarios and capability boundaries.",
    enSummary:
      "Third-party evaluation can narrow candidates, but buyers must still verify deployment, licensing, compatibility, pricing basis, and evidence freshness.",
  }),
];

export const historicalEvents: readonly CuratedEventSeed[] = [
  ...architectureEvents,
  ...policyEvents,
  ...adoptionEvents,
  ...ecosystemSeeds.map(ecosystemEvent),
];

const stages = [
  {
    start: "2022-01-01",
    end: "2022-12-31",
    period: "2022",
    label: "架构演进",
    summary: "国产关系型、分布式与专用数据库进入可比较路线。",
    interpretation: "先确认工作负载与架构边界。",
    chinaPosition: "本土产品进入规模验证。",
    nextSignal: "公开版本、兼容和恢复证据。",
  },
  {
    start: "2023-01-01",
    end: "2024-12-31",
    period: "2023—2024",
    label: "生产验证扩展",
    summary: "分布式 SQL、HTAP、实时分析与云原生进入更多核心评估。",
    interpretation: "从功能表转向故障、混合负载、运维与总成本证据。",
    chinaPosition: "关键行业、开源生态与云服务成为验证场。",
    nextSignal: "迁移规模、SLA、混合负载与独立案例。",
  },
  {
    start: "2025-01-01",
    end: "2025-12-31",
    period: "2025",
    label: "生态与政策加速",
    summary: "迁移、评测、安全和数据基础设施进入制度化阶段。",
    interpretation: "交付体系成为产品能力的一部分。",
    chinaPosition: "国产生态覆盖更完整。",
    nextSignal: "标准落地与规模化复用。",
  },
  {
    start: "2026-01-01",
    end: "2026-07-14",
    period: "2026—今天",
    label: "当前阶段：证据化决策",
    summary: "选型开始同时约束能力、兼容、恢复和 TCO。",
    interpretation: "不再以品牌、榜单或单一 benchmark 代替决策。",
    chinaPosition: "需要持续积累独立生产证据。",
    nextSignal: "可复现评测、价格新鲜度和判断校准。",
  },
];

const lens = (role: "ceo" | "dba" | "data-architect" | "practitioner") => ({
  role,
  question:
    role === "ceo"
      ? "这条主线改变了什么经营与采购决策？"
      : role === "dba"
        ? "哪些稳定性与运维证据必须补齐？"
        : role === "data-architect"
          ? "架构边界和迁移路径如何验证？"
          : "下一步应该做哪个最小实验？",
  answer: "先把目标工作负载、证据状态、未知项和失效条件写清，再比较产品与路线。",
  implications: ["官方能力不等于生产效果。", "兼容、恢复与长期成本需要共同验证。"],
  actions: ["建立黄金负载和故障演练。", "记录版本、证据日期与回退条件。"],
  watch: ["独立生产证据。", "版本与商业条款变化。"],
  evidenceSlugs: historicalEvents.slice(0, 6).map((event) => event.slug),
});

const trackMeta = [
  ["kernel-architecture", "数据库内核与架构", "内核、事务、优化器、兼容与存储路线。"],
  ["distributed-cloud", "分布式、云原生与 Serverless", "分布式事务、弹性、云服务与故障域。"],
  [
    "realtime-lakehouse-multimodel",
    "实时分析、湖仓与多模数据",
    "OLAP、HTAP、湖仓、图、时序和向量。",
  ],
  [
    "reliability-security-ops-cost",
    "稳定性、安全、运维与成本",
    "SLO、容灾、安全、DBA 工具与 TCO。",
  ],
  ["commercialization-adoption", "产品商业化与行业落地", "采购、迁移、云服务与关键行业采用。"],
  ["china-ecosystem-policy", "国产生态、资本与政策标准", "国产生态、开源协作、政策、标准与评测。"],
] as const;

export const industryNarratives = {
  horizon: { start: "2022-01-01", end: "2026-07-14", label: "2022—今天" },
  eras: stages.map((stage, index) => ({
    slug: `stage-${index + 1}`,
    label: stage.label,
    period: stage.period,
    summary: stage.summary,
    projects: [] as Array<{
      name: string;
      status: "active" | "pivoted" | "acquired" | "sunset";
      note: string;
      url: string;
    }>,
  })),
  tracks: trackMeta.map(([slug, name, description]) => ({
    slug,
    thesis: description,
    now: `当前判断：${name}的比较必须从产品声明转向工作负载、故障、兼容与成本证据。`,
    next: "下一信号：独立生产案例、可复现测试、连续版本记录和透明商业口径。",
    stages: stages.map((stage) => ({ ...stage })),
    lenses: (["ceo", "dba", "data-architect", "practitioner"] as const).map(lens),
  })),
} as const;

export const industryNarrativesEn = {
  horizon: { start: "2022-01-01", end: "2026-07-14", label: "2022—Today" },
  eras: stages.map((stage, index) => ({
    slug: `stage-${index + 1}`,
    label:
      [
        "Architecture evolution",
        "Production validation expands",
        "Ecosystem and policy accelerate",
        "Current phase: evidence-led decisions",
      ][index] ?? stage.label,
    period: stage.period,
    summary:
      "China's database market moves from product availability toward verifiable workload, recovery, compatibility, and cost evidence.",
    projects: [] as Array<{
      name: string;
      status: "active" | "pivoted" | "acquired" | "sunset";
      note: string;
      url: string;
    }>,
  })),
  tracks: trackMeta.map(([slug]) => ({
    slug,
    thesis:
      "Compare database paths through workload boundaries, failure behavior, compatibility, governance, and total cost.",
    now: "Current judgment: official capability claims must be separated from independent production evidence.",
    next: "Next signal: reproducible tests, independent production cases, continuous release records, and transparent commercial terms.",
    stages: stages.map((stage) => ({
      ...stage,
      label: stage.period,
      summary:
        "Evidence maturity increases across architecture, adoption, operations, and governance.",
      interpretation: "Test the workload and failure boundary before standardization.",
      chinaPosition:
        "Domestic ecosystems broaden while independent evidence remains the constraint.",
      nextSignal: "Production references, reproducible tests, and current commercial terms.",
    })),
    lenses: (["ceo", "dba", "data-architect", "practitioner"] as const).map((role) => ({
      role,
      question: "What decision does this track change?",
      answer:
        "Define the workload, evidence state, unknowns, and invalidation conditions before comparing products.",
      implications: [
        "Official capability is not production proof.",
        "Compatibility, recovery, and long-term cost require joint validation.",
      ],
      actions: [
        "Build a golden workload and failure drill.",
        "Record version, evidence date, and rollback conditions.",
      ],
      watch: ["Independent production evidence.", "Release and commercial-term changes."],
      evidenceSlugs: historicalEvents.slice(0, 6).map((event) => event.slug),
    })),
  })),
} as const;
