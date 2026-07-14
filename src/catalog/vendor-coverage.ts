import type { CuratedEventSeed } from "./history.js";

export interface PriorityVendorCoverage {
  slug: string;
  name: string;
  region: "CN" | "GLOBAL";
  aliases: readonly string[];
  sourceSlugs: readonly string[];
}

/**
 * China-first database ecosystem matrix. A Source row alone is not coverage:
 * every ecosystem also needs a searchable Event backed by a registered Tier 1
 * entrance. Aliases are product or organization identities, never generic
 * workload terms, so matching does not inflate ecosystem coverage.
 */
export const priorityVendorCoverage: readonly PriorityVendorCoverage[] = [
  {
    slug: "dameng",
    name: "达梦数据库",
    region: "CN",
    aliases: ["dameng", "达梦数据库", "达梦", "dm8", "dsc"],
    sourceSlugs: ["dameng-official", "dameng-docs"],
  },
  {
    slug: "kingbase",
    name: "人大金仓 KingbaseES",
    region: "CN",
    aliases: ["kingbase", "kingbasees", "人大金仓", "金仓", "kes"],
    sourceSlugs: ["kingbase-official", "kingbase-docs"],
  },
  {
    slug: "gbase",
    name: "南大通用 GBase",
    region: "CN",
    aliases: ["gbase", "南大通用", "gbase 8a", "gbase 8s"],
    sourceSlugs: ["gbase-official", "gbase-docs"],
  },
  {
    slug: "goldendb",
    name: "GoldenDB",
    region: "CN",
    aliases: ["goldendb", "金篆信科", "金篆"],
    sourceSlugs: ["goldendb-official", "goldendb-news"],
  },
  {
    slug: "oceanbase",
    name: "OceanBase",
    region: "CN",
    aliases: ["oceanbase", "蚂蚁数据库"],
    sourceSlugs: ["oceanbase-official", "oceanbase-releases"],
  },
  {
    slug: "tidb",
    name: "TiDB / PingCAP",
    region: "CN",
    aliases: ["tidb", "pingcap"],
    sourceSlugs: ["tidb-official", "tidb-releases"],
  },
  {
    slug: "opengauss",
    name: "openGauss",
    region: "CN",
    aliases: ["opengauss", "open gauss", "开源高斯"],
    sourceSlugs: ["opengauss-official", "opengauss-releases"],
  },
  {
    slug: "gaussdb",
    name: "GaussDB",
    region: "CN",
    aliases: ["gaussdb", "华为云 gaussdb"],
    sourceSlugs: ["gaussdb-official", "gaussdb-docs"],
  },
  {
    slug: "polardb",
    name: "PolarDB / PolarDB-X",
    region: "CN",
    aliases: ["polardb", "polardb-x", "阿里云 polardb"],
    sourceSlugs: ["polardb-official", "polardb-x-releases"],
  },
  {
    slug: "tdsql",
    name: "TDSQL",
    region: "CN",
    aliases: ["tdsql", "腾讯云 tdsql"],
    sourceSlugs: ["tdsql-official", "tdsql-docs"],
  },
  {
    slug: "vastbase",
    name: "Vastbase",
    region: "CN",
    aliases: ["vastbase", "海量数据"],
    sourceSlugs: ["vastbase-official", "vastbase-docs"],
  },
  {
    slug: "sequoiadb",
    name: "SequoiaDB",
    region: "CN",
    aliases: ["sequoiadb", "sequoia db", "巨杉数据库", "巨杉"],
    sourceSlugs: ["sequoiadb-official", "sequoiadb-docs"],
  },
  {
    slug: "matrixone",
    name: "MatrixOne",
    region: "CN",
    aliases: ["matrixone", "matrix origin", "matrixorigin", "矩阵起源"],
    sourceSlugs: ["matrixone-official", "matrixone-releases"],
  },
  {
    slug: "apache-doris",
    name: "Apache Doris",
    region: "CN",
    aliases: ["apache doris", "doris", "飞轮科技"],
    sourceSlugs: ["doris-official", "doris-releases"],
  },
  {
    slug: "starrocks",
    name: "StarRocks",
    region: "CN",
    aliases: ["starrocks", "star rocks", "镜舟科技"],
    sourceSlugs: ["starrocks-official", "starrocks-releases"],
  },
  {
    slug: "tdengine",
    name: "TDengine",
    region: "CN",
    aliases: ["tdengine", "taosdata", "涛思数据"],
    sourceSlugs: ["tdengine-official", "tdengine-releases"],
  },
  {
    slug: "nebulagraph",
    name: "NebulaGraph",
    region: "CN",
    aliases: ["nebulagraph", "nebula graph", "悦数科技"],
    sourceSlugs: ["nebulagraph-official", "nebulagraph-releases"],
  },
  {
    slug: "milvus",
    name: "Milvus / Zilliz",
    region: "CN",
    aliases: ["milvus", "zilliz"],
    sourceSlugs: ["milvus-official", "milvus-releases"],
  },
] as const;

export function eventSearchText(event: CuratedEventSeed): string {
  return [event.title, event.company, event.fact, event.summary, ...event.keywords]
    .join(" ")
    .toLowerCase();
}

export function eventsForVendor(
  events: readonly CuratedEventSeed[],
  vendor: PriorityVendorCoverage,
): CuratedEventSeed[] {
  return events.filter((event) => {
    const search = eventSearchText(event);
    return vendor.aliases.some((alias) => search.includes(alias.toLowerCase()));
  });
}
