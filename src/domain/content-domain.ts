export const PUBLIC_CONTENT_DOMAIN = "database-cn" as const;
export const LEGACY_CONTENT_DOMAIN = "ai-industry" as const;
export const PUBLIC_DATASET_ID = "db-pulse-cn-v1" as const;
export const PUBLIC_VIEW_SLUG = "database-decision-briefing" as const;
export type PublicLocale = "zh-CN" | "en";

export const PUBLIC_TRACK_SLUGS = [
  "kernel-architecture",
  "distributed-cloud",
  "realtime-lakehouse-multimodel",
  "reliability-security-ops-cost",
  "commercialization-adoption",
  "china-ecosystem-policy",
  "oltp",
  "olap-htap",
  "lakehouse-realtime",
  "multimodel",
  "open-source",
  "cloud-managed",
  "private-xinchuang",
  "critical-industries",
] as const;

export const PUBLIC_ACTOR_SLUGS = [
  "dameng",
  "kingbase",
  "gbase",
  "goldendb",
  "oceanbase",
  "tidb",
  "opengauss",
  "gaussdb",
  "polardb",
  "tdsql",
  "vastbase",
  "sequoiadb",
  "matrixone",
  "apache-doris",
  "starrocks",
  "tdengine",
  "nebulagraph",
  "milvus",
  "nda",
  "tc260",
  "caict-database",
  "dtcc-expert-network",
] as const;

const LOCALIZATION_FIELDS = [
  ["title", "title"],
  ["factSummary", "fact_summary"],
  ["summary", "summary"],
  ["technicalInsight", "technical_insight"],
  ["industryInsight", "industry_insight"],
  ["futureOutlook", "future_outlook"],
  ["businessValue", "business_value"],
] as const;

/**
 * The public bilingual contract is shared by readiness, API output, and
 * snapshot restore. Supporting camelCase and database snake_case here keeps
 * those three gates consistent without coupling the domain layer to Kysely.
 */
export function isCompleteEventLocalization(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return LOCALIZATION_FIELDS.every(([camel, snake]) => {
    const field = row[camel] ?? row[snake];
    return (
      typeof field === "string" &&
      field.trim().length >= 12 &&
      !/待编辑|待补充|\bTBD\b|\bTODO\b|placeholder/i.test(field)
    );
  });
}
