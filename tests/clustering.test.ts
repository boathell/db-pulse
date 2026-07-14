import { describe, expect, it } from "vitest";
import {
  belongsToEvent,
  eventFacet,
  eventFingerprint,
  titleSimilarity,
} from "../src/domain/clustering.js";

describe("database event clustering", () => {
  it("groups two release reports for the same database version", () => {
    const left = "OceanBase 4.3.5 release improves distributed SQL stability";
    const right = "OceanBase 4.3.5 release adds distributed SQL stability updates";
    expect(titleSimilarity(left, right)).toBeGreaterThan(0.4);
    expect(
      belongsToEvent(
        { title: left, publishedAt: "2026-07-11T00:00:00Z" },
        { title: right, happenedAt: "2026-07-10T12:00:00Z" },
      ),
    ).toBe(true);
    expect(eventFingerprint(left)).toBe("oceanbase:4.3.5");
  });

  it("does not group identical versions outside the 21-day window", () => {
    expect(
      belongsToEvent(
        { title: "TiDB 8.5 release", publishedAt: "2026-07-11T00:00:00Z" },
        { title: "TiDB 8.5 release", happenedAt: "2026-01-01T00:00:00Z" },
      ),
    ).toBe(false);
  });

  it("keeps benchmark or capability evaluations separate from a release", () => {
    const release = "Apache Doris 3.1 release announced";
    const evaluation = "Apache Doris 3.1 benchmark evaluates query performance";
    expect(eventFingerprint(release)).toBe("doris:3.1");
    expect(eventFingerprint(evaluation)).toBe("doris:3.1");
    expect(
      belongsToEvent(
        { title: evaluation, publishedAt: "2026-07-12T00:00:00Z" },
        { title: release, happenedAt: "2026-07-10T12:00:00Z" },
      ),
    ).toBe(false);
  });

  it("keeps incidents and pricing changes separate from releases", () => {
    expect(eventFacet("PolarDB outage affects database requests")).toBe("incident");
    expect(eventFacet("GaussDB pricing and billing update")).toBe("pricing");
    expect(
      belongsToEvent(
        { title: "PolarDB 2.0 outage affects requests", publishedAt: "2026-07-12T00:00:00Z" },
        { title: "PolarDB 2.0 release announced", happenedAt: "2026-07-10T12:00:00Z" },
      ),
    ).toBe(false);
  });

  it("classifies database deployment, migration and compatibility adoption separately", () => {
    expect(eventFacet("OceanBase managed service enters a cloud marketplace")).toBe("distribution");
    expect(eventFacet("达梦数据库完成核心系统兼容迁移与私有化部署")).toBe("distribution");
  });

  it("normalizes Chinese ecosystem aliases", () => {
    expect(eventFingerprint("达梦数据库 DM8 发布升级")).toBe("dameng:dm8");
    expect(eventFingerprint("人大金仓 KingbaseES V9 发布")).toBe("kingbase:v9");
    expect(eventFingerprint("涛思数据 TDengine 3.3 发布")).toBe("tdengine:3.3");
  });

  it.each([
    ["Dameng DM8 release", "dameng"],
    ["KingbaseES V9 release", "kingbase"],
    ["GBase 8a release", "gbase"],
    ["GoldenDB 6.1 release", "goldendb"],
    ["OceanBase 4.3 release", "oceanbase"],
    ["TiDB 8.5 release", "tidb"],
    ["openGauss 7.0 release", "opengauss"],
    ["GaussDB 8.3 release", "gaussdb"],
    ["PolarDB-X 2.4 release", "polardb"],
    ["TDSQL 10.3 release", "tdsql"],
    ["Vastbase G100 3.0 release", "vastbase"],
    ["SequoiaDB 5.8 release", "sequoiadb"],
    ["MatrixOne 2.0 release", "matrixone"],
    ["Apache Doris 3.1 release", "doris"],
    ["StarRocks 4.0 release", "starrocks"],
    ["TDengine 3.3 release", "tdengine"],
    ["NebulaGraph 3.8 release", "nebulagraph"],
    ["Milvus 2.6 release", "milvus"],
  ])("maps %s to the %s ecosystem", (title, ecosystem) => {
    expect(eventFingerprint(title)?.split(":")[0]).toBe(ecosystem);
  });
});
