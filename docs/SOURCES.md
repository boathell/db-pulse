# DB Pulse Source Catalog and Evidence Policy

The first DB Pulse catalog contains 48 China database sources:

- 36 official product, documentation, and release entrances across 18 core ecosystems;
- 4 policy and standards sources;
- 4 research, benchmark, or original-artifact sources;
- 4 capital, professional-media, or database-community discovery sources.

All new automated sources start disabled in `draft` or `shadow`. Promotion to `active` requires an adapter contract, fixture, schema-drift test, access/license review, health probe, and a real observation window.

## Evidence rules

- Tier 1: official releases, documentation, filings, policy, standards, or original research.
- Tier 2: independent professional verification or reproducible evaluation.
- Tier 3/4: expert, media, community, or propagation signals used for discovery and context.
- Aggregators cannot be the sole evidence for a material fact.
- A public fact requires one Tier 1 source or two independent Tier 2 sources; exceptions remain visibly unconfirmed.

The initial scope is domestic. Overseas database material may be attached as comparison evidence only when it helps explain a China database Event.

## Public boundary

The static export includes allowlisted metadata, canonical URLs, evidence status, and health summaries. It excludes raw payloads, credentials, private notes, local paths, database files, and legacy `ai-industry` records.
