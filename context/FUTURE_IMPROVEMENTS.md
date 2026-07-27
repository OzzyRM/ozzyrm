# Improvements and Roadmap

This document tracks known gaps, planned work, and design direction. Agents should align new work with these priorities unless the user specifies otherwise.

## High priority

### Framework middleware adapters

Not implemented yet (explicitly deferred):

- `ozzyrm/hono` — mount docs route on Hono apps
- `ozzyrm/express` — mount docs route on Express apps

Goal: backend teams serve `/docs` from the same process that owns the Prisma/Drizzle schema, without requiring Next.js.

### Documentation site

Public docs (install guide, adapter reference, unified graphs, Next.js recipe, CLI reference) are only in root `README.md` and this `context/` folder. Consider a dedicated docs site or expanded README sections.

## Medium priority

### CLI `generate` as primary DX

Consumers should rarely write custom generate scripts. All flows should go through:

```bash
ozzyrm generate
ozzyrm watch
```

The gitignored `scripts/` folder in the monorepo is for internal dev only; do not require similar scripts in consumer apps.

### HMR story for Next.js

Current watch regenerates `.ozzyrm/*.json` but Next.js HMR for in-memory `loadCatalog` requires either:

- Re-import on file change (custom dev script), or
- Reading `.ozzyrm/catalog.json` with a file watcher in dev

Clarify and document the recommended dev loop for schema edits.

### Test coverage

Unified merge has Bun unit/integration tests (`src/catalog/merge-unified.test.ts`). Still missing:

- Unit tests for Prisma single/multi-file parsing
- Unit tests for Drizzle single/multi-file parsing
- Snapshot tests for `DocSchema` output
- CI wiring for `bun test`

### Dependency hygiene

- Move `typescript` from `dependencies` to `devDependencies` if possible without breaking consumers
- Evaluate bundle size impact of `@prisma/internals` in browser bundles (mitigated by server-only usage)

## Lower priority

### Additional ORMs and SQL dialects

Supported sources today: Prisma, Drizzle, and raw SQL DDL (PostgreSQL-oriented with MySQL/SQLite-friendly constructs).

Future extensions:

- Broader SQL dialect coverage (SQL Server, richer MySQL ALTER forms)
- TypeORM, Sequelize, or Kysely parser modules and adapter helpers
- Optional introspection from a live database connection (out of scope for file-based docs today)

### Theming

CSS uses fixed design tokens in bundled Tailwind theme. Future: CSS variables override API or dark mode.

### Static export / standalone HTML

`ozzyrm serve` only serves prebuilt static files. A full static export pipeline (single HTML bundle like Swagger UI dist) is not implemented.

### Deprecated paths

- `ozzyrm/styles.css` export remains for backward compatibility; auto-inject is the recommended path
- Root `scripts/lib/schema.ts` duplicates catalog logic for gitignored `web/` playground; prefer `src/catalog/` as single source of truth

## Anti-patterns to avoid

When implementing improvements, do not reintroduce:

1. Multiple npm packages (`@ozzyrm/core`, `@ozzyrm/ui`, etc.)
2. Hand-generated `catalog.ts` TypeScript files with embedded JSON strings
3. Required consumer Tailwind/PostCSS setup for basic docs rendering
4. Committing `web/`, `test/`, `fixtures/`, or `ozzyrm.config.ts` to the library repo
5. Prisma `url` in schema files when targeting Prisma 7 parser compatibility for docs-only use

## Suggested implementation order

1. Publish `0.3.x` with SQL adapter + unified schema graphs
2. Hono middleware adapter (smallest surface, popular in Bun ecosystem)
3. Express middleware adapter
4. CI + broader parser tests using `fixtures/` (including `fixtures/sql`, `fixtures/unified`)
5. Dev HMR documentation and optional `ozzyrm dev` command (watch + hint for Next reload)

## Agent notes on scope

- Minimize diff size; match existing code style (minimal comments, English, modular but not over-engineered)
- Use Bun for scripts in this repository
- Do not commit unless explicitly asked
- Do not paste npm tokens or secrets in chat or code
