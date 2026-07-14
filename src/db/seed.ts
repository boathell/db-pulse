import { createHash } from "node:crypto";
import type { Kysely } from "kysely";
import { type CuratedEventSeed, historicalEvents } from "../catalog/history.js";
import { sourceCatalog } from "../catalog/sources.js";
import { PUBLIC_CONTENT_DOMAIN, PUBLIC_VIEW_SLUG } from "../domain/content-domain.js";
import { canonicalizeUrl, sha256 } from "../domain/url.js";
import { Repository } from "./repository.js";
import type { DatabaseSchema } from "./types.js";

const now = () => new Date().toISOString();
const CURATED_SEED_TIMESTAMP = "2026-07-14T00:00:00.000Z";
const DEPRECATED_CURATED_EVENT_SLUGS = [
  "database-source-governance-becomes-public-infrastructure",
] as const;
const stableId = (namespace: string, slug: string) => {
  const hash = createHash("sha256").update(`${namespace}:${slug}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};

const tracks = [
  [
    "kernel-architecture",
    "数据库内核与架构",
    "内核、事务、优化器、兼容与存储路线。",
    "main",
    "architecture",
    "#6d5dfc",
    "⌁",
    10,
  ],
  [
    "distributed-cloud",
    "分布式、云原生与 Serverless",
    "分布式事务、弹性、云服务与故障域。",
    "main",
    "cloud",
    "#0f8b8d",
    "◎",
    20,
  ],
  [
    "realtime-lakehouse-multimodel",
    "实时分析、湖仓与多模数据",
    "OLAP、HTAP、湖仓、图、时序和向量工作负载。",
    "main",
    "analytics",
    "#c76d24",
    "◇",
    30,
  ],
  [
    "reliability-security-ops-cost",
    "稳定性、安全、运维与成本",
    "SLO、容灾、安全、DBA 工具与总体拥有成本。",
    "main",
    "operations",
    "#ba3d57",
    "⚙",
    40,
  ],
  [
    "commercialization-adoption",
    "产品商业化与行业落地",
    "采购、迁移、云服务与关键行业生产采用。",
    "main",
    "business",
    "#287a4b",
    "↗",
    50,
  ],
  [
    "china-ecosystem-policy",
    "国产生态、资本与政策标准",
    "国产生态、开源协作、政策、标准与评测。",
    "main",
    "policy",
    "#8a5a20",
    "中",
    60,
  ],
  ["oltp", "OLTP", "事务处理与核心业务系统。", "branch", "workload", "#53657a", "T", 110],
  [
    "olap-htap",
    "OLAP / HTAP",
    "分析与混合事务分析工作负载。",
    "branch",
    "workload",
    "#53657a",
    "A",
    120,
  ],
  [
    "lakehouse-realtime",
    "湖仓与实时",
    "实时写入、湖上查询与数据新鲜度。",
    "branch",
    "workload",
    "#53657a",
    "L",
    130,
  ],
  [
    "multimodel",
    "图 / 时序 / 向量 / 多模",
    "专用数据模型与多引擎治理。",
    "branch",
    "workload",
    "#53657a",
    "M",
    140,
  ],
  [
    "open-source",
    "开源生态",
    "社区版本、贡献、商业发行和托管服务。",
    "branch",
    "delivery",
    "#53657a",
    "O",
    150,
  ],
  [
    "cloud-managed",
    "云托管",
    "云数据库服务、弹性和商业计费。",
    "branch",
    "delivery",
    "#53657a",
    "C",
    160,
  ],
  [
    "private-xinchuang",
    "私有化与信创",
    "国产化迁移、兼容适配和私有化交付。",
    "branch",
    "delivery",
    "#53657a",
    "P",
    170,
  ],
  [
    "critical-industries",
    "关键行业",
    "金融、政务、电信、能源与工业生产系统。",
    "branch",
    "industry",
    "#53657a",
    "I",
    180,
  ],
] as const;

const actors = [
  [
    "dameng",
    "武汉达梦",
    "company",
    "large",
    ["relational", "distributed", "xinchuang"],
    "https://www.dameng.com/",
  ],
  [
    "kingbase",
    "人大金仓",
    "company",
    "large",
    ["relational", "compatibility", "xinchuang"],
    "https://www.kingbase.com.cn/",
  ],
  [
    "gbase",
    "南大通用",
    "company",
    "large",
    ["relational", "analytics", "distributed"],
    "https://www.gbase.cn/",
  ],
  [
    "goldendb",
    "金篆信科 / GoldenDB",
    "company",
    "scaleup",
    ["distributed", "financial", "oltp"],
    "https://www.goldendb.com/",
  ],
  [
    "oceanbase",
    "OceanBase",
    "company",
    "scaleup",
    ["distributed", "htap", "cloud"],
    "https://www.oceanbase.com/",
  ],
  [
    "tidb",
    "PingCAP / TiDB",
    "company",
    "scaleup",
    ["distributed", "htap", "open-source"],
    "https://www.pingcap.com/",
  ],
  [
    "opengauss",
    "openGauss 社区",
    "community",
    "ecosystem",
    ["relational", "open-source", "xinchuang"],
    "https://opengauss.org/zh/",
  ],
  [
    "gaussdb",
    "华为云 GaussDB",
    "company",
    "hyperscaler",
    ["distributed", "cloud", "financial"],
    "https://www.huaweicloud.com/product/gaussdb.html",
  ],
  [
    "polardb",
    "阿里云 PolarDB",
    "company",
    "hyperscaler",
    ["cloud-native", "serverless", "relational"],
    "https://www.aliyun.com/product/polardb",
  ],
  [
    "tdsql",
    "腾讯云 TDSQL",
    "company",
    "hyperscaler",
    ["distributed", "cloud", "relational"],
    "https://cloud.tencent.com/product/tdsql",
  ],
  [
    "vastbase",
    "海量数据 / Vastbase",
    "company",
    "scaleup",
    ["relational", "compatibility", "xinchuang"],
    "https://www.vastdata.com.cn/",
  ],
  [
    "sequoiadb",
    "巨杉数据库 / SequoiaDB",
    "company",
    "scaleup",
    ["distributed", "multimodel", "enterprise"],
    "https://www.sequoiadb.com/",
  ],
  [
    "matrixone",
    "矩阵起源 / MatrixOne",
    "company",
    "startup",
    ["cloud-native", "htap", "open-source"],
    "https://www.matrixorigin.cn/",
  ],
  [
    "apache-doris",
    "Apache Doris 社区",
    "community",
    "ecosystem",
    ["olap", "lakehouse", "open-source"],
    "https://doris.apache.org/zh-CN/",
  ],
  [
    "starrocks",
    "StarRocks 社区",
    "community",
    "ecosystem",
    ["olap", "lakehouse", "open-source"],
    "https://www.starrocks.io/",
  ],
  [
    "tdengine",
    "涛思数据 / TDengine",
    "company",
    "scaleup",
    ["time-series", "iot", "open-source"],
    "https://tdengine.com/",
  ],
  [
    "nebulagraph",
    "悦数科技 / NebulaGraph",
    "company",
    "scaleup",
    ["graph", "distributed", "open-source"],
    "https://www.nebula-graph.com.cn/",
  ],
  [
    "milvus",
    "Zilliz / Milvus",
    "company",
    "scaleup",
    ["vector", "retrieval", "open-source"],
    "https://milvus.io/zh",
  ],
  [
    "nda",
    "国家数据局",
    "policy-body",
    "national",
    ["data-policy", "public-data", "data-infrastructure"],
    "https://www.nda.gov.cn/",
  ],
  [
    "tc260",
    "全国网络安全标准化技术委员会 TC260",
    "standards-body",
    "national",
    ["data-security", "database-security", "standards"],
    "https://www.tc260.org.cn/",
  ],
  [
    "caict-database",
    "中国信通院数据库研究",
    "institution",
    "national",
    ["database-research", "benchmark", "cloud-database"],
    "https://www.caict.ac.cn/",
  ],
  [
    "dtcc-expert-network",
    "DTCC 数据库专家与演讲者网络",
    "expert-network",
    "community",
    ["database-architecture", "dba", "industry-practice"],
    "https://dtcc.it168.com/",
  ],
] as const;

const resources = [
  [
    "dameng",
    "武汉达梦",
    "达梦数据库",
    "关系型 / 分布式",
    ["商业版"],
    ["私有化", "一体机"],
    ["商业许可"],
    ["SQL", "JDBC", "ODBC"],
    "项目报价",
    "以官方商务与合同为准",
    "https://www.dameng.com/",
    "https://eco.dameng.com/",
    "https://www.dameng.com/",
  ],
  [
    "kingbase",
    "人大金仓",
    "KingbaseES",
    "关系型",
    ["商业版"],
    ["私有化"],
    ["商业许可"],
    ["SQL", "JDBC", "ODBC"],
    "项目报价",
    "以官方商务与合同为准",
    "https://www.kingbase.com.cn/",
    "https://help.kingbase.com.cn/",
    "https://www.kingbase.com.cn/",
  ],
  [
    "gbase",
    "南大通用",
    "GBase",
    "关系型 / 分析型",
    ["产品族"],
    ["私有化", "集群"],
    ["商业许可"],
    ["SQL", "JDBC", "ODBC"],
    "项目报价",
    "需按具体引擎核验",
    "https://www.gbase.cn/",
    "https://www.gbase.cn/document",
    "https://www.gbase.cn/",
  ],
  [
    "goldendb",
    "金篆信科",
    "GoldenDB",
    "分布式关系型",
    ["商业版"],
    ["私有化", "金融核心"],
    ["商业许可"],
    ["SQL", "MySQL ecosystem"],
    "项目报价",
    "以官方项目方案为准",
    "https://www.goldendb.com/",
    "https://www.goldendb.com/",
    "https://www.goldendb.com/",
  ],
  [
    "oceanbase",
    "OceanBase",
    "OceanBase",
    "分布式关系型 / HTAP",
    ["社区版", "企业版", "云服务"],
    ["私有化", "公有云"],
    ["开源许可", "商业许可", "按云资源计费"],
    ["MySQL mode", "Oracle mode"],
    "开源 + 商业 + 云计费",
    "版本和服务形态决定成本",
    "https://www.oceanbase.com/",
    "https://www.oceanbase.com/docs",
    "https://www.oceanbase.com/",
  ],
  [
    "tidb",
    "PingCAP",
    "TiDB",
    "分布式 SQL / HTAP",
    ["社区版", "企业支持", "TiDB Cloud"],
    ["私有化", "公有云"],
    ["Apache-2.0", "商业服务", "云计费"],
    ["MySQL protocol"],
    "开源 + 商业 + 云计费",
    "需核验云资源与支持合同",
    "https://www.pingcap.com/",
    "https://docs.pingcap.com/",
    "https://docs.pingcap.com/tidb/stable/release-notes/",
  ],
  [
    "opengauss",
    "openGauss 社区",
    "openGauss",
    "关系型",
    ["社区版", "伙伴发行版"],
    ["私有化", "云"],
    ["MulanPSL-2.0", "伙伴商业许可"],
    ["SQL", "JDBC", "ODBC"],
    "开源 + 伙伴服务",
    "商业条款取决于发行版",
    "https://opengauss.org/zh/",
    "https://docs.opengauss.org/zh/",
    "https://opengauss.org/zh/news/",
  ],
  [
    "gaussdb",
    "华为云",
    "GaussDB",
    "云原生分布式关系型",
    ["云服务", "企业方案"],
    ["公有云", "混合部署"],
    ["云计费", "商业许可"],
    ["SQL", "生态工具"],
    "云资源 / 项目报价",
    "以地域、规格和合同为准",
    "https://www.huaweicloud.com/product/gaussdb.html",
    "https://support.huaweicloud.com/gaussdb/",
    "https://support.huaweicloud.com/productdesc-gaussdb/gaussdb_01_0001.html",
  ],
  [
    "polardb",
    "阿里云",
    "PolarDB",
    "云原生关系型",
    ["MySQL 版", "PostgreSQL 版", "PolarDB-X"],
    ["公有云", "Serverless"],
    ["云计费", "开源组件许可"],
    ["MySQL", "PostgreSQL"],
    "按云资源计费",
    "需核验存储、网络、备份与弹性费用",
    "https://www.aliyun.com/product/polardb",
    "https://help.aliyun.com/zh/polardb/",
    "https://help.aliyun.com/zh/polardb/",
  ],
  [
    "tdsql",
    "腾讯云",
    "TDSQL",
    "云数据库产品族",
    ["MySQL 兼容产品", "分布式产品"],
    ["公有云", "私有化"],
    ["云计费", "项目报价"],
    ["MySQL ecosystem", "SQL"],
    "云资源 / 项目报价",
    "需按具体产品形态核验",
    "https://cloud.tencent.com/product/tdsql",
    "https://cloud.tencent.com/document/product/1376",
    "https://cloud.tencent.com/document/product/1376/125147",
  ],
  [
    "vastbase",
    "海量数据",
    "Vastbase",
    "关系型",
    ["商业版"],
    ["私有化"],
    ["商业许可"],
    ["SQL", "JDBC", "ODBC"],
    "项目报价",
    "以官方商务与兼容测试为准",
    "https://www.vastdata.com.cn/",
    "https://docs.vastdata.com.cn/",
    "https://www.vastdata.com.cn/",
  ],
  [
    "sequoiadb",
    "巨杉数据库",
    "SequoiaDB",
    "分布式多模",
    ["社区相关版本", "企业版"],
    ["私有化", "集群"],
    ["开源 / 商业许可，需按版本核验"],
    ["SQL", "文档", "对象接口"],
    "项目报价",
    "需按版本和接口核验",
    "https://www.sequoiadb.com/",
    "https://doc.sequoiadb.com/",
    "https://www.sequoiadb.com/",
  ],
  [
    "matrixone",
    "矩阵起源",
    "MatrixOne",
    "云原生 HTAP",
    ["社区版", "云服务"],
    ["私有化", "云"],
    ["Apache-2.0", "云计费"],
    ["MySQL protocol"],
    "开源 + 云计费",
    "需核验资源与服务范围",
    "https://www.matrixorigin.cn/",
    "https://docs.matrixorigin.cn/",
    "https://docs.matrixorigin.cn/en/v26.3.0.13/MatrixOne/Release-Notes/v22.0.6.0/",
  ],
  [
    "apache-doris",
    "Apache Doris 社区",
    "Apache Doris",
    "实时分析 / 湖仓",
    ["社区版", "商业服务"],
    ["私有化", "云托管"],
    ["Apache-2.0", "商业服务"],
    ["MySQL protocol", "数据湖"],
    "开源 + 商业服务",
    "云与服务价格需独立核验",
    "https://doris.apache.org/zh-CN/",
    "https://doris.apache.org/zh-CN/docs/",
    "https://doris.apache.org/zh-CN/releases/all-release/",
  ],
  [
    "starrocks",
    "StarRocks 社区",
    "StarRocks",
    "实时分析 / 湖仓",
    ["社区版", "商业服务"],
    ["私有化", "云托管"],
    ["Apache-2.0", "商业服务"],
    ["MySQL protocol", "数据湖"],
    "开源 + 商业服务",
    "云与服务价格需独立核验",
    "https://www.starrocks.io/",
    "https://docs.starrocks.io/zh/",
    "https://docs.starrocks.io/zh/docs/release_notes/",
  ],
  [
    "tdengine",
    "涛思数据",
    "TDengine",
    "时序数据库",
    ["社区版", "企业版", "云服务"],
    ["边缘", "私有化", "云"],
    ["开源许可", "商业许可", "云计费"],
    ["SQL", "IoT connectors"],
    "开源 + 商业 + 云计费",
    "按设备、数据与资源模型核验",
    "https://tdengine.com/",
    "https://docs.tdengine.com/",
    "https://docs.tdengine.com/release-history/",
  ],
  [
    "nebulagraph",
    "悦数科技",
    "NebulaGraph",
    "分布式图数据库",
    ["社区版", "企业版", "云服务"],
    ["私有化", "云"],
    ["Apache-2.0", "商业许可", "云计费"],
    ["nGQL", "connectors"],
    "开源 + 商业 + 云计费",
    "需核验容量、支持和云资源",
    "https://www.nebula-graph.com.cn/",
    "https://docs.nebula-graph.com.cn/",
    "https://docs.nebula-graph.com.cn/3.8.0/20.appendix/release-notes/",
  ],
  [
    "milvus",
    "Zilliz / Milvus",
    "Milvus",
    "向量数据库",
    ["社区版", "Zilliz Cloud"],
    ["私有化", "云"],
    ["Apache-2.0", "云计费"],
    ["SDK", "REST", "向量与标量过滤"],
    "开源 + 云计费",
    "按容量、计算、索引和服务核验",
    "https://milvus.io/zh",
    "https://milvus.io/docs/zh",
    "https://milvus.io/docs/zh/release_notes.md",
  ],
] as const;

export async function seedDatabase(db: Kysely<DatabaseSchema>): Promise<void> {
  const repository = new Repository(db);
  const timestamp = CURATED_SEED_TIMESTAMP;

  for (const source of sourceCatalog) {
    await repository.saveCatalogSource({
      id: stableId("source", source.slug),
      slug: source.slug,
      name: source.name,
      homepage_url: source.homepageUrl,
      adapter: source.adapter,
      tier: source.tier,
      role: source.role,
      region: source.region,
      language: source.language,
      authority_score: source.authorityScore,
      enabled: source.enabled ? 1 : 0,
      config_json: JSON.stringify({
        url: source.endpoint,
        take: source.tier === 1 ? 50 : 30,
        category: source.category,
        ...(source.identityHosts ? { identityHosts: source.identityHosts } : {}),
      }),
      state_json: "{}",
      last_collected_at: null,
      last_success_at: null,
      last_error: null,
      lifecycle_status: source.lifecycleStatus,
      source_category: source.category,
      acquisition: source.acquisition,
      topics_json: JSON.stringify(source.topics),
      maintenance_status: source.maintenanceStatus,
      cadence: source.cadence,
      license_note: source.licenseNote,
      quality_score: source.qualityScore,
      last_verified_at: null,
      owner: source.owner ?? source.name,
      robots_policy: source.robotsPolicy ?? "review-required",
      freshness_slo_hours: source.freshnessSloHours ?? 168,
      adapter_version: source.adapterVersion ?? "1.0.0",
      content_domain: PUBLIC_CONTENT_DOMAIN,
    });
  }

  const catalogSlugs = new Set(sourceCatalog.map((source) => source.slug));
  for (const source of await repository.listAllSources()) {
    if (catalogSlugs.has(source.slug)) continue;
    await repository.updateSource(source.id, {
      enabled: 0,
      lifecycle_status: "retired",
      maintenance_status: "retired",
      retired_at: timestamp,
    });
  }

  await db.updateTable("tracks").set({ enabled: 0, updated_at: timestamp }).execute();
  for (const [slug, name, description, kind, perspective, color, icon, order] of tracks) {
    const existing = await db
      .selectFrom("tracks")
      .select("id")
      .where("slug", "=", slug)
      .executeTakeFirst();
    const id = existing?.id ?? stableId("track", slug);
    const value = {
      slug,
      name,
      description,
      kind,
      perspective,
      color,
      icon,
      order_index: order,
      enabled: 1,
      created_at: timestamp,
      updated_at: timestamp,
    };
    if (existing) await db.updateTable("tracks").set(value).where("id", "=", id).execute();
    else
      await db
        .insertInto("tracks")
        .values({ id, ...value })
        .execute();
  }

  await db.updateTable("actors").set({ enabled: 0, updated_at: timestamp }).execute();
  for (const [slug, name, actorType, scale, domains, website] of actors) {
    const existing = await db
      .selectFrom("actors")
      .select("id")
      .where("slug", "=", slug)
      .executeTakeFirst();
    const id = existing?.id ?? stableId("actor", slug);
    const value = {
      slug,
      name,
      actor_type: actorType,
      region: "CN",
      scale,
      domains_json: JSON.stringify(domains),
      table_score: 80,
      website_url: website,
      enabled: 1,
      created_at: timestamp,
      updated_at: timestamp,
    };
    if (existing) await db.updateTable("actors").set(value).where("id", "=", id).execute();
    else
      await db
        .insertInto("actors")
        .values({ id, ...value })
        .execute();
  }

  await db.updateTable("database_resources").set({ enabled: 0, updated_at: timestamp }).execute();
  for (const [
    slug,
    provider,
    product,
    engineType,
    editions,
    deploymentModes,
    licenseModels,
    compatibility,
    pricingModel,
    pricingNote,
    purchaseUrl,
    documentationUrl,
    evidenceUrl,
  ] of resources) {
    const existing = await db
      .selectFrom("database_resources")
      .select("id")
      .where("slug", "=", slug)
      .executeTakeFirst();
    const id = existing?.id ?? stableId("database-resource", slug);
    const value = {
      slug,
      provider,
      product,
      engine_type: engineType,
      version_note: "以证据链接中的版本与发布说明为准",
      editions_json: JSON.stringify(editions),
      deployment_modes_json: JSON.stringify(deploymentModes),
      license_models_json: JSON.stringify(licenseModels),
      compatibility_json: JSON.stringify(compatibility),
      pricing_model: pricingModel,
      pricing_note: pricingNote,
      region: "CN",
      purchase_url: purchaseUrl,
      documentation_url: documentationUrl,
      evidence_url: evidenceUrl,
      evidence_status: "official",
      verified_at: "2026-07-14T00:00:00.000Z",
      enabled: 1,
      created_at: timestamp,
      updated_at: timestamp,
    };
    if (existing)
      await db.updateTable("database_resources").set(value).where("id", "=", id).execute();
    else
      await db
        .insertInto("database_resources")
        .values({ id, ...value })
        .execute();
  }

  const viewSlug = PUBLIC_VIEW_SLUG;
  await db.updateTable("views").set({ is_default: 0, updated_at: timestamp }).execute();
  const existingView = await db
    .selectFrom("views")
    .select("id")
    .where("slug", "=", viewSlug)
    .executeTakeFirst();
  const viewId = existingView?.id ?? stableId("view", viewSlug);
  const view = {
    slug: viewSlug,
    name: "数据库行业决策总览",
    description: "面向 CEO、DBA、数据架构师与数据库从业者的证据化行业总览。",
    filters_json: JSON.stringify({ statuses: ["published"], contentDomain: PUBLIC_CONTENT_DOMAIN }),
    layout_json: JSON.stringify({
      blocks: ["hero", "trend", "timeline", "actors", "resources"],
      density: "comfortable",
      defaultTrack: "kernel-architecture",
    }),
    theme_json: JSON.stringify({ theme: "paper", accent: "#6d5dfc", radius: 16 }),
    is_default: 1,
    status: "published",
    created_at: timestamp,
    updated_at: timestamp,
  };
  if (existingView) await db.updateTable("views").set(view).where("id", "=", viewId).execute();
  else
    await db
      .insertInto("views")
      .values({ id: viewId, ...view })
      .execute();

  await removeDeprecatedCuratedEvents(db);
  for (const event of historicalEvents) await seedEvent(db, repository, event, timestamp);
  await seedScout(db, timestamp);
}

async function removeDeprecatedCuratedEvents(db: Kysely<DatabaseSchema>): Promise<void> {
  for (const slug of DEPRECATED_CURATED_EVENT_SLUGS) {
    await db
      .deleteFrom("events")
      .where("slug", "=", slug)
      .where("content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .where("manual_override", "=", 1)
      .execute();

    const signals = await db
      .selectFrom("signals")
      .innerJoin("sources", "sources.id", "signals.source_id")
      .select(["signals.id", "signals.raw_meta_json"])
      .where("signals.external_id", "=", slug)
      .where("sources.content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .execute();
    for (const signal of signals) {
      if (!isCuratedSignal(signal.raw_meta_json)) continue;
      const link = await db
        .selectFrom("event_signals")
        .select("event_id")
        .where("signal_id", "=", signal.id)
        .executeTakeFirst();
      if (!link) await db.deleteFrom("signals").where("id", "=", signal.id).execute();
    }
  }
}

function isCuratedSignal(rawMetaJson: string): boolean {
  try {
    const rawMeta = JSON.parse(rawMetaJson) as Record<string, unknown>;
    return rawMeta.curated === true && rawMeta.contentDomain === PUBLIC_CONTENT_DOMAIN;
  } catch {
    return false;
  }
}

async function seedEvent(
  db: Kysely<DatabaseSchema>,
  repository: Repository,
  event: CuratedEventSeed,
  timestamp: string,
) {
  if (!event.en) throw new Error(`DB Pulse Event is missing English localization: ${event.slug}`);
  const existing = await db
    .selectFrom("events")
    .select("id")
    .where("slug", "=", event.slug)
    .executeTakeFirst();
  const id = existing?.id ?? stableId("event", event.slug);
  const [confidence, heat, impact, value] = event.scores;
  const eventValue = {
    slug: event.slug,
    title: event.title,
    fact_summary: event.fact,
    summary: event.summary,
    technical_insight: event.technical,
    industry_insight: event.industry,
    future_outlook: event.future,
    business_value: event.business,
    category: event.category,
    company: event.company,
    keywords_json: JSON.stringify(event.keywords),
    confidence_score: confidence,
    heat_score: heat,
    impact_score: impact,
    value_score: value,
    score_factors_json: JSON.stringify({
      authority: confidence,
      corroboration: event.evidence?.length ? 80 : 0,
      primaryEvidence: 100,
      uniqueAuthors: 0,
      independentSources: 1 + (event.evidence?.length ?? 0),
      platformBreadth: 1,
      regionBreadth: 1,
      velocity: 0,
      freshness: 70,
      crossRegion: false,
    }),
    status: "published",
    featured: value >= 88 ? 1 : 0,
    manual_override: 1,
    happened_at: event.date,
    published_at: event.date,
    created_at: timestamp,
    updated_at: timestamp,
    content_domain: PUBLIC_CONTENT_DOMAIN,
  };
  if (existing) await db.updateTable("events").set(eventValue).where("id", "=", id).execute();
  else
    await db
      .insertInto("events")
      .values({ id, ...eventValue })
      .execute();

  const localization = {
    title: event.en.title,
    fact_summary: event.en.fact,
    summary: event.en.summary,
    technical_insight: event.en.technical,
    industry_insight: event.en.industry,
    future_outlook: event.en.future,
    business_value: event.en.business,
    updated_at: timestamp,
  };
  const existingLocalization = await db
    .selectFrom("event_localizations")
    .select("event_id")
    .where("event_id", "=", id)
    .where("locale", "=", "en")
    .executeTakeFirst();
  if (existingLocalization)
    await db
      .updateTable("event_localizations")
      .set(localization)
      .where("event_id", "=", id)
      .where("locale", "=", "en")
      .execute();
  else
    await db
      .insertInto("event_localizations")
      .values({ event_id: id, locale: "en", ...localization, created_at: timestamp })
      .execute();

  await attachEvidence(
    db,
    repository,
    id,
    event.slug,
    event.source,
    event.url,
    event.title,
    event.fact,
    event.date,
    event.category,
    event.keywords,
    100,
  );
  for (const [index, evidence] of (event.evidence ?? []).entries()) {
    await attachEvidence(
      db,
      repository,
      id,
      `${event.slug}:evidence:${index + 1}`,
      evidence.source,
      evidence.url,
      evidence.title,
      event.fact,
      event.date,
      event.category,
      event.keywords,
      90 - index,
    );
  }

  await db.deleteFrom("event_tracks").where("event_id", "=", id).execute();
  for (const [index, trackSlug] of event.tracks.entries()) {
    const track = await db
      .selectFrom("tracks")
      .select("id")
      .where("slug", "=", trackSlug)
      .executeTakeFirstOrThrow();
    await db
      .insertInto("event_tracks")
      .values({
        event_id: id,
        track_id: track.id,
        node_role: index === 0 ? "milestone" : "supporting",
        narrative: event.industry,
        stage: "evidence",
        order_index: index * 10,
        created_at: timestamp,
      })
      .execute();
  }
  await db.deleteFrom("event_actors").where("event_id", "=", id).execute();
  for (const actorSlug of event.actors) {
    const actor = await db
      .selectFrom("actors")
      .select(["id", "actor_type"])
      .where("slug", "=", actorSlug)
      .executeTakeFirstOrThrow();
    await db
      .insertInto("event_actors")
      .values({
        event_id: id,
        actor_id: actor.id,
        actor_role: actorRoleForType(actor.actor_type),
        progress_stage: "observed",
        relevance_score: 100,
        created_at: timestamp,
      })
      .execute();
  }
}

function actorRoleForType(actorType: string) {
  if (actorType === "policy-body" || actorType === "standards-body") return "issuer";
  if (actorType === "institution") return "evaluator";
  if (actorType === "expert-network") return "observer";
  return "subject";
}

async function attachEvidence(
  db: Kysely<DatabaseSchema>,
  repository: Repository,
  eventId: string,
  externalId: string,
  sourceSlug: string,
  url: string,
  title: string,
  summary: string,
  publishedAt: string,
  category: string,
  keywords: readonly string[],
  relevance: number,
) {
  const sourceId = stableId("source", sourceSlug);
  const canonicalUrl = canonicalizeUrl(url);
  const existing = await db
    .selectFrom("signals")
    .select(["id", "updated_at"])
    .where((expression) =>
      expression.or([
        expression("external_id", "=", externalId),
        expression("canonical_url", "=", canonicalUrl),
      ]),
    )
    .executeTakeFirst();
  const inserted = existing
    ? undefined
    : await repository.insertSignal(sourceId, {
        externalId,
        url,
        title,
        summary,
        language: "zh-CN",
        publishedAt,
        category,
        tags: [...keywords],
        metrics: { independentSources: 1, platforms: ["official"], regions: ["CN"] },
        rawMeta: { curated: true, contentDomain: PUBLIC_CONTENT_DOMAIN },
      });
  const signalId =
    inserted?.id ??
    existing?.id ??
    (
      await db
        .selectFrom("signals")
        .select("id")
        .where("canonical_url", "=", canonicalUrl)
        .executeTakeFirstOrThrow()
    ).id;
  const signalTimestamp = existing?.updated_at ?? inserted?.updated_at ?? now();
  await db
    .updateTable("signals")
    .set({
      external_id: externalId,
      title,
      summary,
      language: "zh-CN",
      published_at: publishedAt,
      category,
      tags_json: JSON.stringify(keywords),
      content_hash: sha256(`${title}\n${summary}`),
      updated_at: signalTimestamp,
    })
    .where("id", "=", signalId)
    .execute();
  await repository.attachSignal(eventId, signalId, "primary", relevance);
}

async function seedScout(db: Kysely<DatabaseSchema>, timestamp: string) {
  const slug = "database-migration-evidence-checklist";
  const existing = await db
    .selectFrom("scout_insights")
    .select("id")
    .where("slug", "=", slug)
    .executeTakeFirst();
  const id = existing?.id ?? stableId("scout", slug);
  const value = {
    slug,
    kind: "artifact",
    status: "published",
    title: "建立数据库迁移证据清单",
    observation:
      "国产数据库选型的主要风险已经从是否可用转向兼容、切换、恢复和长期运维证据是否完整。",
    hypothesis: "一份按应用与工作负载组织的迁移证据清单，可以降低品牌导向选型和重复验证成本。",
    why_now: "首批 18 个数据库生态已进入统一证据模型，适合用真实项目反馈校准字段。",
    target_audience: "CEO、DBA、数据架构师和数据库平台负责人",
    suggested_action: "选择一个可回滚应用，在两周内完成兼容扫描、黄金负载、故障切换与成本基线。",
    artifact_idea: "数据库迁移证据清单、故障演练脚本和 TCO 记录模板",
    counter_signals: "如果业务没有明确迁移动因、目标产品缺少可验证证据或回退成本过高，应暂缓迁移。",
    horizon: "30-90d",
    confidence_score: 82,
    evidence_score: 86,
    novelty_score: 68,
    leverage_score: 90,
    total_score: 83,
    cooldown_key: "artifact:database-migration-evidence-checklist",
    generated_at: timestamp,
    expires_at: null,
    published_at: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
    content_domain: PUBLIC_CONTENT_DOMAIN,
  };
  if (existing) await db.updateTable("scout_insights").set(value).where("id", "=", id).execute();
  else
    await db
      .insertInto("scout_insights")
      .values({ id, ...value })
      .execute();
  const event = await db
    .selectFrom("events")
    .select("id")
    .where("slug", "=", "migration-tooling-becomes-database-product-moat")
    .executeTakeFirstOrThrow();
  await db
    .insertInto("scout_evidence")
    .values({
      insight_id: id,
      event_id: event.id,
      evidence_role: "trigger",
      weight: 100,
      created_at: timestamp,
    })
    .onConflict((conflict) => conflict.columns(["insight_id", "event_id"]).doNothing())
    .execute();
}
