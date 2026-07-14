# DB Pulse

> DB Pulse is an evidence-backed industry intelligence and decision system for China's database market, built for CEOs, DBAs, data architects, and database practitioners.

[中文说明](README-zh-cn.md) · [Live site](https://boathell.github.io/db-pulse/) · [Changelog](CHANGELOG.md) · [Source policy](docs/SOURCES.md)

## What it does

DB Pulse turns official releases, product documentation, research, capital moves, policy changes, and community signals into traceable Events. Every public Event answers what happened, why it matters, who it affects, what to watch, and what action is worth testing.

The public product preserves the existing static multi-page experience:

- latest database-industry shifts and long-running narratives;
- Event stories with direct evidence links;
- product ecosystems, institutions, and communities;
- evidence-backed database selection and cost information;
- source coverage, lifecycle, and health;
- Scout hypotheses tied to published Events.

## Initial China coverage

The 0.1.0 baseline covers Dameng, Kingbase, GBase, GoldenDB, OceanBase, TiDB, openGauss, GaussDB, PolarDB, TDSQL, Vastbase, SequoiaDB, MatrixOne, Apache Doris, StarRocks, TDengine, NebulaGraph, and Milvus.

Overseas database products may appear only as comparison evidence for a China-focused Event. They are not independent public tracks in this phase.

## Evidence boundary

- An Event is the only public fact node; Signals remain evidence and discovery material.
- A material fact needs one Tier 1 primary source or two independent Tier 2 sources.
- Unmeasured historical attention is recorded as heat `0`.
- Catalog inclusion is not the same as effective observation.
- Facts, analysis, forecasts, and opportunity hypotheses remain explicitly separated.
- Public exports use allowlist DTOs and never include raw payloads, credentials, local paths, or the database.

## Architecture

```text
Source registry -> SourceAdapter -> Signal -> dedupe / clustering
                -> Event evidence gates -> Track / Actor / Scout
                -> privacy-safe static export -> GitHub Pages
```

The stack is TypeScript, Node.js, Fastify, Kysely, and SQLite. SQLite is the zero-configuration and verified database path; MySQL compatibility is not claimed until a real integration run passes.

## Local development

Requirements: Node.js 22+ and npm.

```bash
git clone https://github.com/boathell/db-pulse.git
cd db-pulse
npm ci
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Quality gates:

```bash
npm run check
npm run build
```

The legacy default SQLite filename remains `var/agent-pulse.db` during the domain migration so existing provenance can be migrated and retained. It is never exported.

## Release status

The product and package version are reset to `0.1.0`. Until an explicit release is performed, the website Changelog labels it as in development and the repository records all changes under `[Unreleased]`.

## License and responsible use

The [MIT License](LICENSE) applies to source code and original repository documentation. Third-party release notes, articles, papers, trademarks, and feeds retain their owners' rights. DB Pulse provides research and decision support, not procurement, investment, legal, or financial advice. See [Copyright, Sources, and Responsible Use](docs/LEGAL.md) and [Third-Party Notices](THIRD_PARTY_NOTICES.md).
