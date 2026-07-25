# DB Pulse Source Catalog and Evidence Policy

The current DB Pulse catalog contains 26 retained China database sources:

- 16 official product, documentation, and release entrances across 8 retained core ecosystems;
- 3 policy and standards sources;
- 2 research, benchmark, or original-artifact sources;
- 3 professional-media or database-community discovery sources.
- 1 Tier 1 official WeChat identity retained as a restricted, non-collecting social source.
- 1 verified founder/expert WeChat identity retained as a Tier 3 restricted, non-collecting social source.

Sources outside the current focus are soft-retired: their rows and historical provenance remain in
the private database and snapshots, but they are excluded from the current observation catalog,
collection plan, and public source export.

All new automated sources start disabled in `draft` or `shadow`. Promotion to `active` requires an adapter contract, fixture, schema-drift test, access/license review, health probe, and a real observation window.

Platform-restricted sources remain disabled in `shadow` and are never scraped around login, WAF, CAPTCHA, or platform controls. Their catalog presence records identity and provenance only until a platform-approved API or feed is available.

Multiple entrances from the same company ecosystem share an evidence owner. The GreptimeDB official account and founder Zhuang Xiaodan's personal account are separate catalog entries but do not count as independent corroboration.

## Evidence rules

- Tier 1: official releases, documentation, filings, policy, standards, or original research.
- Tier 2: independent professional verification or reproducible evaluation.
- Tier 3/4: expert, media, community, or propagation signals used for discovery and context.
- Aggregators cannot be the sole evidence for a material fact.
- A public fact requires one Tier 1 source or two independent Tier 2 sources; exceptions remain visibly unconfirmed.

The initial scope is domestic. Overseas database material may be attached as comparison evidence only when it helps explain a China database Event.

## Public boundary

The static export includes allowlisted metadata, canonical URLs, evidence status, and health summaries. It excludes raw payloads, credentials, private notes, local paths, database files, and legacy `ai-industry` records.
