import { type Kysely, sql } from "kysely";

/**
 * Follow-up migration for installations that already recorded 012 before the
 * DB Pulse source-asset and resource-version contract was completed.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("sources")
    .addColumn("owner", "varchar(160)", (column) => column.notNull().defaultTo("unassigned"))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("robots_policy", "varchar(80)", (column) =>
      column.notNull().defaultTo("review-required"),
    )
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("freshness_slo_hours", "integer", (column) => column.notNull().defaultTo(168))
    .execute();
  await db.schema
    .alterTable("sources")
    .addColumn("adapter_version", "varchar(40)", (column) => column.notNull().defaultTo("1.0.0"))
    .execute();
  await db.schema
    .alterTable("database_resources")
    .addColumn("version_note", "varchar(255)", (column) =>
      column.notNull().defaultTo("以官方发布说明为准"),
    )
    .execute();

  // Track, Actor, and View predate content domains. The subsequent DB Pulse
  // seed explicitly re-enables only the current catalog and default view.
  await sql`UPDATE tracks SET enabled = 0`.execute(db);
  await sql`UPDATE actors SET enabled = 0`.execute(db);
  await sql`UPDATE views SET is_default = 0`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("database_resources").dropColumn("version_note").execute();
  await db.schema.alterTable("sources").dropColumn("adapter_version").execute();
  await db.schema.alterTable("sources").dropColumn("freshness_slo_hours").execute();
  await db.schema.alterTable("sources").dropColumn("robots_policy").execute();
  await db.schema.alterTable("sources").dropColumn("owner").execute();
}
