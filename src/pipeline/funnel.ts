import type { Kysely } from "kysely";
import type { DatabaseSchema } from "../db/types.js";
import { PUBLIC_CONTENT_DOMAIN } from "../domain/content-domain.js";
import { eventReadinessSummary } from "./readiness.js";

export interface PipelineFunnelReport {
  generatedAt: string;
  signals: {
    total: number;
    clustered: number;
    backlog: number;
    deferred: number;
    primary: number;
    aggregatorDebt: number;
    latestPublishedAt: string | null;
  };
  events: {
    total: number;
    draft: number;
    review: number;
    published: number;
    hidden: number;
    ready: number;
    blocked: number;
    multiSource: number;
    singleSource: number;
    noEvidence: number;
    placeholder: number;
    latestHappenedAt: string | null;
    latestPublishedAt: string | null;
  };
  conversion: {
    signalToEventPercent: number;
    eventToPublishedPercent: number;
    multiSourcePercent: number;
    readinessPercent: number;
  };
  blockerCounts: Record<string, number>;
}

export async function generatePipelineFunnel(
  db: Kysely<DatabaseSchema>,
): Promise<PipelineFunnelReport> {
  const [signals, clustered, triage, provenance, events, evidence, readiness] = await Promise.all([
    db
      .selectFrom("signals")
      .innerJoin("sources", "sources.id", "signals.source_id")
      .selectAll("signals")
      .where("sources.content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .execute(),
    db
      .selectFrom("event_signals")
      .innerJoin("events", "events.id", "event_signals.event_id")
      .innerJoin("signals", "signals.id", "event_signals.signal_id")
      .innerJoin("sources", "sources.id", "signals.source_id")
      .select("event_signals.signal_id")
      .where("events.content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .where("sources.content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .distinct()
      .execute(),
    db
      .selectFrom("signal_triage")
      .innerJoin("signals", "signals.id", "signal_triage.signal_id")
      .innerJoin("sources", "sources.id", "signals.source_id")
      .select(({ fn }) => fn.countAll<number>().as("count"))
      .where("status", "=", "deferred")
      .where("sources.content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .executeTakeFirstOrThrow(),
    db
      .selectFrom("signals")
      .innerJoin("sources", "sources.id", "signals.source_id")
      .select(["signals.id", "sources.role", "sources.source_category as sourceCategory"])
      .where("sources.content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .execute(),
    db
      .selectFrom("events")
      .selectAll()
      .where("content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .execute(),
    db
      .selectFrom("event_signals")
      .innerJoin("events", "events.id", "event_signals.event_id")
      .innerJoin("signals", "signals.id", "event_signals.signal_id")
      .innerJoin("sources", "sources.id", "signals.source_id")
      .select(["event_signals.event_id as eventId", "signals.source_id as sourceId"])
      .where("events.content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .where("sources.content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .execute(),
    eventReadinessSummary(db),
  ]);

  const sourcesByEvent = new Map<string, Set<string>>();
  for (const row of evidence) {
    const sourceIds = sourcesByEvent.get(row.eventId) ?? new Set<string>();
    sourceIds.add(row.sourceId);
    sourcesByEvent.set(row.eventId, sourceIds);
  }
  const multiSource = [...sourcesByEvent.values()].filter((items) => items.size >= 2).length;
  const singleSource = [...sourcesByEvent.values()].filter((items) => items.size === 1).length;
  const noEvidence = events.length - sourcesByEvent.size;
  const published = events.filter((event) => event.status === "published");
  const aggregatorDebt = provenance.filter(
    (row) => row.role === "aggregator" || row.sourceCategory === "aggregator",
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    signals: {
      total: signals.length,
      clustered: clustered.length,
      backlog: Math.max(0, signals.length - clustered.length - Number(triage.count)),
      deferred: Number(triage.count),
      primary: provenance.length - aggregatorDebt,
      aggregatorDebt,
      latestPublishedAt: latest(signals.map((signal) => signal.published_at)),
    },
    events: {
      total: events.length,
      draft: countStatus(events, "draft"),
      review: countStatus(events, "review"),
      published: published.length,
      hidden: countStatus(events, "hidden"),
      ready: readiness.ready,
      blocked: readiness.blocked,
      multiSource,
      singleSource,
      noEvidence,
      placeholder: events.filter((event) =>
        [
          event.fact_summary,
          event.summary,
          event.technical_insight,
          event.industry_insight,
          event.future_outlook,
          event.business_value,
        ].some((value) => /待编辑|待补充|\bTBD\b|\bTODO\b|placeholder/i.test(value)),
      ).length,
      latestHappenedAt: latest(events.map((event) => event.happened_at)),
      latestPublishedAt: latest(
        published.map((event) => event.published_at).filter((value): value is string => !!value),
      ),
    },
    conversion: {
      signalToEventPercent: percent(events.length, signals.length),
      eventToPublishedPercent: percent(published.length, events.length),
      multiSourcePercent: percent(multiSource, events.length),
      readinessPercent: percent(readiness.ready, events.length),
    },
    blockerCounts: readiness.blockerCounts,
  };
}

function countStatus(events: Array<{ status: string }>, status: string): number {
  return events.filter((event) => event.status === status).length;
}

function percent(value: number, total: number): number {
  return total ? Math.round((value / total) * 10_000) / 100 : 0;
}

function latest(values: string[]): string | null {
  return values.length ? values.reduce((left, right) => (left > right ? left : right)) : null;
}
