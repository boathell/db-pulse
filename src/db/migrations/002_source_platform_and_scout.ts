import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("sources")
    .addColumn("lifecycle_status", "varchar(20)", (column) => column.notNull().defaultTo("draft"))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("health_score", "integer", (column) => column.notNull().defaultTo(100))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("consecutive_failures", "integer", (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("success_count", "integer", (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("failure_count", "integer", (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("priority", "integer", (column) => column.notNull().defaultTo(50))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("timeout_ms", "integer", (column) => column.notNull().defaultTo(30000))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("max_retries", "integer", (column) => column.notNull().defaultTo(2))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("base_backoff_ms", "integer", (column) => column.notNull().defaultTo(500))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("rate_limit_per_minute", "integer", (column) => column.notNull().defaultTo(30))
    .execute();
  await db.schema.alterTable("sources").addColumn("next_run_at", "varchar(40)").execute();
  await db.schema.alterTable("sources").addColumn("retired_at", "varchar(40)").execute();
  await db
    .updateTable("sources" as never)
    .set({ lifecycle_status: "active" } as never)
    .where("enabled" as never, "=", 1 as never)
    .execute();
  await db
    .updateTable("sources" as never)
    .set({ lifecycle_status: "shadow" } as never)
    .where("enabled" as never, "=", 0 as never)
    .execute();

  await db.schema
    .createTable("source_runs")
    .addColumn("id", "varchar(36)", (column) => column.primaryKey())
    .addColumn("source_id", "varchar(36)", (column) =>
      column.notNull().references("sources.id").onDelete("cascade"),
    )
    .addColumn("job_id", "varchar(36)", (column) =>
      column.notNull().references("jobs.id").onDelete("cascade"),
    )
    .addColumn("status", "varchar(20)", (column) => column.notNull())
    .addColumn("attempt_count", "integer", (column) => column.notNull())
    .addColumn("duration_ms", "integer", (column) => column.notNull())
    .addColumn("collected_count", "integer", (column) => column.notNull())
    .addColumn("created_count", "integer", (column) => column.notNull())
    .addColumn("skipped_count", "integer", (column) => column.notNull())
    .addColumn("http_status", "integer")
    .addColumn("response_bytes", "integer", (column) => column.notNull())
    .addColumn("error_type", "varchar(30)")
    .addColumn("error_code", "varchar(100)")
    .addColumn("error_summary", "text")
    .addColumn("started_at", "varchar(40)", (column) => column.notNull())
    .addColumn("finished_at", "varchar(40)")
    .execute();
  await db.schema
    .createIndex("source_runs_source_started_idx")
    .on("source_runs")
    .columns(["source_id", "started_at"])
    .execute();

  await db.schema
    .createTable("scout_insights")
    .addColumn("id", "varchar(36)", (column) => column.primaryKey())
    .addColumn("slug", "varchar(255)", (column) => column.notNull().unique())
    .addColumn("kind", "varchar(30)", (column) => column.notNull())
    .addColumn("status", "varchar(20)", (column) => column.notNull())
    .addColumn("title", "text", (column) => column.notNull())
    .addColumn("observation", "text", (column) => column.notNull())
    .addColumn("hypothesis", "text", (column) => column.notNull())
    .addColumn("why_now", "text", (column) => column.notNull())
    .addColumn("target_audience", "text", (column) => column.notNull())
    .addColumn("suggested_action", "text", (column) => column.notNull())
    .addColumn("artifact_idea", "text", (column) => column.notNull())
    .addColumn("counter_signals", "text", (column) => column.notNull())
    .addColumn("horizon", "varchar(30)", (column) => column.notNull())
    .addColumn("confidence_score", "integer", (column) => column.notNull())
    .addColumn("evidence_score", "integer", (column) => column.notNull())
    .addColumn("novelty_score", "integer", (column) => column.notNull())
    .addColumn("leverage_score", "integer", (column) => column.notNull())
    .addColumn("total_score", "integer", (column) => column.notNull())
    .addColumn("cooldown_key", "varchar(255)", (column) => column.notNull())
    .addColumn("generated_at", "varchar(40)", (column) => column.notNull())
    .addColumn("expires_at", "varchar(40)")
    .addColumn("published_at", "varchar(40)")
    .addColumn("created_at", "varchar(40)", (column) => column.notNull())
    .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
    .execute();
  await db.schema
    .createIndex("scout_insights_status_score_idx")
    .on("scout_insights")
    .columns(["status", "total_score"])
    .execute();
  await db.schema
    .createTable("scout_evidence")
    .addColumn("insight_id", "varchar(36)", (column) =>
      column.notNull().references("scout_insights.id").onDelete("cascade"),
    )
    .addColumn("event_id", "varchar(36)", (column) =>
      column.notNull().references("events.id").onDelete("cascade"),
    )
    .addColumn("evidence_role", "varchar(30)", (column) => column.notNull())
    .addColumn("weight", "integer", (column) => column.notNull())
    .addColumn("created_at", "varchar(40)", (column) => column.notNull())
    .addPrimaryKeyConstraint("scout_evidence_pk", ["insight_id", "event_id"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("scout_evidence").ifExists().execute();
  await db.schema.dropTable("scout_insights").ifExists().execute();
  await db.schema.dropTable("source_runs").ifExists().execute();
  for (const column of [
    "retired_at",
    "next_run_at",
    "rate_limit_per_minute",
    "base_backoff_ms",
    "max_retries",
    "timeout_ms",
    "priority",
    "failure_count",
    "success_count",
    "consecutive_failures",
    "health_score",
    "lifecycle_status",
  ]) {
    await db.schema.alterTable("sources").dropColumn(column).execute();
  }
}
