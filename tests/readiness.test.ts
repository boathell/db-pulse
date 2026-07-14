import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { historicalEvents } from "../src/catalog/history.js";
import { loadConfig } from "../src/config/env.js";
import { createDatabase } from "../src/db/database.js";
import { migrateToLatest } from "../src/db/migrate.js";
import { Repository } from "../src/db/repository.js";
import { seedDatabase } from "../src/db/seed.js";
import { evaluateEventReadiness, eventReadinessSummary } from "../src/pipeline/readiness.js";

const databases: ReturnType<typeof createDatabase>[] = [];
afterEach(async () => {
  while (databases.length) await databases.pop()?.destroy();
});

async function setup() {
  const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: "sqlite::memory:" });
  const db = createDatabase(config);
  databases.push(db);
  await migrateToLatest(db, config);
  await seedDatabase(db);
  return { db, repository: new Repository(db) };
}

describe("event publication readiness", () => {
  it("accepts a curated first-party milestone and labels its evidence level", async () => {
    const { db, repository } = await setup();
    const event = (await repository.listEvents("published")).find(
      (item) => item.slug === "oceanbase-official-ecosystem-baseline",
    );
    expect(event).toBeTruthy();

    const readiness = await evaluateEventReadiness(db, event?.id ?? "missing");

    expect(readiness).toMatchObject({
      status: "ready",
      blockers: [],
      evidenceLevel: "single-primary",
      independentSources: 1,
      primaryEvidence: 1,
    });
    expect(readiness.warnings).toContain("single-source fact; cross-source corroboration pending");
  });

  it("publishes the DTCC observability Event from two independent Tier 2 owners", async () => {
    const { db, repository } = await setup();
    const event = (await repository.listEvents("published")).find(
      (item) => item.slug === "database-observability-enters-platform-engineering",
    );
    expect(event).toBeTruthy();

    const evidence = await db
      .selectFrom("event_signals")
      .innerJoin("signals", "signals.id", "event_signals.signal_id")
      .innerJoin("sources", "sources.id", "signals.source_id")
      .select(["sources.slug", "sources.owner", "sources.role", "sources.source_category"])
      .where("event_signals.event_id", "=", event?.id ?? "missing")
      .execute();
    expect(evidence.map((item) => item.slug).sort()).toEqual(["dtcc", "infoq-cn-database"]);
    expect(new Set(evidence.map((item) => item.owner)).size).toBe(2);
    expect(evidence.every((item) => item.role !== "aggregator")).toBe(true);
    expect(evidence.every((item) => item.source_category !== "aggregator")).toBe(true);

    await expect(evaluateEventReadiness(db, event?.id ?? "missing")).resolves.toMatchObject({
      status: "ready",
      blockers: [],
      primaryEvidence: 0,
      independentSources: 2,
      evidenceLevel: "multi-source",
    });
  });

  it("accepts two independent Tier 2 sources but rejects a single, aggregator, or shared owner", async () => {
    const { db, repository } = await setup();
    const event = (await repository.listEvents("published")).find(
      (item) => item.slug === "oceanbase-official-ecosystem-baseline",
    );
    expect(event).toBeTruthy();
    await db
      .deleteFrom("event_signals")
      .where("event_id", "=", event?.id ?? "missing")
      .execute();

    const sources = new Map(
      (await repository.listSources()).map((source) => [source.slug, source]),
    );
    const first = sources.get("ccf-database");
    const sharedOwner = sources.get("dbtest-lab");
    const independent = sources.get("infoq-cn-database");
    const aggregator = sources.get("modb");
    expect([first, sharedOwner, independent, aggregator].every(Boolean)).toBe(true);
    await repository.updateSource(first?.id ?? "missing", {
      tier: 2,
      role: "research",
      source_category: "research-benchmark",
      owner: "Independent Research Group A",
    });
    await repository.updateSource(sharedOwner?.id ?? "missing", {
      tier: 2,
      role: "research",
      source_category: "research-benchmark",
      owner: "Independent Research Group A",
    });
    await repository.updateSource(independent?.id ?? "missing", {
      tier: 2,
      role: "media",
      source_category: "professional-media",
      owner: "Independent Media Group B",
    });
    const attach = async (sourceId: string, suffix: string, author: string) => {
      const signal = await repository.insertSignal(sourceId, {
        url: `https://example.com/readiness/${suffix}`,
        title: `Database evidence ${suffix}`,
        summary: `Independent database evidence record ${suffix} for the publication gate.`,
        author,
        language: "en",
        publishedAt: "2026-07-13T00:00:00.000Z",
        category: "architecture",
        tags: ["database", "evidence"],
        metrics: {},
        rawMeta: {},
      });
      await repository.attachSignal(event?.id ?? "missing", signal?.id ?? "missing", "primary", 90);
    };

    await attach(first?.id ?? "missing", "tier2-a", "Author A");
    let readiness = await evaluateEventReadiness(db, event?.id ?? "missing");
    expect(readiness.blockers).toContain("insufficient_independent_evidence");
    expect(readiness.independentSources).toBe(1);

    await attach(aggregator?.id ?? "missing", "aggregator", "Aggregator Author");
    await repository.updateSource(aggregator?.id ?? "missing", {
      tier: 2,
      role: "aggregator",
      source_category: "aggregator",
      owner: "Aggregator Network",
    });
    readiness = await evaluateEventReadiness(db, event?.id ?? "missing");
    expect(readiness.blockers).toContain("insufficient_independent_evidence");
    expect(readiness.independentSources).toBe(1);

    await attach(sharedOwner?.id ?? "missing", "same-owner", "Author B");
    readiness = await evaluateEventReadiness(db, event?.id ?? "missing");
    expect(readiness.blockers).toContain("insufficient_independent_evidence");
    expect(readiness.independentSources).toBe(1);

    await attach(independent?.id ?? "missing", "tier2-b", "Author C");
    readiness = await evaluateEventReadiness(db, event?.id ?? "missing");
    expect(readiness).toMatchObject({
      status: "ready",
      blockers: [],
      primaryEvidence: 0,
      independentSources: 2,
      evidenceLevel: "multi-source",
    });
  });

  it("blocks placeholder clusters from publication", async () => {
    const { db, repository } = await setup();
    const source = (await repository.listSources()).find(
      (item) => item.slug === "oceanbase-official",
    );
    await repository.updateSource(source?.id ?? "missing", {
      lifecycle_status: "active",
      enabled: 1,
    });
    expect(source).toBeTruthy();
    const signal = await repository.insertSignal(source?.id ?? "missing", {
      url: "https://www.oceanbase.com/blog/fixture-readiness-event/",
      title: "Fixture database product announcement",
      summary: "A source signal that is intentionally clustered into an unedited review event.",
      author: "OceanBase",
      language: "en",
      publishedAt: "2026-07-12T00:00:00.000Z",
      category: "industry",
      tags: [],
      metrics: {},
      rawMeta: {},
    });
    const original = await db.selectFrom("events").selectAll().limit(1).executeTakeFirstOrThrow();
    const event = {
      ...original,
      id: randomUUID(),
      slug: "fixture-readiness-placeholder",
      title: "Fixture database product announcement",
      fact_summary: "待编辑：补充事实",
      summary: "待编辑：补充摘要",
      technical_insight: "待编辑：补充技术判断",
      industry_insight: "待编辑：补充行业判断",
      future_outlook: "待编辑：补充下一信号",
      business_value: "待编辑：补充行动建议",
      category: "industry",
      company: "industry",
      keywords_json: "[]",
      status: "review",
      published_at: null,
    };
    await db.insertInto("events").values(event).execute();
    await repository.attachSignal(event.id, signal?.id ?? "missing", "primary", 100);

    const readiness = await evaluateEventReadiness(db, event.id);

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers).toEqual(
      expect.arrayContaining([
        "placeholder_content",
        "generic_entity",
        "missing_category",
        "missing_track",
      ]),
    );
  });

  it("does not allow a high heat label without cross-source and cross-platform factors", async () => {
    const { db, repository } = await setup();
    const event = (await repository.listEvents("published")).find(
      (item) => item.slug === "oceanbase-official-ecosystem-baseline",
    );

    const readiness = await evaluateEventReadiness(db, event?.id ?? "missing", {
      heat_score: 90,
      score_factors_json: JSON.stringify({ independentSources: 1, platformBreadth: 1 }),
    });

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers).toContain("unsupported_heat");
  });

  it("blocks incomplete English content from both locale publication paths", async () => {
    const { db, repository } = await setup();
    const event = (await repository.listEvents("published")).find(
      (item) => item.slug === "oceanbase-official-ecosystem-baseline",
    );
    await db
      .updateTable("event_localizations")
      .set({ future_outlook: "TBD" })
      .where("event_id", "=", event?.id ?? "missing")
      .where("locale", "=", "en")
      .execute();

    const readiness = await evaluateEventReadiness(db, event?.id ?? "missing");
    expect(readiness.blockers).toContain("missing_english_localization");
    await expect(repository.publicEvents("zh-CN")).rejects.toThrow(
      "incomplete English localization",
    );
    await expect(repository.publicEvents("en")).rejects.toThrow("incomplete English localization");
  });

  it("blocks research events that do not explain method, impact, and what to verify next", async () => {
    const { db, repository } = await setup();
    const event = (await repository.listEvents("published")).find(
      (item) => item.slug === "oceanbase-official-ecosystem-baseline",
    );

    const readiness = await evaluateEventReadiness(db, event?.id ?? "missing", {
      category: "research",
      technical_insight: "Only a result headline.",
      industry_insight: "Too little context.",
      future_outlook: "Wait.",
    });

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers).toContain("thin_research_analysis");
  });

  it("accepts concise research analysis above the reduced depth floor", async () => {
    const { db, repository } = await setup();
    const event = (await repository.listEvents("published")).find(
      (item) => item.slug === "oceanbase-official-ecosystem-baseline",
    );
    const technical =
      "The method compares controlled reasoning budgets across reproducible task variants.";
    const industry = "This changes how teams compare database reliability and total workload cost.";
    const future = "Reproduce the result on private workloads and newer database versions.";
    expect(technical.length).toBeGreaterThanOrEqual(56);
    expect(industry.length).toBeGreaterThanOrEqual(36);
    expect(future.length).toBeGreaterThanOrEqual(28);

    const readiness = await evaluateEventReadiness(db, event?.id ?? "missing", {
      category: "research",
      technical_insight: technical,
      industry_insight: industry,
      future_outlook: future,
    });

    expect(readiness.status).toBe("ready");
    expect(readiness.blockers).not.toContain("thin_research_analysis");
  });

  it("summarizes blockers across the editorial backlog", async () => {
    const { db } = await setup();
    const summary = await eventReadinessSummary(db);
    expect(summary.total).toBe(historicalEvents.length);
    expect(summary.ready).toBeGreaterThan(0);
    expect(summary.ready + summary.blocked).toBe(summary.total);
  });
});
