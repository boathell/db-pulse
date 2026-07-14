import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/env.js";
import { createDatabase } from "../src/db/database.js";
import { migrateToLatest } from "../src/db/migrate.js";
import { Repository } from "../src/db/repository.js";
import { seedDatabase } from "../src/db/seed.js";
import { generatePipelineFunnel } from "../src/pipeline/funnel.js";

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
  return db;
}

describe("pipeline funnel", () => {
  it("reports a coherent signal-to-publication snapshot", async () => {
    const report = await generatePipelineFunnel(await setup());

    expect(report.signals.total).toBeGreaterThan(0);
    expect(report.signals.clustered + report.signals.backlog + report.signals.deferred).toBe(
      report.signals.total,
    );
    expect(report.signals.primary + report.signals.aggregatorDebt).toBe(report.signals.total);
    expect(report.events.total).toBe(
      report.events.draft + report.events.review + report.events.published + report.events.hidden,
    );
    expect(report.events.multiSource + report.events.singleSource + report.events.noEvidence).toBe(
      report.events.total,
    );
    expect(report.events.ready + report.events.blocked).toBe(report.events.total);
    expect(report.conversion.eventToPublishedPercent).toBeGreaterThan(0);
  });

  it("exposes publication blockers instead of hiding editorial debt", async () => {
    const db = await setup();
    const event = await db.selectFrom("events").select("id").limit(1).executeTakeFirstOrThrow();
    await db
      .updateTable("events")
      .set({ summary: "待编辑", fact_summary: "待编辑" })
      .where("id", "=", event.id)
      .execute();

    const report = await generatePipelineFunnel(db);

    expect(report.events.placeholder).toBeGreaterThan(0);
    expect(report.blockerCounts.placeholder_content).toBeGreaterThan(0);
  });

  it("excludes legacy AI sources, signals and events from the operating funnel", async () => {
    const db = await setup();
    const baseline = await generatePipelineFunnel(db);
    const source = await db.selectFrom("sources").selectAll().executeTakeFirstOrThrow();
    await db
      .insertInto("sources")
      .values({
        ...source,
        id: "legacy-funnel-source",
        slug: "legacy-funnel-source",
        content_domain: "ai-industry",
      })
      .execute();
    const signal = await new Repository(db).insertSignal("legacy-funnel-source", {
      externalId: "legacy-funnel-signal",
      url: "https://example.com/legacy-funnel-signal",
      title: "Legacy AI signal",
      summary: "Legacy AI signal that must not affect DB Pulse operating metrics.",
      language: "en",
      publishedAt: "2026-07-12T00:00:00.000Z",
      category: "legacy",
      tags: ["legacy"],
      metrics: {},
      rawMeta: {},
    });
    const event = await db.selectFrom("events").selectAll().executeTakeFirstOrThrow();
    await db
      .insertInto("events")
      .values({
        ...event,
        id: "legacy-funnel-event",
        slug: "legacy-funnel-event",
        content_domain: "ai-industry",
      })
      .execute();
    await new Repository(db).attachSignal(
      "legacy-funnel-event",
      signal?.id ?? "missing",
      "primary",
      100,
    );

    const report = await generatePipelineFunnel(db);
    expect(report.signals).toEqual(baseline.signals);
    expect(report.events).toEqual(baseline.events);
    expect(report.conversion).toEqual(baseline.conversion);
    expect(report.blockerCounts).toEqual(baseline.blockerCounts);
  });
});
