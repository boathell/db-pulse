export type SourceCategory =
  | "database-vendor"
  | "open-source-database"
  | "cloud-database"
  | "policy-standard"
  | "research-benchmark"
  | "capital-business"
  | "professional-media"
  | "database-community"
  | "frontier-lab"
  | "china-lab"
  | "research-eval"
  | "open-source"
  | "agent-devtool"
  | "robotics"
  | "infra-chip-cloud"
  | "model-economics"
  | "policy"
  | "expert"
  | "media"
  | "community-heat"
  | "aggregator";

export type Acquisition = "rss" | "api" | "github" | "arxiv" | "html" | "social" | "manual";

export interface CatalogSource {
  slug: string;
  name: string;
  homepageUrl: string;
  endpoint: string;
  adapter: string;
  tier: 1 | 2 | 3 | 4;
  role: "primary" | "research" | "expert" | "media" | "heat" | "aggregator" | "policy";
  region: string;
  language: string;
  authorityScore: number;
  qualityScore: number;
  enabled: boolean;
  lifecycleStatus: "draft" | "shadow" | "active";
  category: SourceCategory;
  acquisition: Acquisition;
  topics: string[];
  maintenanceStatus: "ready" | "candidate" | "restricted" | "manual" | "proposal";
  cadence: string;
  licenseNote: string;
  owner?: string;
  robotsPolicy?: "allowed" | "review-required" | "manual-only";
  freshnessSloHours?: number;
  adapterVersion?: string;
  identityHosts?: string[];
  socialHandles?: string[];
  proposalIssueNumber?: number;
  proposalEvidenceUrls?: string[];
}

type Seed = Omit<
  CatalogSource,
  | "authorityScore"
  | "qualityScore"
  | "enabled"
  | "lifecycleStatus"
  | "maintenanceStatus"
  | "cadence"
  | "licenseNote"
  | "owner"
  | "robotsPolicy"
  | "freshnessSloHours"
  | "adapterVersion"
  | "region"
  | "language"
> &
  Partial<
    Pick<
      CatalogSource,
      | "authorityScore"
      | "qualityScore"
      | "enabled"
      | "lifecycleStatus"
      | "maintenanceStatus"
      | "cadence"
      | "licenseNote"
      | "owner"
      | "robotsPolicy"
      | "freshnessSloHours"
      | "adapterVersion"
      | "region"
      | "language"
    >
  >;

const defineSource = (seed: Seed): CatalogSource => {
  const cadence = seed.cadence ?? (seed.acquisition === "github" ? "release-driven" : "weekly");
  return {
    authorityScore: seed.tier === 1 ? 94 : seed.tier === 2 ? 78 : 64,
    qualityScore: seed.tier === 1 ? 75 : 60,
    enabled: false,
    lifecycleStatus: "shadow",
    maintenanceStatus: seed.acquisition === "manual" ? "manual" : "candidate",
    licenseNote:
      "Public metadata and canonical links only; verify robots and terms before activation.",
    owner: seed.owner ?? seed.name,
    robotsPolicy:
      seed.robotsPolicy ?? (seed.acquisition === "manual" ? "manual-only" : "review-required"),
    freshnessSloHours:
      seed.freshnessSloHours ??
      (cadence === "weekly" ? 168 : cadence === "release-driven" ? 720 : 24),
    adapterVersion: seed.adapterVersion ?? "1.0.0",
    region: "CN",
    language: "zh-CN",
    ...seed,
    cadence,
    identityHosts: seed.identityHosts ?? [new URL(seed.homepageUrl).hostname],
  };
};

const ecosystemOwners: Readonly<Record<string, string>> = {
  dameng: "达梦数据",
  kingbase: "人大金仓",
  gbase: "南大通用",
  goldendb: "GoldenDB / 金篆信科",
  oceanbase: "OceanBase",
  tidb: "PingCAP",
  opengauss: "openGauss 社区",
  gaussdb: "华为云",
  polardb: "阿里云",
  tdsql: "腾讯云",
  vastbase: "海量数据",
  sequoiadb: "巨杉数据库",
  matrixone: "矩阵起源",
  doris: "Apache Doris 社区",
  starrocks: "StarRocks 社区",
  tdengine: "涛思数据",
  nebulagraph: "悦数科技",
  milvus: "Zilliz / Milvus 社区",
};

const ownerForOfficialSource = (slug: string, fallback: string): string =>
  Object.entries(ecosystemOwners).find(([prefix]) => slug.startsWith(`${prefix}-`))?.[1] ??
  fallback;

const official = (
  slug: string,
  name: string,
  homepageUrl: string,
  endpoint: string,
  topics: string[],
  acquisition: Acquisition = "html",
  adapter = acquisition === "github"
    ? "github-releases"
    : acquisition === "rss"
      ? "rss"
      : "web-scraper",
): CatalogSource =>
  defineSource({
    slug,
    name,
    homepageUrl,
    endpoint,
    adapter,
    tier: 1,
    role: "primary",
    category: acquisition === "github" ? "open-source-database" : "database-vendor",
    acquisition,
    topics,
    owner: ownerForOfficialSource(slug, name),
  });

const officialSources: CatalogSource[] = [
  official(
    "dameng-official",
    "达梦数据库官方",
    "https://www.dameng.com/",
    "https://www.dameng.com/list_103.html",
    ["dameng", "dm8", "国产数据库"],
  ),
  official(
    "dameng-docs",
    "达梦在线服务平台",
    "https://eco.dameng.com/",
    "https://eco.dameng.com/document/dm/zh-cn/start/index.html",
    ["dameng", "documentation", "dba"],
    "manual",
    "manual",
  ),
  official(
    "kingbase-official",
    "人大金仓官方",
    "https://www.kingbase.com.cn/",
    "https://www.kingbase.com.cn/news",
    ["kingbase", "kes", "国产数据库"],
  ),
  official(
    "kingbase-docs",
    "人大金仓文档",
    "https://help.kingbase.com.cn/",
    "https://help.kingbase.com.cn/",
    ["kingbase", "documentation", "compatibility"],
    "manual",
    "manual",
  ),
  official("gbase-official", "GBase 官方", "https://www.gbase.cn/", "https://www.gbase.cn/", [
    "gbase",
    "gbase-8a",
    "gbase-8s",
  ]),
  official(
    "gbase-docs",
    "GBase 文档",
    "https://www.gbase.cn/",
    "https://www.gbase.cn/document",
    ["gbase", "documentation", "distributed"],
    "manual",
    "manual",
  ),
  official(
    "goldendb-official",
    "GoldenDB 官方",
    "https://www.goldendb.com/",
    "https://www.goldendb.com/",
    ["goldendb", "financial-database", "distributed"],
  ),
  official(
    "goldendb-news",
    "GoldenDB 产品动态",
    "https://www.goldendb.com/",
    "https://www.goldendb.com/news",
    ["goldendb", "release", "adoption"],
    "manual",
    "manual",
  ),
  official(
    "oceanbase-official",
    "OceanBase 官方",
    "https://www.oceanbase.com/",
    "https://www.oceanbase.com/blog",
    ["oceanbase", "distributed", "htap"],
  ),
  official(
    "oceanbase-releases",
    "OceanBase GitHub Releases",
    "https://github.com/oceanbase/oceanbase",
    "https://github.com/oceanbase/oceanbase/releases.atom",
    ["oceanbase", "release", "open-source"],
    "github",
  ),
  official(
    "tidb-official",
    "PingCAP / TiDB 官方",
    "https://www.pingcap.com/",
    "https://docs.pingcap.com/tidb/stable/release-notes/",
    ["tidb", "distributed", "htap"],
  ),
  official(
    "tidb-releases",
    "TiDB GitHub Releases",
    "https://github.com/pingcap/tidb",
    "https://github.com/pingcap/tidb/releases.atom",
    ["tidb", "release", "open-source"],
    "github",
  ),
  official(
    "opengauss-official",
    "openGauss 官方",
    "https://opengauss.org/zh/",
    "https://opengauss.org/zh/news/",
    ["opengauss", "release", "community"],
  ),
  official(
    "opengauss-releases",
    "openGauss GitHub Releases",
    "https://github.com/opengauss-mirror/openGauss-server",
    "https://github.com/opengauss-mirror/openGauss-server/releases.atom",
    ["opengauss", "release", "open-source"],
    "github",
  ),
  official(
    "gaussdb-official",
    "华为云 GaussDB",
    "https://www.huaweicloud.com/product/gaussdb.html",
    "https://support.huaweicloud.com/productdesc-gaussdb/gaussdb_01_0001.html",
    ["gaussdb", "cloud-database", "distributed"],
  ),
  official(
    "gaussdb-docs",
    "GaussDB 文档",
    "https://support.huaweicloud.com/gaussdb/",
    "https://support.huaweicloud.com/gaussdb/",
    ["gaussdb", "documentation", "dba"],
    "manual",
    "manual",
  ),
  official(
    "polardb-official",
    "阿里云 PolarDB",
    "https://www.aliyun.com/product/polardb",
    "https://help.aliyun.com/zh/polardb/polardb-for-xscale/release-notes-11",
    ["polardb", "cloud-native", "serverless"],
  ),
  official(
    "polardb-x-releases",
    "PolarDB-X GitHub Releases",
    "https://github.com/polardb/polardbx-sql",
    "https://github.com/polardb/polardbx-sql/releases.atom",
    ["polardb-x", "release", "distributed"],
    "github",
  ),
  official(
    "tdsql-official",
    "腾讯云 TDSQL",
    "https://cloud.tencent.com/product/tdsql",
    "https://cloud.tencent.com/document/product/1376/125147",
    ["tdsql", "cloud-database", "release"],
  ),
  official(
    "tdsql-docs",
    "TDSQL 产品文档",
    "https://cloud.tencent.com/document/product/1376",
    "https://cloud.tencent.com/document/product/1376",
    ["tdsql", "documentation", "compatibility"],
    "manual",
    "manual",
  ),
  official(
    "vastbase-official",
    "Vastbase 官方",
    "https://www.vastdata.com.cn/",
    "https://www.vastdata.com.cn/",
    ["vastbase", "国产数据库", "compatibility"],
  ),
  official(
    "vastbase-docs",
    "Vastbase 文档",
    "https://docs.vastdata.com.cn/",
    "https://docs.vastdata.com.cn/",
    ["vastbase", "documentation", "dba"],
    "manual",
    "manual",
  ),
  official(
    "sequoiadb-official",
    "SequoiaDB 官方",
    "https://www.sequoiadb.com/",
    "https://www.sequoiadb.com/cn/news",
    ["sequoiadb", "distributed", "multimodel"],
  ),
  official(
    "sequoiadb-docs",
    "SequoiaDB 文档",
    "https://doc.sequoiadb.com/",
    "https://doc.sequoiadb.com/",
    ["sequoiadb", "documentation", "distributed"],
    "manual",
    "manual",
  ),
  official(
    "matrixone-official",
    "MatrixOne 官方文档",
    "https://docs.matrixorigin.cn/",
    "https://docs.matrixorigin.cn/en/v26.3.0.13/MatrixOne/Release-Notes/v22.0.6.0/",
    ["matrixone", "release", "htap"],
  ),
  official(
    "matrixone-releases",
    "MatrixOne GitHub Releases",
    "https://github.com/matrixorigin/matrixone",
    "https://github.com/matrixorigin/matrixone/releases.atom",
    ["matrixone", "release", "open-source"],
    "github",
  ),
  official(
    "doris-official",
    "Apache Doris 官方发布",
    "https://doris.apache.org/zh-CN/",
    "https://doris.apache.org/zh-CN/releases/all-release/",
    ["apache-doris", "olap", "lakehouse"],
  ),
  official(
    "doris-releases",
    "Apache Doris GitHub Releases",
    "https://github.com/apache/doris",
    "https://github.com/apache/doris/releases.atom",
    ["apache-doris", "release", "open-source"],
    "github",
  ),
  official(
    "starrocks-official",
    "StarRocks 官方文档",
    "https://docs.starrocks.io/zh/",
    "https://docs.starrocks.io/zh/docs/release_notes/",
    ["starrocks", "olap", "lakehouse"],
  ),
  official(
    "starrocks-releases",
    "StarRocks GitHub Releases",
    "https://github.com/StarRocks/starrocks",
    "https://github.com/StarRocks/starrocks/releases.atom",
    ["starrocks", "release", "open-source"],
    "github",
  ),
  official(
    "tdengine-official",
    "TDengine 官方",
    "https://tdengine.com/",
    "https://docs.tdengine.com/release-history/",
    ["tdengine", "time-series", "iot"],
  ),
  official(
    "tdengine-releases",
    "TDengine GitHub Releases",
    "https://github.com/taosdata/TDengine",
    "https://github.com/taosdata/TDengine/releases.atom",
    ["tdengine", "release", "open-source"],
    "github",
  ),
  official(
    "nebulagraph-official",
    "NebulaGraph 官方",
    "https://www.nebula-graph.com.cn/",
    "https://docs.nebula-graph.com.cn/3.8.0/20.appendix/release-notes/",
    ["nebulagraph", "graph-database", "release"],
  ),
  official(
    "nebulagraph-releases",
    "NebulaGraph GitHub Releases",
    "https://github.com/vesoft-inc/nebula",
    "https://github.com/vesoft-inc/nebula/releases.atom",
    ["nebulagraph", "release", "open-source"],
    "github",
  ),
  official(
    "milvus-official",
    "Milvus 官方发布",
    "https://milvus.io/zh",
    "https://milvus.io/docs/zh/release_notes.md",
    ["milvus", "vector-database", "release"],
  ),
  official(
    "milvus-releases",
    "Milvus GitHub Releases",
    "https://github.com/milvus-io/milvus",
    "https://github.com/milvus-io/milvus/releases.atom",
    ["milvus", "release", "open-source"],
    "github",
  ),
];

const governanceSources: CatalogSource[] = [
  defineSource({
    slug: "nda-policy",
    name: "国家数据局",
    homepageUrl: "https://www.nda.gov.cn/",
    endpoint: "https://www.nda.gov.cn/sjj/ywpd/szkjyjcss/0110/20250106095112713400492_pc.html",
    adapter: "web-scraper",
    tier: 1,
    role: "policy",
    category: "policy-standard",
    acquisition: "html",
    topics: ["data-infrastructure", "data-policy", "public-data"],
  }),
  defineSource({
    slug: "miit-policy",
    name: "工业和信息化部",
    homepageUrl: "https://www.miit.gov.cn/",
    endpoint: "https://www.miit.gov.cn/zwgk/zcwj/",
    adapter: "web-scraper",
    tier: 1,
    role: "policy",
    category: "policy-standard",
    acquisition: "html",
    topics: ["software-industry", "xinchuang", "standards"],
  }),
  defineSource({
    slug: "tc260-standard",
    name: "全国网络安全标准化技术委员会 TC260",
    homepageUrl: "https://www.tc260.org.cn/",
    endpoint: "https://www.tc260.org.cn/portal/article/2/20250915154109",
    adapter: "web-scraper",
    tier: 1,
    role: "policy",
    category: "policy-standard",
    acquisition: "html",
    topics: ["data-security", "database-security", "standards"],
  }),
  defineSource({
    slug: "caict-database",
    name: "中国信通院数据库研究",
    homepageUrl: "https://www.caict.ac.cn/",
    endpoint: "https://www.caict.ac.cn/kxyj/qwfb/bps/",
    adapter: "web-scraper",
    tier: 1,
    role: "research",
    category: "policy-standard",
    acquisition: "html",
    topics: ["database", "benchmark", "cloud-database"],
  }),
];

const researchSources: CatalogSource[] = [
  defineSource({
    slug: "ccf-database",
    name: "中国计算机学会数据库专业委员会",
    homepageUrl: "https://www.ccf.org.cn/",
    endpoint: "https://www.ccf.org.cn/",
    adapter: "manual",
    tier: 2,
    role: "research",
    category: "research-benchmark",
    acquisition: "manual",
    topics: ["database-research", "conference", "academic"],
  }),
  defineSource({
    slug: "ccf-dasfaa",
    name: "DASFAA 数据库研究会议",
    homepageUrl: "https://www.dasfaa.net/",
    endpoint: "https://www.dasfaa.net/",
    adapter: "manual",
    tier: 2,
    role: "research",
    category: "research-benchmark",
    acquisition: "manual",
    topics: ["database-research", "papers", "systems"],
  }),
  defineSource({
    slug: "dbtest-lab",
    name: "数据库系统质量监督检验公开信息",
    homepageUrl: "https://www.cesi.cn/",
    endpoint: "https://www.cesi.cn/",
    adapter: "manual",
    tier: 2,
    role: "research",
    category: "research-benchmark",
    acquisition: "manual",
    topics: ["database-testing", "standards", "compatibility"],
  }),
  defineSource({
    slug: "gitlink-database",
    name: "GitLink 数据库开源生态",
    homepageUrl: "https://www.gitlink.org.cn/",
    endpoint: "https://www.gitlink.org.cn/",
    adapter: "manual",
    tier: 2,
    role: "research",
    category: "research-benchmark",
    acquisition: "manual",
    topics: ["open-source", "database", "community"],
  }),
];

const discoverySources: CatalogSource[] = [
  defineSource({
    slug: "sse-dameng-listing",
    name: "上海证券交易所·达梦数据上市公告",
    owner: "上海证券交易所",
    homepageUrl: "https://www.sse.com.cn/",
    endpoint:
      "https://www.sse.com.cn/disclosure/announcement/listing/ipo/c/c_20240611_10758581.shtml",
    adapter: "web-scraper",
    tier: 1,
    role: "primary",
    category: "capital-business",
    acquisition: "html",
    topics: ["dameng", "ipo", "capital-market"],
  }),
  defineSource({
    slug: "modb",
    name: "墨天轮",
    homepageUrl: "https://www.modb.pro/",
    endpoint: "https://www.modb.pro/",
    adapter: "manual",
    tier: 3,
    role: "expert",
    category: "database-community",
    acquisition: "manual",
    topics: ["dba", "database-community", "adoption"],
  }),
  defineSource({
    slug: "dtcc",
    name: "DTCC 中国数据库技术大会",
    homepageUrl: "https://dtcc.it168.com/",
    endpoint: "https://dtcc.it168.com/",
    adapter: "manual",
    tier: 2,
    role: "expert",
    category: "database-community",
    acquisition: "manual",
    topics: ["conference", "database-architecture", "dba"],
  }),
  defineSource({
    slug: "infoq-cn-database",
    name: "InfoQ 中文数据库频道",
    homepageUrl: "https://www.infoq.cn/",
    endpoint: "https://www.infoq.cn/topic/database",
    adapter: "manual",
    tier: 2,
    role: "media",
    category: "professional-media",
    acquisition: "manual",
    topics: ["database", "architecture", "business"],
  }),
];

export const sourceCatalog: CatalogSource[] = [
  ...officialSources,
  ...governanceSources,
  ...researchSources,
  ...discoverySources,
];

export function proposalToCatalogSource(proposal: SourceProposalCatalogEntry): CatalogSource {
  const adapter =
    proposal.acquisition === "rss"
      ? "rss"
      : proposal.acquisition === "api"
        ? "generic-api"
        : proposal.acquisition === "github"
          ? "github-releases"
          : proposal.acquisition === "html"
            ? "web-scraper"
            : "manual";
  return {
    slug: proposal.slug,
    name: proposal.name,
    homepageUrl: proposal.homepageUrl,
    endpoint: proposal.endpoint,
    adapter,
    tier: 3,
    role: proposal.role,
    region: proposal.region,
    language: proposal.language,
    authorityScore: 64,
    qualityScore: 35,
    enabled: false,
    lifecycleStatus: "draft",
    category: proposal.category,
    acquisition: proposal.acquisition,
    topics: proposal.topics,
    maintenanceStatus: "proposal",
    cadence: proposal.cadence,
    licenseNote: proposal.licenseNote,
    owner: proposal.name,
    robotsPolicy: proposal.acquisition === "manual" ? "manual-only" : "review-required",
    freshnessSloHours: proposal.cadence === "6h" ? 12 : proposal.cadence === "12h" ? 24 : 168,
    adapterVersion: "1.0.0",
    identityHosts: [new URL(proposal.homepageUrl).hostname],
    proposalIssueNumber: proposal.issueNumber,
    proposalEvidenceUrls: proposal.evidenceUrls,
  };
}

import type { SourceProposalCatalogEntry } from "../domain/source-proposal.js";
