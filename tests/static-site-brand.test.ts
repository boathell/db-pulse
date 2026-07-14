import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/env.js";
import { createDatabase } from "../src/db/database.js";
import { migrateToLatest } from "../src/db/migrate.js";
import { seedDatabase } from "../src/db/seed.js";
import { exportStaticSite } from "../src/pipeline/export.js";

const siteUrl = "https://boathell.github.io/db-pulse/";
const strategicTracks = [
  "kernel-architecture",
  "distributed-cloud",
  "realtime-lakehouse-multimodel",
  "reliability-security-ops-cost",
  "commercialization-adoption",
  "china-ecosystem-policy",
] as const;

let temporaryDirectory = "";
let distDirectory = "";
let database: ReturnType<typeof createDatabase>;

beforeAll(async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), "db-pulse-brand-"));
  distDirectory = join(temporaryDirectory, "dist");
  const config = loadConfig({
    NODE_ENV: "test",
    DATABASE_URL: "sqlite::memory:",
    PUBLIC_SITE_URL: siteUrl,
  });
  const withDist = { ...config, distDir: distDirectory };
  database = createDatabase(withDist);
  await migrateToLatest(database, withDist);
  await seedDatabase(database);
  await exportStaticSite(database, withDist);
});

afterAll(async () => {
  await database?.destroy();
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
});

describe("DB Pulse public brand and static experience", () => {
  it("keeps package, repository, Pages URL and documentation identity aligned", async () => {
    const manifest = JSON.parse(await readFile("package.json", "utf8"));
    const lockfile = JSON.parse(await readFile("package-lock.json", "utf8"));
    const files = await Promise.all(
      ["README.md", "README-zh-cn.md", "CITATION.cff", ".env.example"].map((path) =>
        readFile(path, "utf8"),
      ),
    );

    expect(manifest).toMatchObject({
      name: "db-pulse",
      version: "0.1.0",
      homepage: siteUrl,
      repository: { url: "git+https://github.com/boathell/db-pulse.git" },
      bugs: { url: "https://github.com/boathell/db-pulse/issues" },
    });
    expect(lockfile).toMatchObject({
      name: "db-pulse",
      version: "0.1.0",
      packages: { "": { name: "db-pulse", version: "0.1.0" } },
    });
    for (const content of files.slice(0, 3)) {
      expect(content).toContain("DB Pulse");
      expect(content).toContain("boathell/db-pulse");
    }
    expect(files[3]).toContain(`PUBLIC_SITE_URL=${siteUrl}`);
    expect(files[3]).toContain("SQLite is the only currently verified runtime");
    expect(files[3]).not.toContain("mysql://");
  });

  it("starts the public Changelog at one unreleased DB Pulse 0.1.0 entry", async () => {
    const repositoryChangelog = await readFile("CHANGELOG.md", "utf8");
    const chinese = await html("changelog/index.html");
    const english = await html("en/changelog/index.html");

    expect(repositoryChangelog.match(/^## \[/gm)).toEqual(["## ["]);
    expect(repositoryChangelog).toContain("## [Unreleased]");
    expect(repositoryChangelog).not.toMatch(/^## \[\d/m);
    expect(chinese.match(/class="release-node"/g)).toHaveLength(1);
    expect(chinese).toContain("开发中");
    expect(chinese).toContain("0.1.0");
    expect(english.match(/class="release-node"/g)).toHaveLength(1);
    expect(english).toContain("IN DEVELOPMENT");
    expect(english).toContain("China database industry intelligence and decision system");
    expect(`${chinese}${english}`).not.toMatch(/0\.(?:[2-9]|1\d)\.0/);
  });

  it("generates canonical, hreflang, sitemap and robots metadata for every bilingual route", async () => {
    const pages = (await filesBelow(distDirectory)).filter((path) => path.endsWith(".html"));
    expect(pages.length).toBeGreaterThanOrEqual(109);
    const relativePages = new Set(pages.map((path) => relative(distDirectory, path)));
    for (const path of relativePages) {
      if (path !== "404.html" && !path.startsWith("en/"))
        expect(relativePages).toContain(`en/${path}`);
    }

    const sitemap = await readFile(join(distDirectory, "sitemap.xml"), "utf8");
    const robots = await readFile(join(distDirectory, "robots.txt"), "utf8");
    expect(robots).toContain(`Sitemap: ${siteUrl}sitemap.xml`);
    expect(robots).toContain("Disallow: /admin/");
    expect(sitemap).not.toContain("404.html");

    for (const path of pages) {
      const content = await readFile(path, "utf8");
      const route = relative(distDirectory, path);
      expect(content, route).toContain("DB Pulse");
      expect(content, route).toMatch(/<title>[^<]*DB Pulse<\/title>/);
      expect(content, route).not.toContain("Agent Pulse");
      if (route === "404.html") {
        expect(content).toContain('meta name="robots" content="noindex, follow"');
        continue;
      }

      const expected = publicUrl(route);
      expect(content, route).toContain(`<link rel="canonical" href="${expected}">`);
      expect(content, route).toContain('hreflang="zh-CN"');
      expect(content, route).toContain('hreflang="en"');
      expect(sitemap, route).toContain(`<loc>${expected}</loc>`);
    }
  });

  it("keeps the required pages, database source pools and decision boundaries visible", async () => {
    const home = await html("index.html");
    const lines = await html("lines/index.html");
    const actors = await html("actors/index.html");
    const resources = await html("resources/index.html");
    const sources = await html("sources/index.html");
    const product = await html("product/index.html");

    expect(home).toContain("中国数据库行业");
    expect(lines).toContain("趋势判断");
    expect(actors).toContain("关键角色");
    expect(actors).toContain('data-card-filter="vendor"');
    expect(actors).toContain('data-card-filter="open-source"');
    expect(actors).toContain('data-card-filter="institution"');
    expect(actors).toContain('data-card-filter="policy"');
    expect(actors).toContain('data-card-filter="expert"');
    expect(actors).toContain("DTCC 数据库专家与演讲者网络");
    expect(actors).toContain("已收录 · 已有效观测");
    expect(actors).toContain("不把社区包装成独立专家");
    expect(resources).toContain("选型与成本");
    expect(resources).toContain("不生成产品排名");
    expect(resources).toContain("版本口径");
    expect(resources).not.toMatch(/data-(?:rank|score)|ranking-table/);
    expect(sources).toContain("数据库厂商");
    expect(sources).toContain("社区与专家观察矩阵");
    expect(sources).not.toContain("核心个人");
    expect(sources).not.toContain("database-vendor</strong>");
    expect(product).toContain("futureOutlook");
    expect(product).toContain("nextSignal");
    expect(product).toContain("Brier Score");
    expect(product).toContain("尚未实现");

    for (const track of strategicTracks) {
      const content = await html(`lines/${track}/index.html`);
      expect(content, track).toContain("观察源池");
      expect(content, track).not.toContain("暂无匹配观察源");
    }
  });

  it("keeps filtered cards visually hidden even when card layouts declare display modes", async () => {
    const stylesheet = await readFile("web/public/assets/app.css", "utf8");
    expect(stylesheet).toMatch(/\.actor-card\[hidden\]\s*\{\s*display:\s*none;/);
    expect(stylesheet).toMatch(/\.source-table article\[hidden\]\s*\{\s*display:\s*none;/);
  });

  it("renders the same Event with Chinese facts on Chinese routes and English facts on English routes", async () => {
    const chinese = await html("events/dameng-official-ecosystem-baseline/index.html");
    const english = await html("en/events/dameng-official-ecosystem-baseline/index.html");
    const chineseTimeline = await html("timeline/index.html");
    const englishTimeline = await html("en/timeline/index.html");

    expect(chinese).toContain("<h1>达梦数据库：建立可核验的官方产品与技术演进基线</h1>");
    expect(chinese).not.toContain(
      "<h1>Dameng Database: an official, verifiable ecosystem baseline</h1>",
    );
    expect(english).toContain(
      "<h1>Dameng Database: an official, verifiable ecosystem baseline</h1>",
    );
    expect(english).not.toContain("<h1>达梦数据库：建立可核验的官方产品与技术演进基线</h1>");
    expect(chineseTimeline).toContain("达梦数据库：建立可核验的官方产品与技术演进基线");
    expect(englishTimeline).toContain(
      "Dameng Database: an official, verifiable ecosystem baseline",
    );
  });

  it("keeps all public HTML and data free of legacy AI product content", async () => {
    const publicFiles = (await filesBelow(distDirectory)).filter((path) =>
      /\.(?:html|json|xml|txt)$/.test(path),
    );
    for (const path of publicFiles) {
      const content = await readFile(path, "utf8");
      const route = relative(distDirectory, path);
      expect(content, route).not.toMatch(/Agent Pulse|OpenAI|ChatGPT|Claude|GPT-\d/i);
      expect(content, route).not.toMatch(
        /tech-evolution|agi-progress|global-innovation|model-economics/,
      );
    }
  });

  it("uses database product fields in the admin Selection & Cost workflow", async () => {
    const [markup, script, hero] = await Promise.all([
      readFile("web/admin/index.html", "utf8"),
      readFile("web/admin/admin.js", "utf8"),
      readFile("docs/assets/hero.svg", "utf8"),
    ]);
    expect(markup).toContain("选型与成本");
    expect(markup).not.toContain("模型资源");
    expect(script).toContain("resource.product");
    expect(script).toContain("resource.engine_type");
    expect(script).toContain("resource.deployment_modes_json");
    expect(script).toContain("resource.version_note");
    expect(script).toContain("{ versionNote: versionNote.value.trim() }");
    expect(script).not.toContain("resource.model");
    expect(hero).toContain("CHINA DATABASE INTELLIGENCE");
    expect(hero).not.toContain("AI INDUSTRY INTELLIGENCE");
  });
});

async function html(path: string): Promise<string> {
  return readFile(join(distDirectory, path), "utf8");
}

async function filesBelow(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(root, entry.name);
      return entry.isDirectory() ? filesBelow(path) : Promise.resolve([path]);
    }),
  );
  return nested.flat();
}

function publicUrl(path: string): string {
  if (path.endsWith("index.html")) {
    const route = path.slice(0, -"index.html".length);
    return new URL(route, siteUrl).toString();
  }
  return new URL(path, siteUrl).toString();
}
