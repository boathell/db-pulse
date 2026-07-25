import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sourceCatalog } from "../src/catalog/sources.js";
import { getAdapter } from "../src/collectors/index.js";
import type { CollectContext } from "../src/collectors/types.js";
import { loadConfig } from "../src/config/env.js";
import type { SourceDescriptor } from "../src/domain/types.js";

type ContractMode = "web-scraper" | "github-releases" | "manual";

interface SourceContractManifest {
  schemaVersion: number;
  datasetId: string;
  contracts: Record<
    ContractMode,
    { successFixture: string; driftFixture: string | null; recoveryFixture: string | null }
  >;
  sources: Array<{ slug: string; mode: ContractMode; endpoint: string }>;
}

const fixtureRoot = join(process.cwd(), "tests/fixtures/sources");

describe("DB Pulse retained-source contract manifest", () => {
  it("maps every source to an exact endpoint, adapter mode and existing fixture", async () => {
    const manifest = await loadManifest();
    expect(manifest).toMatchObject({ schemaVersion: 1, datasetId: "db-pulse-cn-v1" });
    expect(manifest.sources).toHaveLength(26);
    expect(new Set(manifest.sources.map((entry) => entry.slug)).size).toBe(26);
    expect(manifest.sources.map((entry) => entry.slug)).toEqual(
      sourceCatalog.map((source) => source.slug),
    );

    for (const entry of manifest.sources) {
      const source = sourceCatalog.find((candidate) => candidate.slug === entry.slug);
      expect(source, entry.slug).toBeDefined();
      expect(entry.mode, entry.slug).toBe(source?.adapter);
      expect(entry.endpoint, entry.slug).toBe(source?.endpoint);
      const contract = manifest.contracts[entry.mode];
      await expect(readFixture(contract.successFixture)).resolves.not.toHaveLength(0);
      if (entry.mode !== "manual") {
        await expect(readFixture(contract.driftFixture ?? "missing")).resolves.not.toHaveLength(0);
        await expect(readFixture(contract.recoveryFixture ?? "missing")).resolves.not.toHaveLength(
          0,
        );
      }
    }
  });

  it("runs a success contract for every automatic source", async () => {
    const manifest = await loadManifest();
    for (const entry of manifest.sources.filter((item) => item.mode !== "manual")) {
      const source = requiredSource(entry.slug);
      const contract = manifest.contracts[entry.mode];
      const body = customizeFixture(await readFixture(contract.successFixture), source);
      const items = await getAdapter(entry.mode).collect(
        descriptor(source),
        context(body, source.endpoint),
      );
      expect(items.length, entry.slug).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.title.trim().length, entry.slug).toBeGreaterThan(0);
        expect(["http:", "https:"]).toContain(new URL(item.url).protocol);
        expect(Number.isFinite(Date.parse(item.publishedAt)), entry.slug).toBe(true);
        expect(item.rawMeta.dateInferred, entry.slug).not.toBe(true);
      }
    }
  });

  it("detects schema drift and then recovers for every automatic source", async () => {
    const manifest = await loadManifest();
    for (const entry of manifest.sources.filter((item) => item.mode !== "manual")) {
      const source = requiredSource(entry.slug);
      const contract = manifest.contracts[entry.mode];
      const drift = await readFixture(contract.driftFixture ?? "missing");
      const adapter = getAdapter(entry.mode);
      if (entry.mode === "github-releases") {
        await expect(
          adapter.collect(descriptor(source), context(drift, source.endpoint)),
        ).rejects.toThrow("no entries found");
      } else {
        await expect(
          adapter.collect(descriptor(source), context(drift, source.endpoint)),
        ).resolves.toEqual([]);
      }

      const recovery = customizeFixture(
        await readFixture(contract.recoveryFixture ?? "missing"),
        source,
      );
      await expect(
        adapter.collect(descriptor(source), context(recovery, source.endpoint)),
      ).resolves.toEqual(
        expect.arrayContaining([expect.objectContaining({ rawMeta: expect.any(Object) })]),
      );
    }
  });

  it("documents every manual adapter source as non-collecting shadow inventory", async () => {
    const manifest = await loadManifest();
    const boundary = JSON.parse(await readFixture(manifest.contracts.manual.successFixture)) as {
      mode: string;
      collectionAllowed: boolean;
      requirements: string[];
    };
    expect(boundary).toMatchObject({ mode: "manual-review-only", collectionAllowed: false });
    expect(boundary.requirements.length).toBeGreaterThanOrEqual(3);
    const manual = manifest.sources.filter((entry) => entry.mode === "manual");
    expect(manual.length).toBeGreaterThan(0);
    for (const entry of manual) {
      const source = requiredSource(entry.slug);
      expect(source).toMatchObject({
        adapter: "manual",
        enabled: false,
        lifecycleStatus: "shadow",
      });
      expect(["manual", "social"]).toContain(source.acquisition);
      expect(["manual", "restricted"]).toContain(source.maintenanceStatus);
    }
  });

  it("pins the verified GreptimeDB WeChat identity without storing article content", async () => {
    const metadata = JSON.parse(await readFixture("greptimedb-wechat-metadata.json")) as {
      schemaVersion: number;
      sourceSlug: string;
      collectionAllowed: boolean;
      accountName: string;
      accountBiz: string;
      article: { title: string; url: string; publishedAt: string };
    };
    const source = requiredSource("greptimedb-wechat");

    expect(metadata).toMatchObject({
      schemaVersion: 1,
      sourceSlug: source.slug,
      collectionAllowed: false,
      accountName: "GreptimeDB",
      accountBiz: "Mzg3MTgxMzczNg==",
      article: {
        title: "Hebo AI：为什么我们选择了 GreptimeDB 而不是 ClickHouse",
        url: source.endpoint,
      },
    });
    expect(Number.isFinite(Date.parse(metadata.article.publishedAt))).toBe(true);
    expect(source).toMatchObject({
      acquisition: "social",
      maintenanceStatus: "restricted",
      robotsPolicy: "manual-only",
      socialHandles: ["GreptimeDB", "Mzg3MTgxMzczNg=="],
      identityHosts: ["greptime.cn"],
    });
    expect(JSON.stringify(metadata)).not.toMatch(/articleBody|content|html/i);
  });

  it("pins Zhuang Xiaodan's verified personal WeChat identity without storing article content", async () => {
    const metadata = JSON.parse(await readFixture("zhuang-xiaodan-wechat-metadata.json")) as {
      schemaVersion: number;
      sourceSlug: string;
      collectionAllowed: boolean;
      accountName: string;
      articleAuthor: string;
      accountUsername: string;
      accountBiz: string;
      article: { title: string; url: string; publishedAt: string };
      identityEvidence: Array<{ kind: string; url: string; identity: string }>;
    };
    const source = requiredSource("zhuang-xiaodan-wechat");

    expect(metadata).toMatchObject({
      schemaVersion: 1,
      sourceSlug: source.slug,
      collectionAllowed: false,
      accountName: "此间山林",
      articleAuthor: "此间的山林",
      accountUsername: "gh_8e1963838cae",
      accountBiz: "MzkyNjQzNTU3OQ==",
      article: {
        title: "SkyWalking + GreptimeDB 非官方社区版发布，想听听你的真实需求",
        url: source.endpoint,
      },
      identityEvidence: [
        {
          kind: "github-profile",
          url: "https://github.com/killme2008",
          identity: "Dennis Zhuang / killme2008",
        },
        {
          kind: "official-company-profile",
          url: "https://greptime.cn/about",
          identity: "庄晓丹",
        },
      ],
    });
    expect(Number.isFinite(Date.parse(metadata.article.publishedAt))).toBe(true);
    expect(source).toMatchObject({
      homepageUrl: "https://github.com/killme2008",
      owner: "Greptime / 格睿科技",
      tier: 3,
      role: "expert",
      category: "expert",
      acquisition: "social",
      maintenanceStatus: "restricted",
      robotsPolicy: "manual-only",
      socialHandles: [
        "此间山林",
        "此间的山林",
        "gh_8e1963838cae",
        "MzkyNjQzNTU3OQ==",
        "killme2008",
      ],
      identityHosts: ["greptime.cn"],
    });
    expect(JSON.stringify(metadata)).not.toMatch(/articleBody|content|html/i);
  });
});

async function loadManifest(): Promise<SourceContractManifest> {
  return JSON.parse(await readFixture("db-pulse-source-contracts.json")) as SourceContractManifest;
}

async function readFixture(name: string): Promise<string> {
  return readFile(join(fixtureRoot, name), "utf8");
}

function requiredSource(slug: string): (typeof sourceCatalog)[number] {
  const source = sourceCatalog.find((candidate) => candidate.slug === slug);
  if (!source) throw new Error(`Missing catalog source: ${slug}`);
  return source;
}

function descriptor(source: (typeof sourceCatalog)[number]): SourceDescriptor {
  return {
    id: source.slug,
    slug: source.slug,
    name: source.name,
    homepageUrl: source.homepageUrl,
    adapter: source.adapter,
    tier: source.tier,
    role: source.role,
    region: source.region,
    language: source.language,
    authorityScore: source.authorityScore,
    config: { url: source.endpoint, category: source.category, take: 10 },
    state: {},
  };
}

function customizeFixture(body: string, source: (typeof sourceCatalog)[number]): string {
  return source.adapter === "github-releases"
    ? body.replaceAll("https://github.com/pingcap/tidb", source.homepageUrl)
    : body;
}

function context(body: string, finalUrl: string): CollectContext {
  const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: "sqlite::memory:" });
  return {
    config,
    fetchText: async () => ({
      body,
      status: 200,
      headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
      attemptCount: 1,
      responseBytes: body.length,
      finalUrl,
    }),
  };
}
