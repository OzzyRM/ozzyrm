# OzzyRM Agent Context

This folder contains structured context for AI agents working on the OzzyRM codebase. Read these documents before making architectural or product decisions.

## Documents

| File | Purpose |
|------|---------|
| [overview.md](./overview.md) | Product definition, goals, target users, positioning |
| [technical.md](./technical.md) | Architecture, modules, data flow, build pipeline |
| [infrastructure.md](./infrastructure.md) | Repository layout, npm package, dev workflow, gitignore policy |
| [features.md](./features.md) | Current shipped capabilities |
| [improvements.md](./improvements.md) | Known gaps, planned work, and design direction |

## Quick facts

- **Package name:** `ozzyrm` (single npm package)
- **Purpose:** Schema documentation UI for Prisma and Drizzle (Scalar/Swagger-style docs for ORM schemas)
- **Runtime:** Bun for development; published output is CommonJS + bundled CSS
- **Consumer install:** `bun add ozzyrm` or `npm i ozzyrm`

## Agent guidelines

1. Prefer minimal diffs; do not refactor unrelated code.
2. The repo root is **library source only**. Playgrounds (`web/`, `test/`, `scripts/`, `fixtures/`) are gitignored.
3. Adapters (`prisma()`, `drizzle()`) live in config; consumers should not hand-write catalog TypeScript files.
4. Framework adapters for Hono/Express are planned but not implemented yet.
5. Use Bun for local commands unless testing npm consumer flows.
