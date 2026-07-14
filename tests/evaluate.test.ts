import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/env.js";
import { createDatabase } from "../src/db/database.js";
import { migrateToLatest } from "../src/db/migrate.js";
import { Repository } from "../src/db/repository.js";
import { seedDatabase } from "../src/db/seed.js";
import {
  calculateOverallScore,
  calibrateDimension,
  type EvaluationDimension,
  evaluateSystem,
} from "../src/pipeline/evaluate.js";

const databases: ReturnType<typeof createDatabase>[] = [];

afterEach(async () => {
  while (databases.length) await databases.pop()?.destroy();
});

function dimension(overrides: Partial<EvaluationDimension> = {}): EvaluationDimension {
  return {
    slug: "test",
    name: "Test",
    score: 50,
    rawScore: 50,
    scoreCap: 100,
    weight: 10,
    status: "measured",
    sampleSize: 100,
    sampleTarget: 100,
    summary: "test",
    evidence: {},
    penalties: [],
    nextAction: "test",
    ...overrides,
  };
}

describe("evaluation calibration", () => {
  it("hard caps an insufficient-data dimension at 60 if some samples exist", () => {
    const result = calibrateDimension({
      slug: "confidence",
      name: "Confidence",
      rawScore: 98,
      weight: 10,
      sufficient: false,
      sampleSize: 3,
      sampleTarget: 30,
      summary: "too few samples",
      evidence: { samples: 3 },
      nextAction: "collect evidence",
      insufficientCap: 80,
    });

    expect(result).toMatchObject({
      rawScore: 98,
      score: 60,
      scoreCap: 60,
      status: "insufficient_data",
    });
  });

  it("keeps a stricter dimension-specific cap", () => {
    const result = calibrateDimension({
      slug: "effectiveness",
      name: "Effectiveness",
      rawScore: 100,
      weight: 10,
      sufficient: false,
      sampleSize: 0,
      sampleTarget: 30,
      summary: "no outcome samples",
      evidence: {},
      nextAction: "collect outcomes",
      insufficientCap: 20,
    });

    expect(result.score).toBe(20);
    expect(result.scoreCap).toBe(20);
  });

  it("includes insufficient dimensions and applies evidence coverage confidence", () => {
    const result = calculateOverallScore([
      dimension({ score: 100, rawScore: 100, weight: 50 }),
      dimension({
        slug: "uncalibrated",
        score: 45,
        rawScore: 100,
        scoreCap: 45,
        weight: 50,
        status: "insufficient_data",
      }),
    ]);

    expect(result).toEqual({
      rawWeightedScore: 73,
      evidenceCoverage: 50,
      overallScore: 63,
    });
  });

  it("cannot produce a high overall score when every dimension lacks evidence", () => {
    const result = calculateOverallScore([
      dimension({
        score: 45,
        rawScore: 100,
        scoreCap: 45,
        status: "insufficient_data",
      }),
      dimension({
        slug: "second",
        score: 20,
        rawScore: 100,
        scoreCap: 20,
        status: "insufficient_data",
      }),
    ]);

    expect(result.evidenceCoverage).toBe(0);
    expect(result.rawWeightedScore).toBe(33);
    expect(result.overallScore).toBe(24);
  });

  it("calculates public product evaluation from the database-cn domain only", async () => {
    const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: "sqlite::memory:" });
    const db = createDatabase(config);
    databases.push(db);
    await migrateToLatest(db, config);
    await seedDatabase(db);
    const baseline = await evaluateSystem(db);

    const source = await db.selectFrom("sources").selectAll().executeTakeFirstOrThrow();
    await db
      .insertInto("sources")
      .values({
        ...source,
        id: "legacy-evaluation-source",
        slug: "legacy-evaluation-source",
        content_domain: "ai-industry",
      })
      .execute();
    const signal = await new Repository(db).insertSignal("legacy-evaluation-source", {
      externalId: "legacy-evaluation-signal",
      url: "https://example.com/legacy-evaluation-signal",
      title: "Legacy AI evaluation signal",
      summary: "Legacy AI evidence that must not affect the DB Pulse product score.",
      language: "en",
      publishedAt: "2026-07-12T00:00:00.000Z",
      category: "legacy",
      tags: [],
      metrics: {},
      rawMeta: {},
    });
    const event = await db.selectFrom("events").selectAll().executeTakeFirstOrThrow();
    await db
      .insertInto("events")
      .values({
        ...event,
        id: "legacy-evaluation-event",
        slug: "legacy-evaluation-event",
        content_domain: "ai-industry",
      })
      .execute();
    await new Repository(db).attachSignal(
      "legacy-evaluation-event",
      signal?.id ?? "missing",
      "primary",
      100,
    );
    const scout = await db.selectFrom("scout_insights").selectAll().executeTakeFirstOrThrow();
    await db
      .insertInto("scout_insights")
      .values({
        ...scout,
        id: "legacy-evaluation-scout",
        slug: "legacy-evaluation-scout",
        cooldown_key: "legacy-evaluation-scout",
        content_domain: "ai-industry",
      })
      .execute();

    const evaluation = await evaluateSystem(db);
    expect(evaluation.overallScore).toBe(baseline.overallScore);
    expect(evaluation.rawWeightedScore).toBe(baseline.rawWeightedScore);
    expect(evaluation.evidenceCoverage).toBe(baseline.evidenceCoverage);
    expect(evaluation.dimensions).toEqual(baseline.dimensions);
  });
});
