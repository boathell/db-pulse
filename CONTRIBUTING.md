# Contributing

Thanks for helping make China database industry intelligence more useful, verifiable, and less noisy.

## Before opening a PR

1. Read `AGENTS.md` and the applicable package under `docs/specs/`.
2. Use docs-first changes for schema, source lifecycle, ranking, publishing, or cross-layer behavior.
3. Keep collectors behind the `SourceAdapter` contract; new sources start in `draft` or `shadow`.
4. Do not bypass login, WAF, CAPTCHA, paywalls, robots, or license boundaries.
5. Never commit tokens, cookies, databases, raw payloads, local paths, or personal data.

## Development

```bash
npm ci
npm run db:migrate
npm run db:seed
npm run check
npm run build
```

Every user-visible change must update both `CHANGELOG.md` and `src/catalog/product.ts`. Code, identifiers, comments, and commits use English by default; product documentation and interface copy use Chinese by default.
