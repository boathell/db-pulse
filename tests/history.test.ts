import { describe, expect, it } from "vitest";
import { historicalEvents, industryNarratives } from "../src/catalog/history.js";
import { sourceCatalog } from "../src/catalog/sources.js";
import { eventsForVendor, priorityVendorCoverage } from "../src/catalog/vendor-coverage.js";

const ecosystemSlugs = [
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
  "apache-doris",
  "starrocks",
  "tdengine",
  "nebulagraph",
  "milvus",
] as const;

describe("China database industry baseline", () => {
  it("publishes at least 36 bilingual, source-backed Events with measured heat disabled", () => {
    const sources = new Map(sourceCatalog.map((source) => [source.slug, source]));
    expect(historicalEvents.length).toBeGreaterThanOrEqual(36);
    expect(new Set(historicalEvents.map((event) => event.slug)).size).toBe(36);
    for (const event of historicalEvents) {
      expect(event.date >= "2022-01-01").toBe(true);
      expect(new URL(event.url).protocol).toBe("https:");
      expect(sources.get(event.source)).toBeDefined();
      expect(event.scores[1]).toBe(0);
      expect(event.en).toBeDefined();
      expect(Object.values(event.en ?? {}).every((value) => value.trim().length > 0)).toBe(true);
      expect(event.tracks.length).toBeGreaterThan(0);
      const evidenceSources = [event.source, ...(event.evidence ?? []).map((item) => item.source)]
        .map((slug) => sources.get(slug))
        .filter((source): source is NonNullable<typeof source> => Boolean(source));
      const hasPrimary = evidenceSources.some((source) => source.tier === 1);
      const independentTier2 = new Set(
        evidenceSources
          .filter(
            (source) =>
              source.tier === 2 && source.role !== "aggregator" && source.category !== "aggregator",
          )
          .map((source) => source.owner ?? source.name),
      ).size;
      expect(hasPrimary || independentTier2 >= 2, event.slug).toBe(true);
    }
  });

  it("keeps the DTCC observability Event on two independent, non-aggregator Tier 2 owners", () => {
    const event = historicalEvents.find(
      (item) => item.slug === "database-observability-enters-platform-engineering",
    );
    expect(event).toMatchObject({
      source: "dtcc",
      actors: ["dtcc-expert-network"],
      evidence: [{ source: "infoq-cn-database" }],
    });
    const sources = [event?.source, ...(event?.evidence ?? []).map((item) => item.source)].map(
      (slug) => sourceCatalog.find((source) => source.slug === slug),
    );
    expect(sources.every((source) => source?.tier === 2)).toBe(true);
    expect(sources.every((source) => source?.role !== "aggregator")).toBe(true);
    expect(new Set(sources.map((source) => source?.owner)).size).toBe(2);
  });

  it("gives every core ecosystem an official baseline Event", () => {
    for (const ecosystem of ecosystemSlugs) {
      expect(
        historicalEvents.some(
          (event) =>
            event.slug === `${ecosystem.replace("apache-", "")}-official-ecosystem-baseline` ||
            event.actors.includes(ecosystem),
        ),
        ecosystem,
      ).toBe(true);
    }
  });

  it("maps all 18 ecosystem alias sets to Tier 1 entrances and public Events", () => {
    const sources = new Map(sourceCatalog.map((source) => [source.slug, source]));
    expect(priorityVendorCoverage).toHaveLength(18);
    expect(priorityVendorCoverage.map((vendor) => vendor.slug)).toEqual(ecosystemSlugs);
    for (const vendor of priorityVendorCoverage) {
      expect(vendor.region).toBe("CN");
      expect(vendor.aliases.length, vendor.slug).toBeGreaterThanOrEqual(2);
      expect(vendor.sourceSlugs, vendor.slug).toHaveLength(2);
      expect(
        vendor.sourceSlugs.every((slug) => sources.get(slug)?.tier === 1),
        vendor.slug,
      ).toBe(true);
      expect(eventsForVendor(historicalEvents, vendor).length, vendor.slug).toBeGreaterThan(0);
    }
  });

  it("covers architecture, policy, adoption, capital and cross-product evolution", () => {
    expect(historicalEvents.filter((event) => event.category === "architecture")).toHaveLength(6);
    expect(historicalEvents.filter((event) => event.category === "policy")).toHaveLength(5);
    expect(
      historicalEvents.filter((event) => ["commercial", "adoption"].includes(event.category)),
    ).toHaveLength(6);
    expect(
      historicalEvents.filter((event) => event.category === "ecosystem-baseline"),
    ).toHaveLength(18);
    expect(historicalEvents.filter((event) => event.category === "capital")).toHaveLength(1);
    expect(historicalEvents.find((event) => event.category === "capital")).toMatchObject({
      source: "sse-dameng-listing",
      actors: ["dameng"],
    });
  });

  it("maps the 2022 baseline into four required phases and four database decision roles", () => {
    expect(industryNarratives.horizon.start).toBe("2022-01-01");
    expect(industryNarratives.horizon.end).toBe("2026-07-14");
    expect(industryNarratives.tracks).toHaveLength(6);
    const expectedStages = ["架构演进", "生产验证扩展", "生态与政策加速", "当前阶段：证据化决策"];
    const roles = ["ceo", "dba", "data-architect", "practitioner"];
    for (const track of industryNarratives.tracks) {
      expect(track.stages.map((stage) => stage.label)).toEqual(expectedStages);
      expect(track.lenses.map((lens) => lens.role)).toEqual(roles);
      expect(track.next.length).toBeGreaterThan(20);
    }
  });

  it("admits AI only when it directly changes database query, management, or operations", () => {
    const aiEvents = historicalEvents.filter((event) =>
      `${event.title} ${event.summary} ${event.keywords.join(" ")}`.match(/\bAI\b|人工智能/i),
    );
    expect(aiEvents.length).toBeGreaterThan(0);
    for (const event of aiEvents) {
      expect(`${event.fact} ${event.summary} ${event.technical}`).toMatch(
        /数据库|查询|数据管理|运维|向量|索引/i,
      );
    }
  });
});
