import { describe, expect, it } from "vitest";
import type { EventRow } from "../src/db/types.js";
import { buildScoutCard } from "../src/pipeline/scout.js";

const event = {
  title: "A new agent capability ships",
  confidence_score: 82,
  heat_score: 76,
  impact_score: 91,
  value_score: 88,
} as EventRow;

describe("Scout deterministic cards", () => {
  it.each([
    "venture",
    "media",
    "work",
  ] as const)("creates evidence-shaped %s opportunities", (kind) => {
    const card = buildScoutCard(event, kind);
    expect(card.hypothesis.length).toBeGreaterThan(30);
    expect(card.suggested_action).toMatch(/48 小时|工作流/);
    expect(card.artifact_idea.length).toBeGreaterThan(10);
    expect(card.counter_signals).toContain("证据");
    expect(card.total_score).toBeGreaterThan(70);
  });
});
