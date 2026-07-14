import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { renderWeeklyBrief, weeklyBriefMarker } from "../src/cli/render-weekly-brief.js";

describe("weekly GitHub Issue brief", () => {
  it("groups the Shanghai ISO week and keeps public markdown safe", () => {
    const body = renderWeeklyBrief(
      {
        timeline: {
          generatedAt: "2026-07-19T13:20:00.000Z",
          events: [
            {
              slug: "weekly-event",
              title: "A | weekly <event>",
              happenedAt: "2026-07-13T03:00:00.000Z",
              category: "architecture",
              factSummary: "A verified database release fact",
              industryInsight: "This changes the database architecture control point.",
              futureOutlook: "Watch query stability and failure recovery.",
              impactScore: 88,
              valueScore: 84,
              evidence: [{ source: "Official Lab", publishedAt: "2026-07-13T03:00:00.000Z" }],
              tracks: [{ slug: "distributed-cloud", name: "分布式、云原生与 Serverless" }],
            },
            {
              slug: "old-event",
              title: "Old",
              happenedAt: "2026-07-05T03:00:00.000Z",
              category: "architecture",
              factSummary: "Old fact",
              industryInsight: "Old impact",
              futureOutlook: "Old watch",
            },
          ],
        },
        scout: {
          insights: [
            {
              title: "把「A weekly event」沉淀成一个可复用的数据或工具资产",
              hypothesis: "The workload may benefit from a distributed database.",
              suggestedAction: "Measure transaction latency and recovery for seven days.",
              counterSignals: "Recovery time or operating cost exceeds the baseline.",
              confidenceScore: 82,
              publishedAt: "2026-07-17T08:00:00.000Z",
            },
            {
              title: "围绕「A weekly event」发起一个 7 天内部验证",
              hypothesis: "A golden workload can expose the architecture boundary.",
              suggestedAction: "Run one workload and failure drill with a stop condition.",
              confidenceScore: 81,
              publishedAt: "2026-07-17T08:00:00.000Z",
            },
            {
              title: "从「A second event」验证一个窄而深的创业入口",
              hypothesis: "A narrow customer segment may pay for the result.",
              suggestedAction: "Interview five target users before building.",
              confidenceScore: 80,
              publishedAt: "2026-07-17T08:00:00.000Z",
            },
            {
              title: "围绕「A weekly event」建立一条可持续验证的公开观点",
              hypothesis: "Public correction can improve the claim.",
              suggestedAction: "Publish one evidence and counter-signal card.",
              confidenceScore: 79,
              publishedAt: "2026-07-17T08:00:00.000Z",
            },
          ],
        },
        product: {
          version: "0.1.0",
          evaluation: { overallScore: 83, evidenceCoverage: 91 },
          sourceCoverage: { total: 284, active: 18, observing: 31 },
        },
      },
      "2026-07-19",
    );

    expect(body).toContain(weeklyBriefMarker("2026-W29"));
    expect(body).toContain("A weekly event");
    expect(body).not.toContain("<event>");
    expect(body).not.toContain("Old fact");
    expect(body).toContain("Measure transaction latency and recovery for seven days.");
    expect(body).toContain("分布式、云原生与 Serverless");
    expect(body).not.toMatch(/Agent 与软件重构|模型能力|全球创新版图/);
    expect(body).toContain("来源目录：284 个");
    expect(body).toContain("## 本周关键变化");
    expect(body).toContain("## 下周三件事");
    expect(body).toContain("<summary>数据与覆盖</summary>");
    expect(body).not.toContain("## 本周最值得深读");
    expect(body).not.toContain("· 0 个节点");
    expect(body.match(/^\d\. \*\*/gm)).toHaveLength(3);
    expect(body.split("## 下周三件事")[0]?.match(/A weekly event/g)).toHaveLength(1);
    expect(body.split("\n").length).toBeLessThan(70);
  });

  it("keeps the workflow idempotent and Sunday-gated", async () => {
    const workflow = await readFile(".github/workflows/data-refresh.yml", "utf8");
    expect(workflow).toContain('cron: "17 12 * * *"');
    expect(workflow).toContain("db-pulse-weekly-brief");
    expect(workflow).toContain("DB Pulse 数据库行业周报");
    expect(workflow).toContain("weekly:issue");
    expect(workflow).toContain("weekly-brief");
    expect(workflow).toContain('"$PUBLISH_WEEKLY" == "true"');
    expect(workflow).toContain('"$weekday" == "7"');
    expect(workflow).toContain('"$hour" -ge 20');
    expect(workflow).toContain('[[ -s "$RUNNER_TEMP/weekly-brief.md" ]]');
    expect(workflow).toContain("skipping the weekly Issue");
    expect(workflow).toContain("gh issue edit");
    expect(workflow).not.toContain("daily:issue");
    expect(workflow).not.toContain("agent-pulse-daily-brief");
  });

  it("does not render a weekly Issue when no public Event clears the gate", () => {
    const body = renderWeeklyBrief(
      {
        timeline: { events: [] },
        scout: { insights: [] },
        product: { sourceCoverage: { total: 284, active: 18, observing: 31 } },
      },
      "2026-07-19",
    );

    expect(body).toBe("");
  });
});
