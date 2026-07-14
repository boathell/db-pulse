import { describe, expect, it } from "vitest";
import { influencerCatalog } from "../src/catalog/influencers.js";
import { capabilities, productVersion, releases } from "../src/catalog/product.js";
import { sourceCatalog } from "../src/catalog/sources.js";

const ecosystemPrefixes = [
  "dameng",
  "kingbase",
  "gbase",
  "goldendb",
  "oceanbase",
  "tidb",
  "opengauss",
  "gaussdb",
  "polardb",
  "tdsql",
  "vastbase",
  "sequoiadb",
  "matrixone",
  "doris",
  "starrocks",
  "tdengine",
  "nebulagraph",
  "milvus",
] as const;

describe("DB Pulse source and product catalogs", () => {
  it("defines exactly 48 China-first sources behind the draft or shadow gate", () => {
    expect(sourceCatalog).toHaveLength(48);
    expect(new Set(sourceCatalog.map((source) => source.slug)).size).toBe(48);
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
  });

  it("keeps the required 36 + 4 + 4 + 4 source portfolio", () => {
    const official = sourceCatalog.filter((source) =>
      ["database-vendor", "open-source-database", "cloud-database"].includes(source.category),
    );
    expect(official).toHaveLength(36);
    expect(sourceCatalog.filter((source) => source.category === "policy-standard")).toHaveLength(4);
    expect(sourceCatalog.filter((source) => source.category === "research-benchmark")).toHaveLength(
      4,
    );
    expect(
      sourceCatalog.filter((source) =>
        ["capital-business", "professional-media", "database-community"].includes(source.category),
      ),
    ).toHaveLength(4);
  });

  it("covers all 18 core ecosystems with two official evidence entrances", () => {
    for (const prefix of ecosystemPrefixes) {
      const entrances = sourceCatalog.filter((source) => source.slug.startsWith(`${prefix}-`));
      expect(entrances, prefix).toHaveLength(2);
      expect(new Set(entrances.map((source) => source.owner)).size, prefix).toBe(1);
    }
  });

  it("keeps the confirmed release and policy entry points canonical", () => {
    const endpoints = new Map(sourceCatalog.map((source) => [source.slug, source.endpoint]));
    expect(endpoints.get("opengauss-official")).toBe("https://opengauss.org/zh/news/");
    expect(endpoints.get("polardb-official")).toBe(
      "https://help.aliyun.com/zh/polardb/polardb-for-xscale/release-notes-11",
    );
    expect(endpoints.get("tdsql-official")).toBe(
      "https://cloud.tencent.com/document/product/1376/125147",
    );
    expect(endpoints.get("doris-official")).toBe(
      "https://doris.apache.org/zh-CN/releases/all-release/",
    );
    expect(endpoints.get("milvus-official")).toBe("https://milvus.io/docs/zh/release_notes.md");
    expect(endpoints.get("matrixone-official")).toBe(
      "https://docs.matrixorigin.cn/en/v26.3.0.13/MatrixOne/Release-Notes/v22.0.6.0/",
    );
    expect(endpoints.get("nda-policy")).toBe(
      "https://www.nda.gov.cn/sjj/ywpd/szkjyjcss/0110/20250106095112713400492_pc.html",
    );
    expect(endpoints.get("tc260-standard")).toBe(
      "https://www.tc260.org.cn/portal/article/2/20250915154109",
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
    expect(influencerCatalog.length).toBeGreaterThanOrEqual(4);
    expect(influencerCatalog.every((entry) => entry.region === "CN")).toBe(true);
    expect(influencerCatalog.every((entry) => entry.focus.length > 0)).toBe(true);
    expect(
      influencerCatalog.some((entry) =>
        entry.focus.some((topic) => /database|dba|数据库/i.test(topic)),
      ),
    ).toBe(true);
  });
});
