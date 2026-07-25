import { describe, expect, it } from "vitest";
import { influencerCatalog } from "../src/catalog/influencers.js";
import { capabilities, productVersion, releases } from "../src/catalog/product.js";
import { sourceCatalog } from "../src/catalog/sources.js";

const ecosystemPrefixes = [
  "dameng",
  "kingbase",
  "oceanbase",
  "tidb",
  "polardb",
  "tdsql",
  "starrocks",
  "tdengine",
] as const;

describe("DB Pulse source and product catalogs", () => {
  it("defines exactly 26 retained China-first sources behind the draft or shadow gate", () => {
    expect(sourceCatalog).toHaveLength(26);
    expect(new Set(sourceCatalog.map((source) => source.slug)).size).toBe(26);
    expect(sourceCatalog.every((source) => source.region === "CN")).toBe(true);
    expect(sourceCatalog.every((source) => source.enabled === false)).toBe(true);
    expect(
      sourceCatalog.every((source) => ["draft", "shadow"].includes(source.lifecycleStatus)),
    ).toBe(true);
    expect(sourceCatalog.every((source) => Boolean(source.owner?.trim()))).toBe(true);
    expect(sourceCatalog.every((source) => Boolean(source.robotsPolicy))).toBe(true);
    expect(sourceCatalog.every((source) => (source.freshnessSloHours ?? 0) > 0)).toBe(true);
    expect(sourceCatalog.every((source) => Boolean(source.adapterVersion?.trim()))).toBe(true);
    expect(() =>
      sourceCatalog.forEach((source) => {
        new URL(source.endpoint);
      }),
    ).not.toThrow();
    expect(
      sourceCatalog.some((source) =>
        [
          "sse-dameng-listing",
          "dbtest-lab",
          "ccf-dasfaa",
          "tc260-standard",
          "milvus-official",
          "milvus-releases",
          "nebulagraph-official",
          "nebulagraph-releases",
          "doris-official",
          "doris-releases",
          "matrixone-official",
          "matrixone-releases",
          "sequoiadb-official",
          "sequoiadb-docs",
          "vastbase-official",
          "vastbase-docs",
          "gaussdb-official",
          "gaussdb-docs",
          "opengauss-official",
          "opengauss-releases",
          "goldendb-official",
          "goldendb-news",
          "gbase-official",
          "gbase-docs",
        ].includes(source.slug),
      ),
    ).toBe(false);
  });

  it("keeps the required baseline plus two restricted social sources", () => {
    const official = sourceCatalog.filter((source) =>
      ["database-vendor", "open-source-database", "cloud-database"].includes(source.category),
    );
    expect(official).toHaveLength(17);
    expect(sourceCatalog.filter((source) => source.category === "policy-standard")).toHaveLength(3);
    expect(sourceCatalog.filter((source) => source.category === "research-benchmark")).toHaveLength(
      2,
    );
    expect(
      sourceCatalog.filter((source) =>
        ["capital-business", "professional-media", "database-community"].includes(source.category),
      ),
    ).toHaveLength(3);
    expect(sourceCatalog.filter((source) => source.category === "expert")).toHaveLength(1);
    expect(sourceCatalog.filter((source) => source.acquisition === "social")).toEqual([
      expect.objectContaining({
        slug: "greptimedb-wechat",
        adapter: "manual",
        tier: 1,
        role: "primary",
        maintenanceStatus: "restricted",
        lifecycleStatus: "shadow",
        enabled: false,
      }),
      expect.objectContaining({
        slug: "zhuang-xiaodan-wechat",
        adapter: "manual",
        tier: 3,
        role: "expert",
        category: "expert",
        maintenanceStatus: "restricted",
        lifecycleStatus: "shadow",
        enabled: false,
      }),
    ]);
    expect(
      new Set(
        sourceCatalog
          .filter((source) => ["greptimedb-wechat", "zhuang-xiaodan-wechat"].includes(source.slug))
          .map((source) => source.owner),
      ).size,
    ).toBe(1);
  });

  it("covers all 8 retained core ecosystems with two official evidence entrances", () => {
    for (const prefix of ecosystemPrefixes) {
      const entrances = sourceCatalog.filter((source) => source.slug.startsWith(`${prefix}-`));
      expect(entrances, prefix).toHaveLength(2);
      expect(new Set(entrances.map((source) => source.owner)).size, prefix).toBe(1);
    }
  });

  it("keeps the confirmed release and policy entry points canonical", () => {
    const endpoints = new Map(sourceCatalog.map((source) => [source.slug, source.endpoint]));
    expect(endpoints.get("polardb-official")).toBe(
      "https://help.aliyun.com/zh/polardb/polardb-for-xscale/release-notes-11",
    );
    expect(endpoints.get("tdsql-official")).toBe(
      "https://cloud.tencent.com/document/product/1376/125147",
    );
    expect(endpoints.get("nda-policy")).toBe(
      "https://www.nda.gov.cn/sjj/ywpd/szkjyjcss/0110/20250106095112713400492_pc.html",
    );
  });

  it("resets the public product history to 0.1.0 without claiming planned forecasting", () => {
    expect(productVersion).toBe("0.1.0");
    expect(releases).toHaveLength(1);
    expect(releases[0]).toMatchObject({ version: "0.1.0", status: "unreleased" });
    expect(capabilities.some((item) => item.slug === "probabilistic-forecasting")).toBe(true);
    expect(capabilities.find((item) => item.slug === "probabilistic-forecasting")?.status).toBe(
      "planned",
    );
  });

  it("uses a China database community matrix rather than an AI influencer list", () => {
    expect(influencerCatalog.length).toBeGreaterThanOrEqual(5);
    expect(influencerCatalog.every((entry) => entry.region === "CN")).toBe(true);
    expect(influencerCatalog.every((entry) => entry.focus.length > 0)).toBe(true);
    expect(
      influencerCatalog.some((entry) =>
        entry.focus.some((topic) => /database|dba|数据库/i.test(topic)),
      ),
    ).toBe(true);
    const zhuangXiaodan = influencerCatalog.find((entry) => entry.slug === "zhuang-xiaodan");
    expect(zhuangXiaodan).toMatchObject({
      name: "庄晓丹 / Dennis Zhuang",
      profiles: [
        {
          platform: "github",
          handle: "killme2008",
          url: "https://github.com/killme2008",
        },
        {
          platform: "website",
          url: "https://greptime.com/blogs/authors/dennis_zhuang",
        },
      ],
    });
    expect(zhuangXiaodan).not.toHaveProperty("feedSourceSlug");
  });
});
