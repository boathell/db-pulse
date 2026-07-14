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

describe("DB Pulse 48-source contract manifest", () => {
  it("maps every source to an exact endpoint, adapter mode and existing fixture", async () => {
    const manifest = await loadManifest();
    expect(manifest).toMatchObject({ schemaVersion: 1, datasetId: "db-pulse-cn-v1" });
    expect(manifest.sources).toHaveLength(48);
    expect(new Set(manifest.sources.map((entry) => entry.slug)).size).toBe(48);
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

  it("documents every manual source as non-collecting shadow inventory", async () => {
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
      expect(requiredSource(entry.slug)).toMatchObject({
        adapter: "manual",
        acquisition: "manual",
        enabled: false,
        lifecycleStatus: "shadow",
        maintenanceStatus: "manual",
      });
    }
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
