import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("sources")
    .addColumn("source_category", "varchar(40)", (column) =>
      column.notNull().defaultTo("uncategorized"),
    )
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("acquisition", "varchar(20)", (column) => column.notNull().defaultTo("manual"))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("topics_json", "text", (column) => column.notNull().defaultTo("[]"))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("maintenance_status", "varchar(20)", (column) =>
      column.notNull().defaultTo("candidate"),
    )
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("cadence", "varchar(20)", (column) => column.notNull().defaultTo("24h"))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("license_note", "text", (column) => column.notNull().defaultTo(""))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("quality_score", "integer", (column) => column.notNull().defaultTo(50))
    .execute();
  await db.schema.alterTable("sources").addColumn("last_verified_at", "varchar(40)").execute();

  await db.schema
    .createTable("evaluation_runs")
    .addColumn("id", "varchar(36)", (column) => column.primaryKey())
    .addColumn("release_version", "varchar(30)", (column) => column.notNull())
    .addColumn("status", "varchar(20)", (column) => column.notNull())
    .addColumn("overall_score", "integer", (column) => column.notNull())
    .addColumn("dimensions_json", "text", (column) => column.notNull())
    .addColumn("capability_snapshot_json", "text", (column) => column.notNull())
    .addColumn("notes", "text", (column) => column.notNull())
    .addColumn("started_at", "varchar(40)", (column) => column.notNull())
    .addColumn("finished_at", "varchar(40)", (column) => column.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("evaluation_runs").ifExists().execute();
  for (const column of [
    "last_verified_at",
    "quality_score",
    "license_note",
    "cadence",
    "maintenance_status",
    "topics_json",
    "acquisition",
    "source_category",
  ]) {
    await db.schema.alterTable("sources").dropColumn(column).execute();
  }
}
