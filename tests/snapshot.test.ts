import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/env.js";
import { createDatabase } from "../src/db/database.js";
import { migrateToLatest } from "../src/db/migrate.js";
import { Repository } from "../src/db/repository.js";
import { seedDatabase } from "../src/db/seed.js";
import { PUBLIC_DATASET_ID } from "../src/domain/content-domain.js";
import { restoreRepositorySnapshot, writeRepositorySnapshot } from "../src/pipeline/snapshot.js";

const databases: ReturnType<typeof createDatabase>[] = [];

afterEach(async () => {
  while (databases.length) await databases.pop()?.destroy();
});

async function database() {
  const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: "sqlite::memory:" });
  const db = createDatabase(config);
  databases.push(db);
  await migrateToLatest(db, config);
  await seedDatabase(db);
  return { db, config };
}

describe("DB Pulse repository snapshot v2", () => {
  it("exports only database-cn rows, bilingual Events, and a stable dataset identity", async () => {
    const { db } = await database();
    const source = await db.selectFrom("sources").selectAll().executeTakeFirstOrThrow();
    const event = await db.selectFrom("events").selectAll().executeTakeFirstOrThrow();
    await db
      .insertInto("sources")
      .values({
        ...source,
        id: "legacy-ai-source",
        slug: "legacy-ai-source",
        name: "Legacy AI source",
        content_domain: "ai-industry",
      })
      .execute();
    await db
      .insertInto("events")
      .values({
        ...event,
        id: "legacy-ai-event",
        slug: "legacy-ai-event",
        title: "Legacy AI event",
        content_domain: "ai-industry",
      })
      .execute();

    const root = await mkdtemp(join(tmpdir(), "db-pulse-snapshot-"));
    const first = await writeRepositorySnapshot(db, root);
    const second = await writeRepositorySnapshot(db, root);
    expect(first.changed).toBe(true);
    expect(second).toMatchObject({ changed: false, sha256: first.sha256 });

    const serialized = await readFile(join(root, "data/snapshot/v2.json"), "utf8");
    const snapshot = JSON.parse(serialized) as {
      schemaVersion: number;
      datasetId: string;
      sources: Array<{ slug: string; contentDomain: string }>;
      events: Array<{ slug: string; contentDomain: string }>;
      eventLocalizations: Array<{ locale: string }>;
    };
    expect(snapshot).toMatchObject({ schemaVersion: 2, datasetId: PUBLIC_DATASET_ID });
    expect(snapshot.sources).toHaveLength(48);
    expect(snapshot.events.length).toBeGreaterThanOrEqual(36);
    expect(snapshot.sources.every((row) => row.contentDomain === "database-cn")).toBe(true);
    expect(snapshot.events.every((row) => row.contentDomain === "database-cn")).toBe(true);
    expect(snapshot.eventLocalizations).toHaveLength(snapshot.events.length);
    expect(snapshot.eventLocalizations.every((row) => row.locale === "en")).toBe(true);
    expect(serialized).not.toContain("legacy-ai-source");
    expect(serialized).not.toContain("legacy-ai-event");
  });

  it("restores the DB Pulse dataset and rejects AI or mismatched snapshots", async () => {
    const source = await database();
    const root = await mkdtemp(join(tmpdir(), "db-pulse-restore-"));
    await writeRepositorySnapshot(source.db, root);

    const target = await database();
    const restored = await restoreRepositorySnapshot(target.db, root);
    expect(restored.restored).toBe(true);
    const repository = new Repository(target.db);
    expect((await repository.publicEvents()).length).toBeGreaterThanOrEqual(36);
    expect(await repository.publicEvents("en")).toHaveLength(
      (await repository.publicEvents()).length,
    );

    const snapshotPath = join(root, "data/snapshot/v2.json");
    const valid = JSON.parse(await readFile(snapshotPath, "utf8"));
    const mismatch = structuredClone(valid);
    mismatch.datasetId = "agent-pulse-ai-v1";
    await writeFile(snapshotPath, `${JSON.stringify(mismatch)}\n`);
    await expect(restoreRepositorySnapshot(target.db, root)).rejects.toThrow(
      "Unsupported repository snapshot dataset",
    );

    const oldSchema = structuredClone(valid);
    oldSchema.schemaVersion = 1;
    await writeFile(snapshotPath, `${JSON.stringify(oldSchema)}\n`);
    await expect(restoreRepositorySnapshot(target.db, root)).rejects.toThrow(
      "Unsupported repository snapshot schema",
    );

    const wrongDomain = structuredClone(valid);
    wrongDomain.events[0].contentDomain = "ai-industry";
    await writeFile(snapshotPath, `${JSON.stringify(wrongDomain)}\n`);
    await expect(restoreRepositorySnapshot(target.db, root)).rejects.toThrow(
      "non-public content domain",
    );

    const missingEnglish = structuredClone(valid);
    const publishedSlug = missingEnglish.events.find(
      (event: { status: string }) => event.status === "published",
    ).slug;
    missingEnglish.eventLocalizations = missingEnglish.eventLocalizations.filter(
      (localization: { eventSlug: string; locale: string }) =>
        localization.eventSlug !== publishedSlug || localization.locale !== "en",
    );
    await writeFile(snapshotPath, `${JSON.stringify(missingEnglish)}\n`);
    await expect(restoreRepositorySnapshot(target.db, root)).rejects.toThrow(
      "missing complete English localization",
    );
    expect((await repository.publicEvents()).length).toBeGreaterThanOrEqual(36);
  });

  it("keeps the audited snapshot stable across repeated catalog seeding", async () => {
    const { db } = await database();
    const root = await mkdtemp(join(tmpdir(), "db-pulse-seed-idempotence-"));
    const first = await writeRepositorySnapshot(db, root);
    await seedDatabase(db);
    const second = await writeRepositorySnapshot(db, root);
    expect(second).toMatchObject({ changed: false, sha256: first.sha256 });
  });
});
