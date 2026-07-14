import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { transform } from "esbuild";
import type { Kysely } from "kysely";
import { industryNarratives, industryNarrativesEn } from "../catalog/history.js";
import { influencerCatalog } from "../catalog/influencers.js";
import { capabilities, productVersion, releases, roadmap } from "../catalog/product.js";
import type { AppConfig } from "../config/env.js";
import { parseJson, Repository } from "../db/repository.js";
import type { DatabaseSchema } from "../db/types.js";
import { PUBLIC_DATASET_ID } from "../domain/content-domain.js";
import { evaluateSystem } from "./evaluate.js";
import type {
  EnrichedEvent,
  IndustryNarratives,
  ProductData,
  PublicActor,
  PublicInfluencer,
  PublicResource,
  PublicScoutInsight,
  PublicSignal,
  PublicSource,
  PublicTrack,
  StaticSiteModel,
} from "./static-site/dto.js";
import { githubDataAtBuildTime } from "./static-site/github.js";
import type { StaticPage } from "./static-site/pages.js";
import { renderStaticPages } from "./static-site/pages.js";

export async function exportStaticSite(db: Kysely<DatabaseSchema>, config: AppConfig) {
  const repository = new Repository(db);
  const evaluation = await evaluateSystem(db);
  const [events, eventsEn, tracks, actors, resources, view, scout, latestSourceChecks, signals] =
    await Promise.all([
      repository.publicEvents(),
      repository.publicEvents("en"),
      repository.listPublicTracks(),
      repository.listPublicActors(),
      repository.listResources(),
      repository.getDefaultView(),
      repository.publicScoutInsights(),
      repository.latestSourceChecks(),
      repository.publicSignals(),
    ]);
  const sources = (await repository.listPublicSources()).filter(
    (source) => source.lifecycle_status !== "retired",
  );

  const enrichedEvents = (await Promise.all(
    events.map(async (event) => ({
      ...event,
      tracks: await repository.eventTracks(event.id),
      actors: await repository.eventActors(event.id),
    })),
  )) as EnrichedEvent[];
  const eventsEnById = new Map(eventsEn.map((event) => [event.id, event]));
  const enrichedEventsEn = enrichedEvents.map((event) => ({
    ...event,
    ...eventsEnById.get(event.id),
    tracks: event.tracks.map((track) => ({ ...track, name: englishTrackName(track.slug) })),
  })) as EnrichedEvent[];
  const generatedAt = new Date().toISOString();
  const publicTracks: PublicTrack[] = tracks.map((track) => ({
    slug: track.slug,
    name: track.name,
    description: track.description,
    kind: track.kind,
    perspective: track.perspective,
    color: track.color,
    icon: track.icon,
  }));
  const checksBySourceId = new Map(latestSourceChecks.map((check) => [check.source_id, check]));
  const publicSources: PublicSource[] = sources.map((source) => ({
    slug: source.slug,
    name: source.name,
    owner: source.owner,
    homepageUrl: source.homepage_url,
    category: source.source_category,
    region: source.region,
    tier: source.tier,
    role: source.role,
    acquisition: source.acquisition,
    topics: parseJson(source.topics_json, []),
    maintenanceStatus: source.maintenance_status,
    lifecycle: source.lifecycle_status,
    observationEnabled: source.observation_enabled === 1,
    qualityScore: source.quality_score,
    cadence: source.cadence,
    robotsPolicy: source.robots_policy,
    freshnessSloHours: source.freshness_slo_hours,
    adapterVersion: source.adapter_version,
    healthStatus: normalizePublicHealth(checksBySourceId.get(source.id)?.status),
    lastCheckedAt: checksBySourceId.get(source.id)?.finished_at ?? null,
    latestItemAt: checksBySourceId.get(source.id)?.latest_item_at ?? null,
    healthErrorCode: checksBySourceId.get(source.id)?.error_code ?? null,
  }));
  const publicActors: PublicActor[] = actors.map((actor) => ({
    slug: actor.slug,
    name: actor.name,
    type: actor.actor_type,
    region: actor.region,
    scale: actor.scale,
    domains: parseJson(actor.domains_json, []),
    tableScore: actor.table_score,
    websiteUrl: actor.website_url,
    observed: actor.observed_event_count > 0,
  }));
  const publicInfluencers: PublicInfluencer[] = influencerCatalog.map((influencer) => ({
    slug: influencer.slug,
    name: influencer.name,
    region: influencer.region,
    focus: [...influencer.focus],
    feedSourceSlug: influencer.feedSourceSlug ?? null,
    profiles: influencer.profiles.map((profile) => ({ ...profile })),
  }));
  const publicResources: PublicResource[] = resources.map((resource) => ({
    slug: resource.slug,
    provider: resource.provider,
    product: resource.product,
    engineType: resource.engine_type,
    versionNote: resource.version_note,
    editions: parseJson(resource.editions_json, []),
    deploymentModes: parseJson(resource.deployment_modes_json, []),
    licenseModels: parseJson(resource.license_models_json, []),
    compatibility: parseJson(resource.compatibility_json, []),
    pricingModel: resource.pricing_model,
    pricingNote: resource.pricing_note,
    region: resource.region,
    purchaseUrl: resource.purchase_url,
    documentationUrl: resource.documentation_url,
    evidenceUrl: resource.evidence_url,
    evidenceStatus: resource.evidence_status,
    verifiedAt: resource.verified_at,
  }));
  const publicSignals: PublicSignal[] = signals
    .filter((signal) => safePublicUrl(signal.url))
    .map((signal) => ({
      title: signal.title,
      description: briefPublicText(signal.summary),
      url: signal.url,
      sourceSlug: signal.sourceSlug,
      sourceName: signal.sourceName,
      sourceTier: signal.sourceTier,
      sourceRole: signal.sourceRole,
      sourceRegion: signal.sourceRegion,
      publishedAt: signal.publishedAt,
      collectedAt: signal.collectedAt,
      category: signal.category,
      tags: parseJson(signal.tagsJson, []),
      language: signal.language,
    }));
  const github = await githubDataAtBuildTime(productVersion, {
    allowNetwork: config.NODE_ENV !== "test" && process.env.VITEST !== "true",
  });
  const productData: ProductData = {
    version: productVersion,
    generatedAt,
    capabilities: capabilities.map((item) => ({ ...item })),
    roadmap: roadmap.map((stage) => ({ ...stage, milestones: [...stage.milestones] })),
    releases: releases.map((release) => ({
      ...release,
      capabilities: [...release.capabilities],
      changes: [...release.changes],
      ...(release.capabilitiesEn ? { capabilitiesEn: [...release.capabilitiesEn] } : {}),
      ...(release.changesEn ? { changesEn: [...release.changesEn] } : {}),
    })),
    evaluation: evaluation
      ? {
          status: evaluation.status,
          overallScore: evaluation.overallScore,
          rawWeightedScore: evaluation.rawWeightedScore,
          evidenceCoverage: evaluation.evidenceCoverage,
          dimensions: evaluation.dimensions,
          finishedAt: evaluation.finishedAt,
        }
      : null,
    sourceCoverage: {
      total: sources.length,
      active: sources.filter((source) => source.lifecycle_status === "active").length,
      observing: sources.filter((source) => source.observation_enabled === 1).length,
      candidate: sources.filter((source) => source.maintenance_status === "candidate").length,
      regions: [...new Set(sources.map((source) => source.region))],
      categories: [...new Set(sources.map((source) => source.source_category))],
    },
  };

  await rm(config.distDir, { recursive: true, force: true });
  await mkdir(join(config.distDir, "data"), { recursive: true });
  await cp(join(config.rootDir, "web/public"), config.distDir, { recursive: true });
  await optimizeStaticAssets(config.distDir);

  await Promise.all([
    writeJson(join(config.distDir, "data/timeline.json"), {
      schemaVersion: 2,
      datasetId: PUBLIC_DATASET_ID,
      locale: "zh-CN",
      generatedAt,
      siteUrl: config.PUBLIC_SITE_URL,
      events: enrichedEvents,
    }),
    writeJson(join(config.distDir, "data/timeline.en.json"), {
      schemaVersion: 2,
      datasetId: PUBLIC_DATASET_ID,
      locale: "en",
      generatedAt,
      siteUrl: config.PUBLIC_SITE_URL,
      events: enrichedEventsEn,
    }),
    writeJson(join(config.distDir, "data/tracks.json"), publicTracks),
    writeJson(join(config.distDir, "data/resources.json"), publicResources),
    writeJson(join(config.distDir, "data/scout.json"), {
      schemaVersion: 1,
      generatedAt,
      insights: scout,
    }),
    writeJson(join(config.distDir, "data/narratives.json"), {
      schemaVersion: 1,
      generatedAt,
      ...industryNarratives,
    }),
    writeJson(join(config.distDir, "data/product.json"), {
      schemaVersion: 1,
      ...productData,
    }),
    writeJson(join(config.distDir, "data/sources.json"), publicSources),
    writeJson(join(config.distDir, "data/signals.json"), {
      schemaVersion: 1,
      generatedAt,
      disclaimer:
        "Source observations are not verified public facts. Follow the original URL and use published Events for evidence-backed judgments.",
      signals: publicSignals,
    }),
    writeJson(join(config.distDir, "data/influencers.json"), publicInfluencers),
    writeJson(join(config.distDir, "data/actors.json"), publicActors),
    writeJson(
      join(config.distDir, "data/view.json"),
      view
        ? {
            slug: view.slug,
            name: view.name,
            description: view.description,
            filters: parseJson(view.filters_json, {}),
            layout: parseJson(view.layout_json, {}),
            theme: parseJson(view.theme_json, {}),
          }
        : {},
    ),
    writeJson(join(config.distDir, "data/github.json"), github),
  ]);

  const model: StaticSiteModel = {
    siteUrl: config.PUBLIC_SITE_URL,
    generatedAt,
    events: enrichedEvents,
    eventsEn: enrichedEventsEn,
    tracks: publicTracks,
    actors: publicActors,
    resources: publicResources,
    sources: publicSources,
    signals: publicSignals,
    influencers: publicInfluencers,
    scout: scout as PublicScoutInsight[],
    narratives: {
      horizon: { ...industryNarratives.horizon },
      eras: industryNarratives.eras.map((era) => ({
        ...era,
        projects: [],
      })),
      tracks: industryNarratives.tracks.map((track) => ({
        ...track,
        stages: track.stages.map((stage) => ({ ...stage })),
        lenses: track.lenses.map((lens) => ({
          ...lens,
          implications: [...lens.implications],
          actions: [...lens.actions],
          watch: [...lens.watch],
          evidenceSlugs: [...lens.evidenceSlugs],
        })),
      })),
    } satisfies IndustryNarratives,
    narrativesEn: {
      horizon: { ...industryNarrativesEn.horizon },
      eras: industryNarrativesEn.eras.map((era) => ({
        ...era,
        projects: [],
      })),
      tracks: industryNarrativesEn.tracks.map((track) => ({
        ...track,
        stages: track.stages.map((stage) => ({ ...stage })),
        lenses: track.lenses.map((lens) => ({
          ...lens,
          implications: [...lens.implications],
          actions: [...lens.actions],
          watch: [...lens.watch],
          evidenceSlugs: [...lens.evidenceSlugs],
        })),
      })),
    } satisfies IndustryNarratives,
    product: productData,
    github,
  };

  const allPages = renderStaticPages(model);
  await writeAllPages(allPages, config.distDir);

  await Promise.all([
    writeSitemap(allPages, config.PUBLIC_SITE_URL, config.distDir),
    writeRobotsTxt(config.PUBLIC_SITE_URL, config.distDir),
  ]);

  return {
    events: enrichedEvents.length,
    tracks: tracks.length,
    actors: actors.length,
    resources: resources.length,
    scout: scout.length,
    sources: sources.length,
    signals: publicSignals.length,
    version: productVersion,
    generatedAt,
  };
}

function englishTrackName(slug: string): string {
  return (
    (
      {
        "kernel-architecture": "Database Kernel & Architecture",
        "distributed-cloud": "Distributed, Cloud-native & Serverless",
        "realtime-lakehouse-multimodel": "Real-time Analytics, Lakehouse & Multimodel",
        "reliability-security-ops-cost": "Reliability, Security, Operations & Cost",
        "commercialization-adoption": "Commercialization & Industry Adoption",
        "china-ecosystem-policy": "China Ecosystem, Capital, Policy & Standards",
        oltp: "OLTP",
        "olap-htap": "OLAP / HTAP",
        "lakehouse-realtime": "Lakehouse & Real-time",
        multimodel: "Graph / Time-series / Vector / Multimodel",
        "open-source": "Open Source",
        "cloud-managed": "Managed Cloud",
        "private-xinchuang": "Private Deployment & Xinchuang",
        "critical-industries": "Critical Industries",
      } as Record<string, string>
    )[slug] ?? slug
  );
}

function safePublicUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function briefPublicText(value: string): string {
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length <= 220 ? text : `${text.slice(0, 217).trimEnd()}…`;
}

async function writeAllPages(pages: StaticPage[], distDir: string): Promise<void> {
  await Promise.all(
    pages.map(async (page) => {
      const path = join(distDir, page.path);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, page.content, "utf8");
    }),
  );
}

async function writeSitemap(pages: StaticPage[], siteUrl: string, distDir: string): Promise<void> {
  const baseUrl = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;

  // Collect unique routes from all pages
  const routes = new Map<string, { zhPath: string; enPath: string | null }>();

  for (const page of pages) {
    const path = page.path === "404.html" ? null : page.path;
    if (!path) continue;

    if (path.startsWith("en/")) {
      // en version
      const zhPath = path.slice(3); // remove "en/" prefix
      const existing = routes.get(zhPath);
      if (existing) {
        existing.enPath = path;
      } else {
        routes.set(zhPath, { zhPath, enPath: path });
      }
    } else {
      // zh-CN version (could also have en version in a separate page)
      const enPath = `en/${path}`;
      const existing = routes.get(path);
      if (existing) {
        existing.enPath = enPath;
      } else {
        routes.set(path, { zhPath: path, enPath: enPath });
      }
    }
  }

  const entries: string[] = [];
  for (const [, { zhPath, enPath }] of routes) {
    const zhUrl = `${baseUrl}${zhPath.replace(/(^|\/)index\.html$/, "$1")}`;
    const enUrl = enPath ? `${baseUrl}${enPath.replace(/(^|\/)index\.html$/, "$1")}` : null;

    entries.push(`  <url>
    <loc>${escapeXml(zhUrl)}</loc>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${escapeXml(zhUrl)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(zhUrl)}" />
    ${enUrl ? `<xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enUrl)}" />` : ""}
  </url>`);

    if (enUrl) {
      entries.push(`  <url>
    <loc>${escapeXml(enUrl)}</loc>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${escapeXml(zhUrl)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(zhUrl)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enUrl)}" />
  </url>`);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;

  await writeFile(join(distDir, "sitemap.xml"), sitemap, "utf8");
}

async function writeRobotsTxt(siteUrl: string, distDir: string): Promise<void> {
  const baseUrl = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
  const content = `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${baseUrl}sitemap.xml
`;
  await writeFile(join(distDir, "robots.txt"), content, "utf8");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizePublicHealth(value: string | undefined): PublicSource["healthStatus"] {
  if (value === "healthy" || value === "degraded" || value === "failed" || value === "skipped")
    return value;
  return "unchecked";
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value)}\n`, "utf8");
}

async function optimizeStaticAssets(distDir: string): Promise<void> {
  const cssPath = join(distDir, "assets/app.css");
  const scriptPath = join(distDir, "assets/core.js");
  const [css, script] = await Promise.all([
    readFile(cssPath, "utf8"),
    readFile(scriptPath, "utf8"),
  ]);
  const [optimizedCss, optimizedScript] = await Promise.all([
    transform(css, { loader: "css", minify: true, legalComments: "none" }),
    transform(script, {
      loader: "js",
      minifyWhitespace: true,
      minifySyntax: true,
      minifyIdentifiers: false,
      legalComments: "none",
      target: "es2022",
    }),
  ]);
  await Promise.all([
    writeFile(cssPath, optimizedCss.code, "utf8"),
    writeFile(scriptPath, optimizedScript.code, "utf8"),
  ]);
}
