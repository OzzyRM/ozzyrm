# OzzyRM Agent Context

This folder contains structured context for AI agents working on the OzzyRM codebase. Read these documents before making architectural or product decisions.

## Documents

| File | Purpose |
|------|---------|
| [OVERVIEW.md](./OVERVIEW.md) | Product definition, goals, target users, positioning |
| [TECHNICAL_INSTRUCTION.md](./TECHNICAL_INSTRUCTION.md) | Architecture, modules, data flow, build pipeline |
| [INFRASTRUCTURE_CHOICE.md](./INFRASTRUCTURE_CHOICE.md) | Repository layout, npm package, dev workflow, gitignore policy |
| [FEATURES.md](./FEATURES.md) | Current shipped capabilities |
| [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) | Known gaps, planned work, and design direction |

Security (threat model, guidelines, OSS limits, reporting): see [`../security/`](../security/README.md).

## Quick facts

- **Package name:** `ozzyrm` (single npm package, version 0.3.0)
- **Purpose:** Schema documentation UI for Prisma, Drizzle, and raw SQL (mixed stacks)
- **Runtime:** Bun for development; published output is CommonJS + bundled CSS
- **Consumer install:** `bun add ozzyrm` or `npm i ozzyrm`
- **Adapters:** `prisma()`, `drizzle()`, `sql()`; optional `unified` merge groups

## Agent guidelines

1. Prefer minimal diffs; do not refactor unrelated code.
2. The repo root is **library source only**. Playgrounds (`web/`, `test/`, `scripts/`, `fixtures/`) are gitignored.
3. Adapters (`prisma()`, `drizzle()`, `sql()`) live in config; consumers should not hand-write catalog TypeScript files.
4. Framework adapters for Hono/Express are planned but not implemented yet.
5. Use Bun for local commands unless testing npm consumer flows.
