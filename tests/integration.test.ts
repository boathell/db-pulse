import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/env.js";
import { createDatabase } from "../src/db/database.js";
import { migrateToLatest } from "../src/db/migrate.js";
import { Repository } from "../src/db/repository.js";
import { seedDatabase } from "../src/db/seed.js";
import { exportStaticSite } from "../src/pipeline/export.js";
import { buildApp } from "../src/server/app.js";

const databases: ReturnType<typeof createDatabase>[] = [];

afterEach(async () => {
  while (databases.length) await databases.pop()?.destroy();
});

async function setup(environment: "test" | "production" = "test") {
  const temp = await mkdtemp(join(tmpdir(), "db-pulse-"));
  const config = loadConfig({
    NODE_ENV: environment,
    DATABASE_URL: "sqlite::memory:",
    PUBLIC_SITE_URL: "https://boathell.github.io/db-pulse/",
    ...(environment === "production" ? { ADMIN_TOKEN: "a-secure-token-for-tests" } : {}),
  });
  const withDist = { ...config, distDir: join(temp, "dist") };
  const db = createDatabase(withDist);
  databases.push(db);
  await migrateToLatest(db, withDist);
  await seedDatabase(db);
  return { db, config: withDist };
}

describe("DB Pulse SQLite application", () => {
  it("reuses canonical official evidence when a curated Event is reseeded", async () => {
    const { db } = await setup();
    const occurrencesBefore = await db
      .selectFrom("signal_observation_occurrences")
      .select((expression) => expression.fn.countAll<number>().as("count"))
      .executeTakeFirstOrThrow();
    const event = await db
      .selectFrom("events")
      .select("id")
      .where("slug", "=", "oceanbase-official-ecosystem-baseline")
      .executeTakeFirstOrThrow();
    const evidence = await db
      .selectFrom("event_signals")
      .select("signal_id")
      .where("event_id", "=", event.id)
      .executeTakeFirstOrThrow();
    await db.deleteFrom("events").where("id", "=", event.id).execute();

    await seedDatabase(db);

    const restored = await db
      .selectFrom("events")
      .select("id")
      .where("slug", "=", "oceanbase-official-ecosystem-baseline")
      .executeTakeFirstOrThrow();
    await expect(
      db
        .selectFrom("event_signals")
        .select("signal_id")
        .where("event_id", "=", restored.id)
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({ signal_id: evidence.signal_id });
    const occurrencesAfter = await db
      .selectFrom("signal_observation_occurrences")
      .select((expression) => expression.fn.countAll<number>().as("count"))
      .executeTakeFirstOrThrow();
    expect(occurrencesAfter.count).toBe(occurrencesBefore.count);
  });

  it("exports schema v2, bilingual timelines and database product resources", async () => {
    const { db, config } = await setup();
    const result = await exportStaticSite(db, config);
    expect(result).toMatchObject({
      events: expect.any(Number),
      tracks: 14,
      actors: 22,
      resources: 18,
      sources: 48,
      version: "0.1.0",
    });

    const timeline = JSON.parse(await readFile(join(config.distDir, "data/timeline.json"), "utf8"));
    const timelineEn = JSON.parse(
      await readFile(join(config.distDir, "data/timeline.en.json"), "utf8"),
    );
    expect(timeline).toMatchObject({
      schemaVersion: 2,
      datasetId: "db-pulse-cn-v1",
      locale: "zh-CN",
    });
    expect(timelineEn).toMatchObject({
      schemaVersion: 2,
      datasetId: "db-pulse-cn-v1",
      locale: "en",
    });
    expect(timeline.events.length).toBeGreaterThanOrEqual(36);
    expect(timelineEn.events).toHaveLength(timeline.events.length);
    expect(timeline.events[0]).not.toHaveProperty("manual_override");
    expect(JSON.stringify(timeline)).not.toContain("OpenAI");
    expect(JSON.stringify(timeline)).not.toContain("ChatGPT");

    const resources = JSON.parse(
      await readFile(join(config.distDir, "data/resources.json"), "utf8"),
    );
    expect(resources).toHaveLength(18);
    expect(resources[0]).toMatchObject({
      versionNote: expect.any(String),
      deploymentModes: expect.any(Array),
      licenseModels: expect.any(Array),
      compatibility: expect.any(Array),
      pricingModel: expect.any(String),
      evidenceStatus: expect.any(String),
    });
    for (const resource of resources) {
      expect(resource.versionNote.trim().length).toBeGreaterThan(0);
      expect(
        [resource.purchaseUrl, resource.documentationUrl, resource.evidenceUrl].every(
          (url: string) => ["http:", "https:"].includes(new URL(url).protocol),
        ),
      ).toBe(true);
      expect(resource).not.toHaveProperty("inputPrice");
      expect(resource).not.toHaveProperty("outputPrice");
    }
    const actors = await db
      .selectFrom("actors")
      .select(["slug", "actor_type"])
      .where("enabled", "=", 1)
      .execute();
    expect([...new Set(actors.map((actor) => actor.actor_type))]).toEqual(
      expect.arrayContaining([
        "company",
        "community",
        "policy-body",
        "standards-body",
        "institution",
        "expert-network",
      ]),
    );
    const actorRoles = await db
      .selectFrom("event_actors")
      .innerJoin("actors", "actors.id", "event_actors.actor_id")
      .select(["actors.actor_type as actorType", "event_actors.actor_role as actorRole"])
      .execute();
    for (const link of actorRoles) {
      if (["policy-body", "standards-body"].includes(link.actorType)) {
        expect(link.actorRole).toBe("issuer");
      } else if (link.actorType === "institution") {
        expect(link.actorRole).toBe("evaluator");
      } else if (link.actorType === "expert-network") {
        expect(link.actorRole).toBe("observer");
      } else {
        expect(link.actorRole).toBe("subject");
      }
    }
    expect(actorRoles.some((link) => link.actorRole === "owner")).toBe(false);
    const home = await readFile(join(config.distDir, "index.html"), "utf8");
    const englishHome = await readFile(join(config.distDir, "en/index.html"), "utf8");
    const resourcePage = await readFile(join(config.distDir, "resources/index.html"), "utf8");
    const changelog = await readFile(join(config.distDir, "changelog/index.html"), "utf8");
    expect(home).toContain("DB Pulse");
    expect(home).toContain("数据库");
    expect(englishHome).toContain("DB Pulse");
    expect(resourcePage).toContain("选型与成本");
    expect(changelog).toContain("0.1.0");
    expect(changelog).not.toContain("0.10.0");
  });

  it("serves locale-aware public APIs and protects production admin APIs", async () => {
    const { db, config } = await setup("production");
    await exportStaticSite(db, config);
    const app = await buildApp(db, config);

    const zh = await app.inject({ method: "GET", url: "/api/public/timeline" });
    expect(zh.statusCode).toBe(200);
    expect(zh.json()).toMatchObject({
      schemaVersion: 2,
      datasetId: "db-pulse-cn-v1",
      locale: "zh-CN",
    });
    const en = await app.inject({ method: "GET", url: "/api/public/timeline?locale=en" });
    expect(en.statusCode).toBe(200);
    expect(en.json()).toMatchObject({
      schemaVersion: 2,
      datasetId: "db-pulse-cn-v1",
      locale: "en",
    });
    const stored = await db
      .selectFrom("events")
      .select(["id", "title"])
      .where("id", "=", zh.json().events[0].id)
      .executeTakeFirstOrThrow();
    const english = await db
      .selectFrom("event_localizations")
      .select("title")
      .where("event_id", "=", stored.id)
      .where("locale", "=", "en")
      .executeTakeFirstOrThrow();
    expect(zh.json().events[0].title).toBe(stored.title);
    expect(en.json().events[0].title).toBe(english.title);
    const invalid = await app.inject({ method: "GET", url: "/api/public/timeline?locale=fr" });
    expect(invalid.statusCode).toBe(400);

    const publicTracks = await app.inject({ method: "GET", url: "/api/public/tracks" });
    expect(publicTracks.statusCode).toBe(200);
    expect(publicTracks.json()).toHaveLength(14);
    const publicActors = await app.inject({ method: "GET", url: "/api/public/actors" });
    expect(publicActors.statusCode).toBe(200);
    expect(publicActors.json()).toHaveLength(22);
    expect(
      publicActors
        .json()
        .every((actor: { observed_event_count: number }) => actor.observed_event_count > 0),
    ).toBe(true);

    expect((await app.inject({ method: "GET", url: "/api/admin/dashboard" })).statusCode).toBe(401);
    expect(
      (
        await app.inject({
          method: "GET",
          url: "/api/admin/dashboard",
          headers: { authorization: "Bearer a-secure-token-for-tests" },
        })
      ).statusCode,
    ).toBe(200);

    const resource = await db
      .selectFrom("database_resources")
      .select(["id", "version_note"])
      .where("enabled", "=", 1)
      .executeTakeFirstOrThrow();
    const updatedVersion = "以 2026 年 7 月官方发布说明为准";
    expect(
      (
        await app.inject({
          method: "PATCH",
          url: `/api/admin/resources/${resource.id}`,
          headers: { authorization: "Bearer a-secure-token-for-tests" },
          payload: { versionNote: updatedVersion },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      await db
        .selectFrom("database_resources")
        .select("version_note")
        .where("id", "=", resource.id)
        .executeTakeFirstOrThrow(),
    ).toEqual({ version_note: updatedVersion });
    await app.close();
  });

  it("refreshes catalog metadata without resetting source runtime state", async () => {
    const { db } = await setup();
    const repository = new Repository(db);
    const source = (await repository.listSources()).find(
      (item) => item.slug === "oceanbase-official",
    );
    expect(source).toBeTruthy();
    await repository.updateSource(source?.id ?? "missing", {
      lifecycle_status: "degraded",
      enabled: 1,
      health_score: 42,
      consecutive_failures: 3,
      state_json: JSON.stringify({ etag: "runtime-state" }),
      last_success_at: "2026-07-12T00:00:00.000Z",
      last_error: "transient",
    });

    await seedDatabase(db);

    expect(await repository.getSource(source?.id ?? "missing")).toMatchObject({
      lifecycle_status: "degraded",
      enabled: 1,
      health_score: 42,
      consecutive_failures: 3,
      last_success_at: "2026-07-12T00:00:00.000Z",
      last_error: "transient",
    });
  });
});
