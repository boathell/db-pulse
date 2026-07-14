import { promises as fs } from "node:fs";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path, { join } from "node:path";
import { FileMigrationProvider, Migrator, sql } from "kysely";
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/env.js";
import { createDatabase } from "../src/db/database.js";
import { migrateToLatest } from "../src/db/migrate.js";
import { Repository } from "../src/db/repository.js";
import { seedDatabase } from "../src/db/seed.js";
import { PUBLIC_CONTENT_DOMAIN } from "../src/domain/content-domain.js";
import { exportStaticSite } from "../src/pipeline/export.js";

const databases: ReturnType<typeof createDatabase>[] = [];

afterEach(async () => {
  while (databases.length) await databases.pop()?.destroy();
});

describe("DB Pulse domain migrations", () => {
  it("upgrades legacy rows through 012 and an existing 012 database through 013", async () => {
    const temp = await mkdtemp(join(tmpdir(), "db-pulse-domain-migration-"));
    const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: "sqlite::memory:" });
    const runtime = { ...config, distDir: join(temp, "dist") };
    const db = createDatabase(runtime);
    databases.push(db);

    await migrateTo(db, config.rootDir, "011_signal_observation_occurrences");
    const timestamp = "2026-07-01T00:00:00.000Z";
    await db
      .insertInto("sources")
      .values({
        id: "legacy-source",
        slug: "legacy-ai-source",
        name: "Legacy AI source",
        homepage_url: "https://example.com/legacy",
        adapter: "manual",
        tier: 1,
        role: "primary",
        region: "GLOBAL",
        language: "en",
        authority_score: 90,
        enabled: 1,
        config_json: JSON.stringify({ url: "https://example.com/legacy" }),
        state_json: "{}",
        last_collected_at: null,
        last_success_at: null,
        last_error: null,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute();
    await db
      .insertInto("events")
      .values({
        id: "legacy-event",
        slug: "legacy-ai-event",
        title: "Legacy AI event",
        fact_summary: "A legacy AI fact retained only for provenance and rollback.",
        summary: "A legacy AI summary retained only for provenance and rollback.",
        technical_insight: "Legacy technical analysis retained internally.",
        industry_insight: "Legacy industry analysis retained internally.",
        future_outlook: "Legacy future signal retained internally.",
        business_value: "Legacy action retained internally.",
        category: "legacy",
        company: "Legacy AI",
        keywords_json: '["legacy"]',
        confidence_score: 80,
        heat_score: 0,
        impact_score: 70,
        value_score: 70,
        score_factors_json: "{}",
        status: "review",
        featured: 0,
        manual_override: 0,
        happened_at: timestamp,
        published_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute();
    await db
      .insertInto("scout_insights")
      .values({
        id: "legacy-scout",
        slug: "legacy-ai-scout",
        kind: "artifact",
        status: "considering",
        title: "Legacy AI Scout",
        observation: "Legacy observation",
        hypothesis: "Legacy hypothesis",
        why_now: "Legacy why now",
        target_audience: "Legacy audience",
        suggested_action: "Legacy action",
        artifact_idea: "Legacy artifact",
        counter_signals: "Legacy counter signal",
        horizon: "30d",
        confidence_score: 90,
        evidence_score: 90,
        novelty_score: 90,
        leverage_score: 90,
        total_score: 90,
        cooldown_key: "legacy-ai-scout",
        generated_at: timestamp,
        expires_at: null,
        published_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute();
    await db
      .insertInto("tracks")
      .values({
        id: "legacy-track",
        slug: "legacy-ai-track",
        name: "Legacy AI track",
        description: "Legacy",
        kind: "main",
        perspective: "legacy",
        color: "#000000",
        icon: "x",
        order_index: 1,
        enabled: 1,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute();
    await db
      .insertInto("actors")
      .values({
        id: "legacy-actor",
        slug: "legacy-ai-actor",
        name: "Legacy AI actor",
        actor_type: "company",
        region: "GLOBAL",
        scale: "legacy",
        domains_json: '["ai"]',
        table_score: 90,
        website_url: "https://example.com/legacy",
        enabled: 1,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute();
    await db
      .insertInto("views")
      .values({
        id: "legacy-view",
        slug: "legacy-ai-view",
        name: "Legacy AI view",
        description: "Legacy",
        filters_json: "{}",
        layout_json: "{}",
        theme_json: "{}",
        is_default: 1,
        status: "published",
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute();

    await migrateTo(db, config.rootDir, "012_db_pulse_domain");
    expect(
      await db
        .selectFrom("sources")
        .select("content_domain")
        .where("id", "=", "legacy-source")
        .executeTakeFirstOrThrow(),
    ).toEqual({ content_domain: "ai-industry" });
    expect(
      await db
        .selectFrom("events")
        .select("content_domain")
        .where("id", "=", "legacy-event")
        .executeTakeFirstOrThrow(),
    ).toEqual({ content_domain: "ai-industry" });
    expect(
      await db
        .selectFrom("scout_insights")
        .select("content_domain")
        .where("id", "=", "legacy-scout")
        .executeTakeFirstOrThrow(),
    ).toEqual({ content_domain: "ai-industry" });

    await sql`INSERT INTO database_resources (
      id, slug, provider, product, engine_type, editions_json, deployment_modes_json,
      license_models_json, compatibility_json, pricing_model, pricing_note, region,
      purchase_url, documentation_url, evidence_url, evidence_status, verified_at,
      enabled, created_at, updated_at
    ) VALUES (
      'pre-013-resource', 'pre-013-resource', 'Legacy', 'Legacy DB', 'relational',
      '[]', '[]', '[]', '[]', 'quote', 'legacy', 'CN', 'https://example.com/buy',
      'https://example.com/docs', 'https://example.com/evidence', 'pending',
      ${timestamp}, 1, ${timestamp}, ${timestamp}
    )`.execute(db);

    await migrateToLatest(db, config);
    await migrateToLatest(db, config);
    expect(
      await db
        .selectFrom("database_resources")
        .select("version_note")
        .where("id", "=", "pre-013-resource")
        .executeTakeFirstOrThrow(),
    ).toEqual({ version_note: "以官方发布说明为准" });
    expect(
      await db
        .selectFrom("sources")
        .select(["owner", "robots_policy", "freshness_slo_hours", "adapter_version"])
        .where("id", "=", "legacy-source")
        .executeTakeFirstOrThrow(),
    ).toEqual({
      owner: "unassigned",
      robots_policy: "review-required",
      freshness_slo_hours: 168,
      adapter_version: "1.0.0",
    });
    await expect(
      db
        .selectFrom("tracks")
        .select("enabled")
        .where("id", "=", "legacy-track")
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({ enabled: 0 });
    await expect(
      db
        .selectFrom("actors")
        .select("enabled")
        .where("id", "=", "legacy-actor")
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({ enabled: 0 });
    await expect(
      db
        .selectFrom("views")
        .select("is_default")
        .where("id", "=", "legacy-view")
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({ is_default: 0 });

    await seedDatabase(db);
    const repository = new Repository(db);
    const publicSource = (await repository.listSources())[0];
    const deprecatedSignal = await repository.insertSignal(publicSource?.id ?? "missing", {
      externalId: "database-source-governance-becomes-public-infrastructure",
      url: "https://example.com/deprecated-curated-event",
      title: "Deprecated self-referential seed",
      summary: "A superseded DB Pulse seed without direct industry evidence.",
      language: "en",
      publishedAt: timestamp,
      category: "legacy",
      tags: [],
      metrics: {},
      rawMeta: { curated: true, contentDomain: PUBLIC_CONTENT_DOMAIN },
    });
    const eventTemplate = await db.selectFrom("events").selectAll().executeTakeFirstOrThrow();
    await db
      .insertInto("events")
      .values({
        ...eventTemplate,
        id: "deprecated-curated-event",
        slug: "database-source-governance-becomes-public-infrastructure",
        manual_override: 1,
        content_domain: PUBLIC_CONTENT_DOMAIN,
      })
      .execute();
    await repository.attachSignal(
      "deprecated-curated-event",
      deprecatedSignal?.id ?? "missing",
      "primary",
      100,
    );
    await seedDatabase(db);

    expect(
      await db
        .selectFrom("events")
        .select("id")
        .where("slug", "=", "database-source-governance-becomes-public-infrastructure")
        .executeTakeFirst(),
    ).toBeUndefined();
    expect(
      await db
        .selectFrom("signals")
        .select("id")
        .where("id", "=", deprecatedSignal?.id ?? "missing")
        .executeTakeFirst(),
    ).toBeUndefined();
    expect(await repository.listSources()).toHaveLength(48);
    expect(await repository.listEvents("published")).toHaveLength(36);
    expect(
      (await repository.listSources()).every(
        (source) => source.content_domain === PUBLIC_CONTENT_DOMAIN,
      ),
    ).toBe(true);
    expect((await repository.listSources()).every((source) => source.owner !== "unassigned")).toBe(
      true,
    );
    const exported = await exportStaticSite(db, runtime);
    expect(exported).toMatchObject({ sources: 48, resources: 18 });
    expect(exported.events).toBe(36);
    const publicSources = JSON.parse(
      await readFile(join(runtime.distDir, "data/sources.json"), "utf8"),
    ) as Array<Record<string, unknown>>;
    expect(publicSources).toHaveLength(48);
    expect(publicSources.every((source) => typeof source.owner === "string")).toBe(true);
    expect(publicSources.every((source) => typeof source.adapterVersion === "string")).toBe(true);
  });
});

async function migrateTo(
  db: ReturnType<typeof createDatabase>,
  rootDir: string,
  migrationName: string,
): Promise<void> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: join(rootDir, "src/db/migrations"),
    }),
  });
  const { error } = await migrator.migrateTo(migrationName);
  if (error) throw error;
}
