import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("sources")
    .addColumn("content_domain", "varchar(40)", (column) =>
      column.notNull().defaultTo("ai-industry"),
    )
    .execute();
  await db.schema
    .alterTable("events")
    .addColumn("content_domain", "varchar(40)", (column) =>
      column.notNull().defaultTo("ai-industry"),
    )
    .execute();
  await db.schema
    .alterTable("scout_insights")
    .addColumn("content_domain", "varchar(40)", (column) =>
      column.notNull().defaultTo("ai-industry"),
    )
    .execute();

  await db.schema
    .createIndex("sources_domain_lifecycle_idx")
    .on("sources")
    .columns(["content_domain", "lifecycle_status"])
    .execute();
  await db.schema
    .createIndex("events_domain_status_happened_idx")
    .on("events")
    .columns(["content_domain", "status", "happened_at"])
    .execute();

  await db.schema
    .createTable("event_localizations")
    .addColumn("event_id", "varchar(36)", (column) =>
      column.notNull().references("events.id").onDelete("cascade"),
    )
    .addColumn("locale", "varchar(20)", (column) => column.notNull())
    .addColumn("title", "text", (column) => column.notNull())
    .addColumn("fact_summary", "text", (column) => column.notNull())
    .addColumn("summary", "text", (column) => column.notNull())
    .addColumn("technical_insight", "text", (column) => column.notNull())
    .addColumn("industry_insight", "text", (column) => column.notNull())
    .addColumn("future_outlook", "text", (column) => column.notNull())
    .addColumn("business_value", "text", (column) => column.notNull())
    .addColumn("created_at", "varchar(40)", (column) => column.notNull())
    .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
    .addPrimaryKeyConstraint("event_localizations_pk", ["event_id", "locale"])
    .execute();

  await db.schema
    .createTable("database_resources")
    .addColumn("id", "varchar(36)", (column) => column.primaryKey())
    .addColumn("slug", "varchar(150)", (column) => column.notNull().unique())
    .addColumn("provider", "varchar(120)", (column) => column.notNull())
    .addColumn("product", "varchar(150)", (column) => column.notNull())
    .addColumn("engine_type", "varchar(80)", (column) => column.notNull())
    .addColumn("editions_json", "text", (column) => column.notNull())
    .addColumn("deployment_modes_json", "text", (column) => column.notNull())
    .addColumn("license_models_json", "text", (column) => column.notNull())
    .addColumn("compatibility_json", "text", (column) => column.notNull())
    .addColumn("pricing_model", "varchar(120)", (column) => column.notNull())
    .addColumn("pricing_note", "text", (column) => column.notNull())
    .addColumn("region", "varchar(20)", (column) => column.notNull())
    .addColumn("purchase_url", "varchar(1000)", (column) => column.notNull())
    .addColumn("documentation_url", "varchar(1000)", (column) => column.notNull())
    .addColumn("evidence_url", "varchar(1000)", (column) => column.notNull())
    .addColumn("evidence_status", "varchar(30)", (column) => column.notNull())
    .addColumn("verified_at", "varchar(40)", (column) => column.notNull())
    .addColumn("enabled", "integer", (column) => column.notNull())
    .addColumn("created_at", "varchar(40)", (column) => column.notNull())
    .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("database_resources").ifExists().execute();
  await db.schema.dropTable("event_localizations").ifExists().execute();
  await db.schema.dropIndex("events_domain_status_happened_idx").ifExists().execute();
  await db.schema.dropIndex("sources_domain_lifecycle_idx").ifExists().execute();
  await db.schema.alterTable("scout_insights").dropColumn("content_domain").execute();
  await db.schema.alterTable("events").dropColumn("content_domain").execute();
  await db.schema.alterTable("sources").dropColumn("content_domain").execute();
}
