import type { PublicEvidence } from "../../domain/types.js";
import type { EnrichedEvent, NarrativeStage, PublicSource, TechnologyCoverage } from "./dto.js";

export interface EventDevelopment {
  kind: "origin" | "official" | "discussion" | "response";
  evidence: PublicEvidence;
}

export interface EventYearGroup {
  year: number;
  months: Array<{
    key: string;
    year: number;
    month: number;
    events: EnrichedEvent[];
  }>;
}

export type TimelineMonthItem =
  | { kind: "event"; event: EnrichedEvent }
  | { kind: "research-day"; key: string; events: EnrichedEvent[] };

export interface MonthlyEventDensity {
  key: string;
  count: number;
  target: number;
  status: "balanced" | "gap" | "in-progress";
}

export interface ResearchBatchDay {
  day: string;
  count: number;
  status: "published" | "weekend" | "waiting";
}

export interface SourcePortfolioBucket {
  key: string;
  total: number;
  healthy: number;
  observing: number;
}

export interface SourcePortfolio {
  categories: SourcePortfolioBucket[];
  regions: SourcePortfolioBucket[];
  acquisitions: SourcePortfolioBucket[];
  health: SourcePortfolioBucket[];
}

interface CoverageDefinition {
  slug: string;
  name: string;
  description: string;
  terms: string[];
  expectedChannels: string[];
  nextAction: string;
}

const databaseEcosystems = [
  ["dameng", "达梦", ["dameng", "dm8", "达梦"]],
  ["kingbase", "人大金仓", ["kingbase", "kingbasees", "金仓"]],
  ["gbase", "GBase", ["gbase", "南大通用"]],
  ["goldendb", "GoldenDB", ["goldendb", "金篆信科"]],
  ["oceanbase", "OceanBase", ["oceanbase"]],
  ["tidb", "TiDB", ["tidb", "pingcap"]],
  ["opengauss", "openGauss", ["opengauss"]],
  ["gaussdb", "GaussDB", ["gaussdb"]],
  ["polardb", "PolarDB", ["polardb", "polardb-x"]],
  ["tdsql", "TDSQL", ["tdsql"]],
  ["vastbase", "Vastbase", ["vastbase", "海量数据"]],
  ["sequoiadb", "SequoiaDB", ["sequoiadb", "巨杉"]],
  ["matrixone", "MatrixOne", ["matrixone", "矩阵起源"]],
  ["apache-doris", "Apache Doris", ["apache doris", "doris"]],
  ["starrocks", "StarRocks", ["starrocks"]],
  ["tdengine", "TDengine", ["tdengine", "涛思"]],
  ["nebulagraph", "NebulaGraph", ["nebulagraph", "nebula graph"]],
  ["milvus", "Milvus", ["milvus", "zilliz"]],
] as const;

export const coverageDefinitions: CoverageDefinition[] = databaseEcosystems.map(
  ([slug, name, terms]) => ({
    slug,
    name,
    description: `${name} 的官方产品、版本、文档、生产采用与独立验证覆盖。`,
    terms: [...terms],
    expectedChannels: ["official", "releases", "research", "community", "enterprise"],
    nextAction: `补强 ${name} 的连续版本记录、独立生产证据、兼容验证和成本口径。`,
  }),
);

export function summarizeSourcePortfolio(sources: PublicSource[]): SourcePortfolio {
  return {
    categories: groupSourcePortfolio(sources, (source) => source.category),
    regions: groupSourcePortfolio(sources, (source) => source.region),
    acquisitions: groupSourcePortfolio(sources, (source) => source.acquisition),
    health: groupSourcePortfolio(sources, (source) => source.healthStatus),
  };
}

function groupSourcePortfolio(
  sources: PublicSource[],
  keyFor: (source: PublicSource) => string,
): SourcePortfolioBucket[] {
  const buckets = new Map<string, PublicSource[]>();
  for (const source of sources) {
    const key = keyFor(source) || "unknown";
    const bucket = buckets.get(key) ?? [];
    bucket.push(source);
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .map(([key, entries]) => ({
      key,
      total: entries.length,
      healthy: entries.filter((source) => source.healthStatus === "healthy").length,
      observing: entries.filter((source) => source.observationEnabled).length,
    }))
    .sort((left, right) => right.total - left.total || left.key.localeCompare(right.key));
}

export function sortEventsByLatestDevelopment(events: EnrichedEvent[]): EnrichedEvent[] {
  return [...events].sort(
    (left, right) => latestDevelopmentTime(right) - latestDevelopmentTime(left),
  );
}

export function latestDevelopmentAt(event: EnrichedEvent): string {
  return new Date(latestDevelopmentTime(event)).toISOString();
}

export function evidenceForNarrativeStage(
  event: EnrichedEvent,
  stage: NarrativeStage,
): PublicEvidence[] {
  return event.evidence.filter((evidence) => dateFallsInStage(evidence.publishedAt, stage));
}

export function eventTouchesNarrativeStage(event: EnrichedEvent, stage: NarrativeStage): boolean {
  return latestNarrativeStageDevelopmentAt(event, stage) !== null;
}

export function latestNarrativeStageDevelopmentAt(
  event: EnrichedEvent,
  stage: NarrativeStage,
): string | null {
  const timestamps = evidenceForNarrativeStage(event, stage).map((evidence) =>
    Date.parse(evidence.publishedAt),
  );
  if (dateFallsInStage(event.happenedAt, stage)) timestamps.push(Date.parse(event.happenedAt));
  const validTimestamps = timestamps.filter(Number.isFinite);
  return validTimestamps.length ? new Date(Math.max(...validTimestamps)).toISOString() : null;
}

function dateFallsInStage(value: string, stage: NarrativeStage): boolean {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;
  const day = new Date(timestamp).toISOString().slice(0, 10);
  return day >= stage.start && day <= stage.end;
}

export function isRecentEvent(
  event: EnrichedEvent,
  referenceAt = new Date().toISOString(),
  windowDays = 7,
): boolean {
  const delta = Date.parse(referenceAt) - Date.parse(latestDevelopmentAt(event));
  return Number.isFinite(delta) && delta >= 0 && delta <= windowDays * 86_400_000;
}

export function recentMonthlyDensity(
  events: EnrichedEvent[],
  referenceAt: string,
  months = 3,
  target = 6,
): MonthlyEventDensity[] {
  const reference = new Date(referenceAt);
  return Array.from({ length: months }, (_, offset) => {
    const date = new Date(
      Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - offset, 1),
    );
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const count = events.filter((event) => latestDevelopmentAt(event).startsWith(key)).length;
    return {
      key,
      count,
      target,
      status: offset === 0 ? "in-progress" : count >= target ? "balanced" : "gap",
    };
  });
}

export function recentResearchBatches(
  events: EnrichedEvent[],
  referenceAt: string,
  days = 3,
): ResearchBatchDay[] {
  const arxivEvents = events.filter(
    (event) =>
      isResearch(event) &&
      event.evidence.some((evidence) => {
        try {
          return new URL(evidence.url).hostname === "arxiv.org";
        } catch {
          return false;
        }
      }),
  );
  const reference = new Date(referenceAt);
  return Array.from({ length: days }, (_, offset) => {
    const date = new Date(reference.getTime() - offset * 86_400_000);
    const day = date.toISOString().slice(0, 10);
    const count = arxivEvents.filter((event) => latestDevelopmentAt(event).startsWith(day)).length;
    const weekday = date.getUTCDay();
    return {
      day,
      count,
      status: count > 0 ? "published" : weekday === 0 || weekday === 6 ? "weekend" : "waiting",
    };
  });
}

export function groupEventsByYearMonth(events: EnrichedEvent[]): EventYearGroup[] {
  const years = new Map<number, Map<number, EnrichedEvent[]>>();
  for (const event of sortEventsByLatestDevelopment(events)) {
    const date = new Date(latestDevelopmentAt(event));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const months = years.get(year) ?? new Map<number, EnrichedEvent[]>();
    const items = months.get(month) ?? [];
    items.push(event);
    months.set(month, items);
    years.set(year, months);
  }
  return [...years.entries()]
    .sort(([left], [right]) => right - left)
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort(([left], [right]) => right - left)
        .map(([month, items]) => ({
          key: `${year}-${String(month).padStart(2, "0")}`,
          year,
          month,
          events: items,
        })),
    }));
}

export function groupTimelineMonthItems(
  events: EnrichedEvent[],
  researchThreshold = 4,
): TimelineMonthItem[] {
  const researchByDay = new Map<string, EnrichedEvent[]>();
  for (const event of events) {
    if (!["research", "paper"].includes(event.category.toLowerCase())) continue;
    const day = latestDevelopmentAt(event).slice(0, 10);
    const items = researchByDay.get(day) ?? [];
    items.push(event);
    researchByDay.set(day, items);
  }

  const emittedDays = new Set<string>();
  const items: TimelineMonthItem[] = [];
  for (const event of events) {
    const isResearch = ["research", "paper"].includes(event.category.toLowerCase());
    const day = latestDevelopmentAt(event).slice(0, 10);
    const research = researchByDay.get(day) ?? [];
    if (isResearch && research.length >= researchThreshold) {
      if (emittedDays.has(day)) continue;
      emittedDays.add(day);
      items.push({ kind: "research-day", key: day, events: research });
    } else {
      items.push({ kind: "event", event });
    }
  }
  return items;
}

function isResearch(event: EnrichedEvent): boolean {
  return ["research", "paper"].includes(event.category.toLowerCase());
}

export function eventDevelopments(event: EnrichedEvent): EventDevelopment[] {
  const seen = new Set<string>();
  return [...event.evidence]
    .filter((evidence) => {
      const key = `${evidence.url.trim().toLowerCase()}|${evidence.title.trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => toTime(left.publishedAt) - toTime(right.publishedAt))
    .map((evidence, index) => ({
      kind:
        index === 0
          ? "origin"
          : evidence.role === "primary"
            ? "official"
            : evidence.role === "amplification"
              ? "discussion"
              : "response",
      evidence,
    }));
}

export function analyzeTechnologyCoverage(sources: PublicSource[]): TechnologyCoverage[] {
  return coverageDefinitions.map((definition) => {
    const matches = sources.filter((source) => sourceMatches(source, definition.terms));
    const healthySources = matches.filter((source) => source.healthStatus === "healthy").length;
    const checked = matches.filter((source) => source.healthStatus !== "unchecked");
    const channels = [...new Set(matches.flatMap(sourceChannels))];
    const missingChannels = definition.expectedChannels.filter(
      (channel) => !channels.includes(channel),
    );
    const status = coverageStatus(
      matches,
      healthySources,
      checked.length,
      channels.length,
      missingChannels.length,
    );
    return {
      slug: definition.slug,
      name: definition.name,
      description: definition.description,
      status,
      sources: matches,
      healthySources,
      activeSources: matches.filter((source) => source.lifecycle === "active").length,
      observingSources: matches.filter((source) => source.observationEnabled).length,
      channels,
      missingChannels,
      nextAction: definition.nextAction,
    };
  });
}

function latestDevelopmentTime(event: EnrichedEvent): number {
  return Math.max(
    toTime(event.happenedAt),
    ...event.evidence.map((evidence) => toTime(evidence.publishedAt)),
  );
}

function toTime(value: string): number {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function sourceMatches(source: PublicSource, terms: string[]): boolean {
  const haystack = [source.slug, source.name, source.category, ...source.topics]
    .join(" ")
    .toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

function sourceChannels(source: PublicSource): string[] {
  const channels: string[] = [];
  if (source.role === "primary" && source.acquisition !== "github") channels.push("official");
  if (source.acquisition === "github") channels.push("releases");
  if (source.role === "research" || source.category === "research-eval") channels.push("research");
  if (["expert", "media", "heat"].includes(source.role) || source.category === "community-heat")
    channels.push("community");
  if (source.topics.some((topic) => ["sdk", "protocol", "developer"].includes(topic)))
    channels.push("sdk");
  if (source.topics.includes("enterprise")) channels.push("enterprise");
  return channels;
}

function coverageStatus(
  matches: PublicSource[],
  healthy: number,
  checked: number,
  channels: number,
  missingChannels: number,
): TechnologyCoverage["status"] {
  if (!matches.length) return "gap";
  if (!checked) return "unchecked";
  if (!healthy) return "gap";
  if (healthy >= 2 && channels >= 2 && missingChannels === 0) return "covered";
  return "watch";
}
