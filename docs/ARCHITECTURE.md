# DB Pulse Architecture

DB Pulse keeps the original `Source → Signal → Event → Track/Actor → static publish` architecture while isolating the public China database dataset from legacy AI-industry provenance.

```text
Private control plane
  source lifecycle / raw evidence / jobs / review / audit / legacy provenance
                                   │
                                   ▼ allowlist + domain + readiness gates
Public static plane
  database-cn Events / bilingual timeline / tracks / actors / resources / Scout
```

`Event` remains the only fact node. Tracks, actors, roles, products, technologies, resources, and opportunities attach interpretation without copying the fact.

## Data flow

```text
Source registry (database-cn)
  → policy-aware fetcher
  → SourceAdapter
  → normalized Signal
  → dedupe + database product/version/workload clustering
  → bilingual Event + evidence + readiness
  → privacy-safe schema v2 export
  → GitHub Pages
```

The public dataset is `db-pulse-cn-v1`. The zero-configuration database is SQLite. MySQL compatibility is not claimed until a real integration suite exists.

## Module map

| Path | Responsibility |
| --- | --- |
| `src/collectors/` | Adapter contracts and network safety |
| `src/domain/` | Domain, clustering, scoring, and lifecycle rules |
| `src/db/` | Kysely schema, migrations, repository, and seed catalogs |
| `src/pipeline/` | Collection, convergence, readiness, snapshot, and export |
| `src/server/` | Public/admin API and security headers |
| `web/public/` | Static bilingual decision site |
| `web/admin/` | Private control room |
| `tests/` | Unit, contract, SQLite integration, workflow, and browser tests |

## Current boundaries

- China database events are the only public first-stage scope; overseas material may only corroborate a domestic Event.
- Source catalog presence and effective observation are reported separately.
- Historical heat stays `0` without measured propagation evidence.
- Probability forecasting, calibration, and Brier Score remain planned capabilities.
- Raw payloads, private fields, legacy AI Events, admin state, and database files never enter the static site.
