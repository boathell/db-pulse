import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/env.js";
import { createDatabase } from "../src/db/database.js";
import { migrateToLatest } from "../src/db/migrate.js";
import { Repository } from "../src/db/repository.js";
import { seedDatabase } from "../src/db/seed.js";
import { clusterSignals } from "../src/pipeline/cluster.js";

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

describe("signal eventability triage", () => {
  it("defers an isolated media commentary instead of creating timeline noise", async () => {
    const { db, repository } = await setup();
    const media = (await repository.listSources()).find(
      (source) => source.slug === "infoq-cn-database",
    );
    expect(media).toBeTruthy();
    await repository.updateSource(media?.id ?? "missing", {
      lifecycle_status: "active",
      enabled: 1,
    });
    const inserted = await repository.insertSignal(media?.id ?? "missing", {
      url: "https://www.infoq.cn/article/fixture-opinion-only",
      title: "A broad opinion about the future of databases",
      summary: "Commentary without a concrete release, adoption, policy, or research milestone.",
      language: "en",
      publishedAt: "2026-07-12T00:00:00.000Z",
      category: "industry",
      tags: [],
      metrics: {},
      rawMeta: { quality: { score: 60 } },
    });
    const before = await eventCount(db);

    const result = await clusterSignals(db);

    expect(result).toMatchObject({ created: 0, deferred: 1 });
    expect(await eventCount(db)).toBe(before);
    expect(
      await db
        .selectFrom("signal_triage")
        .select(["status", "reason", "eventability_score"])
        .where("signal_id", "=", inserted?.id ?? "missing")
        .executeTakeFirstOrThrow(),
    ).toMatchObject({ status: "deferred", reason: "insufficient_eventability" });
  });

  it("creates a review event for a concrete first-party database launch", async () => {
    const { db, repository } = await setup();
    const source = (await repository.listSources()).find(
      (item) => item.slug === "oceanbase-official",
    );
    await repository.updateSource(source?.id ?? "missing", {
      lifecycle_status: "active",
      enabled: 1,
    });
    await repository.insertSignal(source?.id ?? "missing", {
      url: "https://www.oceanbase.com/blog/fixture-database-launch/",
      title: "FixtureDB 1.0 database release launches with recovery improvements",
      summary:
        "A concrete first-party database launch with architecture and operations implications.",
      language: "en",
      publishedAt: "2026-07-12T00:00:00.000Z",
      category: "database-release",
      tags: ["database", "release"],
      metrics: {},
      rawMeta: { quality: { score: 80 } },
    });

    const result = await clusterSignals(db);

    expect(result).toMatchObject({ created: 1, deferred: 0 });
    expect(
      (await repository.listEvents("review")).some((event) => event.title.includes("FixtureDB")),
    ).toBe(true);
  });

  it("keeps healthy shadow-source signals in observation until activation", async () => {
    const { db, repository } = await setup();
    const source = (await repository.listSources()).find(
      (item) => item.slug === "opengauss-official",
    );
    expect(source?.lifecycle_status).toBe("shadow");
    const inserted = await repository.insertSignal(source?.id ?? "missing", {
      url: "https://opengauss.org/zh/news/fixture-observation",
      title: "openGauss releases Fixture Observation database version",
      summary:
        "A concrete official database release that remains non-production during shadow observation.",
      language: "en",
      publishedAt: "2026-07-12T01:00:00.000Z",
      category: "database-release",
      tags: ["database", "release"],
      metrics: {},
      rawMeta: { quality: { score: 90 } },
    });
    const before = await eventCount(db);

    const result = await clusterSignals(db);

    expect(result).toMatchObject({ created: 0, deferred: 1 });
    expect(await eventCount(db)).toBe(before);
    expect(
      await db
        .selectFrom("signal_triage")
        .select("reason")
        .where("signal_id", "=", inserted?.id ?? "missing")
        .executeTakeFirstOrThrow(),
    ).toEqual({ reason: "shadow_observation" });
  });

  it("creates a review event for a decision-relevant research contribution", async () => {
    const { db, repository } = await setup();
    const source = (await repository.listSources()).find((item) => item.slug === "ccf-database");
    await repository.updateSource(source?.id ?? "missing", {
      lifecycle_status: "active",
      enabled: 1,
    });
    await repository.insertSignal(source?.id ?? "missing", {
      url: "https://www.ccf.org.cn/fixture/benchmark-1",
      title: "FixtureDBBench: A benchmark for workload-aware distributed SQL evaluation",
      summary:
        "This paper introduces a controlled benchmark for distributed SQL systems. It varies transaction contention, data skew, failure injection, and query concurrency independently, then evaluates recovery and throughput with reproducible artifacts. The results change how teams should compare database systems for critical production workloads.",
      language: "en",
      publishedAt: "2026-07-12T00:00:00.000Z",
      category: "research",
      tags: ["benchmark", "distributed-sql", "recovery"],
      metrics: {},
      rawMeta: { quality: { score: 88 } },
    });

    const result = await clusterSignals(db);

    expect(result).toMatchObject({ created: 1, deferred: 0 });
    expect(
      (await repository.listEvents("review")).some((event) =>
        event.title.includes("FixtureDBBench"),
      ),
    ).toBe(true);
  });

  it("defers a thin research listing without a clear contribution", async () => {
    const { db, repository } = await setup();
    const source = (await repository.listSources()).find((item) => item.slug === "ccf-database");
    await repository.updateSource(source?.id ?? "missing", {
      lifecycle_status: "active",
      enabled: 1,
    });
    await repository.insertSignal(source?.id ?? "missing", {
      url: "https://www.ccf.org.cn/fixture/benchmark-2",
      title: "Some observations about database systems",
      summary: "A short abstract without enough method, evidence, or decision context.",
      language: "en",
      publishedAt: "2026-07-12T00:00:00.000Z",
      category: "research",
      tags: [],
      metrics: {},
      rawMeta: { quality: { score: 90 } },
    });

    await expect(clusterSignals(db)).resolves.toMatchObject({ created: 0, deferred: 1 });
  });

  it("admits a concise but concrete research abstract into review", async () => {
    const { db, repository } = await setup();
    const source = (await repository.listSources()).find((item) => item.slug === "ccf-database");
    await repository.updateSource(source?.id ?? "missing", {
      lifecycle_status: "active",
      enabled: 1,
    });
    const summary =
      "This paper introduces a benchmark for distributed database recovery. It evaluates failover, transaction correctness, and workload stability across reproducible tasks, and reports degradation under delayed replication and contention.";
    expect(summary.length).toBeGreaterThanOrEqual(160);
    expect(summary.length).toBeLessThan(240);
    await repository.insertSignal(source?.id ?? "missing", {
      url: "https://www.ccf.org.cn/fixture/benchmark-3",
      title: "FixtureRecoveryBench: Evaluating distributed database recovery",
      summary,
      language: "en",
      publishedAt: "2026-07-12T00:00:00.000Z",
      category: "research",
      tags: ["benchmark", "database", "recovery"],
      metrics: {},
      rawMeta: { quality: { score: 82 } },
    });

    await expect(clusterSignals(db)).resolves.toMatchObject({ created: 1, deferred: 0 });
  });
});

async function eventCount(db: ReturnType<typeof createDatabase>): Promise<number> {
  const row = await db
    .selectFrom("events")
    .select(({ fn }) => fn.countAll<number>().as("count"))
    .executeTakeFirstOrThrow();
  return Number(row.count);
}
