import { describe, expect, it } from "vitest";
import { heatLabel, scoreEvent } from "../src/domain/scoring.js";
import { independentEvidenceOwnerCount } from "../src/pipeline/cluster.js";

describe("scoreEvent", () => {
  it("labels a verified domestic multi-source signal without a cross-region gate", () => {
    const result = scoreEvent({
      authorityScores: [98, 72],
      primaryEvidenceCount: 1,
      independentSourceCount: 4,
      metrics: [
        { authors: 80, tweets: 250, platforms: ["weibo"], regions: ["CN"] },
        { authors: 30, platforms: ["weibo", "wechat"], regions: ["CN"] },
      ],
      ageHours: 5,
      impactHint: 90,
    });
    expect(result.confidence).toBeGreaterThan(85);
    expect(result.heat).toBeGreaterThan(70);
    expect(result.factors.crossRegion).toBe(false);
    expect(
      heatLabel(
        result.heat,
        result.confidence,
        false,
        result.factors.independentSources,
        result.factors.platformBreadth,
      ),
    ).toBe("国内热点");
  });

  it("does not call a single-platform weak signal cross-region hot", () => {
    const result = scoreEvent({
      authorityScores: [45],
      primaryEvidenceCount: 0,
      independentSourceCount: 1,
      metrics: [{ authors: 3, tweets: 4, platforms: ["x"], regions: ["US"] }],
      ageHours: 1,
    });
    expect(result.confidence).toBeLessThan(60);
    expect(result.factors.crossRegion).toBe(false);
  });

  it("still requires independent sources and platform breadth for a hot label", () => {
    expect(heatLabel(90, 90, false, 1, 3)).toBe("高关注");
    expect(heatLabel(90, 90, false, 3, 1)).toBe("高关注");
  });

  it("does not count two entrances owned by one ecosystem as independent evidence", () => {
    expect(
      independentEvidenceOwnerCount([
        { sourceId: "oceanbase-official", sourceOwner: "OceanBase" },
        { sourceId: "oceanbase-releases", sourceOwner: "OceanBase" },
        { sourceId: "infoq", sourceOwner: "InfoQ" },
      ]),
    ).toBe(2);
  });
});
