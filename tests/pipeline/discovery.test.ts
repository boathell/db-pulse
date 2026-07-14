import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config/env.js";
import { createDatabase } from "../../src/db/database.js";
import { migrateToLatest } from "../../src/db/migrate.js";
import { Repository } from "../../src/db/repository.js";
import type { SourceRow } from "../../src/db/types.js";
import { discoverNewSources, saveDiscoveredSources } from "../../src/pipeline/discovery.js";

const databases: ReturnType<typeof createDatabase>[] = [];

afterEach(async () => {
  while (databases.length) await databases.pop()?.destroy();
});

async function setup() {
  const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: "sqlite::memory:" });
  const db = createDatabase(config);
  databases.push(db);
  await migrateToLatest(db, config);
  return { db, repository: new Repository(db) };
}

async function addSource(
  repository: Repository,
  patch: Partial<SourceRow> & Pick<SourceRow, "slug" | "name" | "homepage_url">,
) {
  const id = patch.id ?? randomUUID();
  await repository.saveSource({
    id,
    slug: patch.slug,
    name: patch.name,
    homepage_url: patch.homepage_url,
    adapter: patch.adapter ?? "rss",
    tier: patch.tier ?? 2,
    role: patch.role ?? "primary",
    region: patch.region ?? "CN",
    language: patch.language ?? "zh-CN",
    authority_score: patch.authority_score ?? 80,
    enabled: patch.enabled ?? 1,
    config_json: patch.config_json ?? JSON.stringify({ url: patch.homepage_url }),
    state_json: "{}",
    last_collected_at: null,
    last_success_at: null,
    last_error: null,
    lifecycle_status: patch.lifecycle_status ?? "active",
    source_category: patch.source_category ?? "database-vendor",
    content_domain: patch.content_domain ?? "database-cn",
  });
  return (await repository.getSource(id)) as SourceRow;
}

describe("source proposal discovery", () => {
  it("builds proposals from first-party hints and removes aggregator-owned URLs", async () => {
    const { db, repository } = await setup();
    const aihot = await addSource(repository, {
      slug: "database-radar-test",
      name: "Database Radar",
      homepage_url: "https://database-radar.example",
      role: "aggregator",
      source_category: "aggregator",
    });
    const huggingnews = await addSource(repository, {
      slug: "database-news-test",
      name: "Database News",
      homepage_url: "https://database-news.example",
      role: "aggregator",
      source_category: "aggregator",
    });
    await addSource(repository, {
      slug: "known-database",
      name: "Known Database",
      homepage_url: "https://known-db.cn",
      config_json: JSON.stringify({
        url: "https://known-db.cn/feed",
        identityHosts: ["identity-known-db.cn"],
      }),
    });
    const before = await sourceCount(db);
    const now = new Date().toISOString();

    await addDiscovery(db, aihot.id, {
      discoveryUrl: "https://database-radar.example/p/launch-one",
      originUrl: "https://newdb.cn/blog/launch-one?utm_source=radar",
      originKind: "official",
      originName: "New Database",
      title: "New Database launches a distributed SQL storage engine",
      publishedAt: now,
    });
    await addDiscovery(db, huggingnews.id, {
      discoveryUrl: "https://database-news.example/story/new-database",
      originUrl: "https://newdb.cn/research/transaction-two",
      originKind: "official",
      originName: "New Database",
      title: "New Database publishes a transaction and recovery architecture paper",
      publishedAt: now,
    });
    await addDiscovery(db, aihot.id, {
      discoveryUrl: "https://database-radar.example/p/self-link",
      originUrl: "https://database-radar.example/p/self-link",
      originKind: "media",
    });
    await addDiscovery(db, aihot.id, {
      discoveryUrl: "https://database-radar.example/p/social-link",
      originUrl: "https://x.com/newdb/status/1",
      originKind: "social",
    });
    await addDiscovery(db, aihot.id, {
      discoveryUrl: "https://database-radar.example/p/known-link",
      originUrl: "https://identity-known-db.cn/releases/one",
      originKind: "official",
    });
    await addDiscovery(db, huggingnews.id, {
      discoveryUrl: "https://database-news.example/story/no-first-party-link",
      originUrl: null,
      originKind: "aggregator_story",
    });

    const report = await discoverNewSources(db);

    expect(await sourceCount(db)).toBe(before);
    expect(report).toMatchObject({
      newCandidates: 1,
      existingSourceMatches: 1,
      policyRejected: 2,
    });
    expect(report.candidates).toHaveLength(1);
    expect(report.candidates[0]).toMatchObject({
      slug: "newdb",
      name: "New Database",
      homepageUrl: "https://newdb.cn",
      region: "CN",
      signalCount: 2,
      uniqueEvidenceCount: 2,
      aggregatorCount: 2,
      confidence: "medium",
      suggestedTier: 3,
    });
    expect(report.candidates[0]?.originalTitles).toEqual([
      "New Database launches a distributed SQL storage engine",
      "New Database publishes a transaction and recovery architecture paper",
    ]);
    expect(report.candidates[0]?.evidenceUrls).toEqual([
      "https://newdb.cn/blog/launch-one",
      "https://newdb.cn/research/transaction-two",
    ]);
    expect(JSON.stringify(report.candidates[0])).not.toContain("database-radar.example/p/");
    expect(JSON.stringify(report.candidates[0])).not.toContain("database-news.example/story/");
  });

  it("only creates a disabled draft after an explicit save and skips duplicates", async () => {
    const { db, repository } = await setup();
    const aggregator = await addSource(repository, {
      slug: "aggregator",
      name: "Aggregator",
      homepage_url: "https://aggregator.example",
      role: "aggregator",
      source_category: "aggregator",
    });
    const now = new Date().toISOString();
    await addDiscovery(db, aggregator.id, {
      discoveryUrl: "https://aggregator.example/story/one",
      originUrl: "https://proposal-db.cn/releases/one",
      originKind: "official",
      originName: "Proposal Database",
      title: "Proposal Database releases a distributed query engine",
      publishedAt: now,
    });

    const report = await discoverNewSources(db, { minSignals: 1 });
    expect(report.candidates).toHaveLength(1);
    expect(
      await db.selectFrom("sources").select("slug").where("slug", "=", "proposal-db").execute(),
    ).toHaveLength(0);

    await expect(saveDiscoveredSources(db, report.candidates)).resolves.toEqual({
      created: 1,
      skipped: 0,
    });
    const saved = await db
      .selectFrom("sources")
      .selectAll()
      .where("slug", "=", "proposal-db")
      .executeTakeFirstOrThrow();
    expect(saved).toMatchObject({
      enabled: 0,
      lifecycle_status: "draft",
      maintenance_status: "proposal",
      source_category: "company",
      content_domain: "database-cn",
    });
    expect(JSON.parse(saved.state_json)).toMatchObject({
      proposal: true,
      proposalScore: report.candidates[0]?.score,
    });
    await expect(saveDiscoveredSources(db, report.candidates)).resolves.toEqual({
      created: 0,
      skipped: 1,
    });
  });

  it("rejects AI-only sources that do not directly change database workloads", async () => {
    const { db, repository } = await setup();
    const aggregator = await addSource(repository, {
      slug: "database-industry-radar",
      name: "数据库行业雷达",
      homepage_url: "https://database-radar.cn",
      role: "aggregator",
      source_category: "aggregator",
    });
    const now = new Date().toISOString();
    await addDiscovery(db, aggregator.id, {
      discoveryUrl: "https://database-radar.cn/story/ai-one",
      originUrl: "https://generic-ai.cn/releases/one",
      originKind: "official",
      originName: "Generic AI",
      title: "通用大模型发布新的多模态生成能力",
      publishedAt: now,
    });
    await addDiscovery(db, aggregator.id, {
      discoveryUrl: "https://database-radar.cn/story/ai-two",
      originUrl: "https://generic-ai.cn/releases/two",
      originKind: "official",
      originName: "Generic AI",
      title: "通用大模型发布新的图像生成能力",
      publishedAt: now,
    });

    await expect(discoverNewSources(db)).resolves.toMatchObject({
      candidates: [],
      newCandidates: 0,
      policyRejected: 1,
    });
  });
});

async function addDiscovery(
  db: ReturnType<typeof createDatabase>,
  aggregatorSourceId: string,
  patch: {
    discoveryUrl: string;
    originUrl: string | null;
    originKind: string;
    originName?: string;
    title?: string;
    publishedAt?: string;
  },
) {
  const id = randomUUID();
  const timestamp = patch.publishedAt ?? new Date().toISOString();
  await db
    .insertInto("source_discoveries")
    .values({
      id,
      identity_hash: `identity-${id}`,
      aggregator_source_id: aggregatorSourceId,
      external_id: id,
      discovery_url: patch.discoveryUrl,
      discovery_url_hash: `discovery-${id}`,
      origin_url: patch.originUrl,
      origin_url_hash: patch.originUrl ? `origin-${id}` : null,
      origin_kind: patch.originKind,
      origin_name: patch.originName ?? null,
      handles_json: "[]",
      title: patch.title ?? "Discovery title",
      summary: "Discovery summary",
      language: "zh-CN",
      published_at: timestamp,
      category: "database-release",
      tags_json: "[]",
      metrics_json: "{}",
      raw_meta_json: "{}",
      matched_source_id: null,
      candidate_source_ids_json: "[]",
      matched_signal_id: null,
      status: "pending",
      first_seen_at: timestamp,
      last_seen_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .execute();
}

async function sourceCount(db: ReturnType<typeof createDatabase>): Promise<number> {
  const row = await db
    .selectFrom("sources")
    .select(({ fn }) => fn.countAll<number>().as("count"))
    .executeTakeFirstOrThrow();
  return Number(row.count);
}
