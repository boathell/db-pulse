import type { Kysely } from "kysely";
import { Repository } from "../db/repository.js";
import type { DatabaseSchema, EventRow } from "../db/types.js";
import { PUBLIC_CONTENT_DOMAIN } from "../domain/content-domain.js";
import { eventabilityScore } from "./cluster.js";

export interface ReviewNoiseCandidate {
  eventId: string;
  signalId: string;
  title: string;
  sourceSlug: string;
  eventabilityScore: number;
}

export async function findReviewNoiseCandidates(
  db: Kysely<DatabaseSchema>,
): Promise<ReviewNoiseCandidate[]> {
  const [events, links, signals, sources] = await Promise.all([
    db
      .selectFrom("events")
      .selectAll()
      .where("status", "=", "review")
      .where("manual_override", "=", 0)
      .where("content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .execute(),
    db
      .selectFrom("event_signals")
      .innerJoin("events", "events.id", "event_signals.event_id")
      .select(["event_signals.event_id", "event_signals.signal_id"])
      .where("events.content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .execute(),
    db
      .selectFrom("signals")
      .innerJoin("sources", "sources.id", "signals.source_id")
      .selectAll("signals")
      .where("sources.content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .execute(),
    db
      .selectFrom("sources")
      .selectAll()
      .where("content_domain", "=", PUBLIC_CONTENT_DOMAIN)
      .execute(),
  ]);
  const linksByEvent = groupLinks(links);
  const signalsById = new Map(signals.map((signal) => [signal.id, signal]));
  const sourcesById = new Map(sources.map((source) => [source.id, source]));
  const candidates: ReviewNoiseCandidate[] = [];
  for (const event of events) {
    if (!containsPlaceholder(event)) continue;
    const eventLinks = linksByEvent.get(event.id) ?? [];
    if (eventLinks.length !== 1) continue;
    const signal = signalsById.get(eventLinks[0]?.signal_id ?? "");
    const source = signal ? sourcesById.get(signal.source_id) : undefined;
    if (!signal || !source) continue;
    const score = eventabilityScore(signal, source);
    if (score >= 70) continue;
    candidates.push({
      eventId: event.id,
      signalId: signal.id,
      title: event.title,
      sourceSlug: source.slug,
      eventabilityScore: score,
    });
  }
  return candidates.sort(
    (left, right) =>
      left.eventabilityScore - right.eventabilityScore || left.title.localeCompare(right.title),
  );
}

export async function reconcileReviewNoise(
  db: Kysely<DatabaseSchema>,
): Promise<{ suppressed: number; sourceCounts: Record<string, number> }> {
  const candidates = await findReviewNoiseCandidates(db);
  const sourceCounts: Record<string, number> = {};
  await db.transaction().execute(async (trx) => {
    const repository = new Repository(trx);
    for (const candidate of candidates) {
      const event = await trx
        .selectFrom("events")
        .selectAll()
        .where("id", "=", candidate.eventId)
        .where("content_domain", "=", PUBLIC_CONTENT_DOMAIN)
        .executeTakeFirst();
      if (!event) continue;
      await repository.deferSignal(
        candidate.signalId,
        "low_eventability_review_suppressed",
        candidate.eventabilityScore,
        { suppressedEvent: event, reversible: true },
      );
      await trx
        .deleteFrom("events")
        .where("id", "=", candidate.eventId)
        .where("content_domain", "=", PUBLIC_CONTENT_DOMAIN)
        .execute();
      sourceCounts[candidate.sourceSlug] = (sourceCounts[candidate.sourceSlug] ?? 0) + 1;
    }
  });
  return { suppressed: candidates.length, sourceCounts };
}

function groupLinks(
  rows: Array<{ event_id: string; signal_id: string }>,
): Map<string, Array<{ event_id: string; signal_id: string }>> {
  const groups = new Map<string, Array<{ event_id: string; signal_id: string }>>();
  for (const row of rows) {
    const values = groups.get(row.event_id) ?? [];
    values.push(row);
    groups.set(row.event_id, values);
  }
  return groups;
}

function containsPlaceholder(event: EventRow): boolean {
  return [
    event.technical_insight,
    event.industry_insight,
    event.future_outlook,
    event.business_value,
  ].some((value) => /待编辑|待补充|\bTBD\b|\bTODO\b|placeholder/i.test(value));
}
