export type InfluencerPlatform = "website" | "x" | "linkedin" | "weibo" | "jike" | "github";

export interface InfluencerProfile {
  platform: InfluencerPlatform;
  handle: string;
  url: string;
  access: "automatic" | "restricted";
}

export interface InfluencerCatalogEntry {
  slug: string;
  name: string;
  region: "CN" | "GLOBAL";
  focus: string[];
  feedSourceSlug?: string;
  profiles: InfluencerProfile[];
}

export const influencerCatalog: readonly InfluencerCatalogEntry[] = [
  {
    slug: "oceanbase-community",
    name: "OceanBase 社区",
    region: "CN",
    focus: ["distributed database", "HTAP", "operations"],
    feedSourceSlug: "oceanbase-official",
    profiles: [
      {
        platform: "website",
        handle: "oceanbase.com",
        url: "https://www.oceanbase.com/",
        access: "automatic",
      },
    ],
  },
  {
    slug: "tidb-community",
    name: "TiDB 社区",
    region: "CN",
    focus: ["distributed SQL", "HTAP", "open source"],
    feedSourceSlug: "tidb-official",
    profiles: [
      {
        platform: "website",
        handle: "tidb.net",
        url: "https://tidb.net/",
        access: "automatic",
      },
      {
        platform: "github",
        handle: "pingcap",
        url: "https://github.com/pingcap",
        access: "automatic",
      },
    ],
  },
  {
    slug: "opengauss-community",
    name: "openGauss 社区",
    region: "CN",
    focus: ["relational database", "open source", "xinchuang"],
    feedSourceSlug: "opengauss-official",
    profiles: [
      {
        platform: "website",
        handle: "opengauss.org",
        url: "https://opengauss.org/zh/",
        access: "automatic",
      },
      {
        platform: "github",
        handle: "opengauss-mirror",
        url: "https://github.com/opengauss-mirror",
        access: "automatic",
      },
    ],
  },
  {
    slug: "modb-community",
    name: "墨天轮数据库社区",
    region: "CN",
    focus: ["DBA", "database operations", "industry adoption"],
    profiles: [
      {
        platform: "website",
        handle: "modb.pro",
        url: "https://www.modb.pro/",
        access: "restricted",
      },
    ],
  },
];
