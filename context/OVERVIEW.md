# Overview

## What is OzzyRM

OzzyRM is a schema documentation toolkit for Prisma and Drizzle. It parses ORM schema files, normalizes them into a shared `DocSchema` format, and renders an interactive documentation UI comparable to Swagger UI or Scalar for OpenAPI.

The product goal is low-friction onboarding: install one package, define adapters in config, and render docs with minimal boilerplate.

## Target users

1. **Full-stack / frontend teams** using Next.js (App Router) who want in-app schema docs.
2. **Backend teams** with Prisma or Drizzle schemas who want a docs route alongside their API (future: Hono/Express middleware).
3. **Monorepo maintainers** documenting multiple schema versions or multiple schema files.

## Design principles

- **Single npm package:** Consumers run `npm i ozzyrm`, not multiple scoped packages.
- **Adapter-driven config:** `prisma()` and `drizzle()` helpers in `ozzyrm.config.ts` define what to parse.
- **Swagger-style layering:** Framework-agnostic `mount()` in UI core; thin React wrapper for Next.js.
- **Zero CSS setup:** Styles are bundled and injected on first mount.
- **No generated TypeScript catalogs:** Runtime `loadCatalog(config)` or CLI JSON output under `.ozzyrm/`.

## Positioning

| Comparable | OzzyRM equivalent |
|------------|-----------------|
| OpenAPI / Swagger UI | Interactive schema docs UI |
| Scalar docs | Sidebar navigation, model/enum detail, search |
| Prisma Studio | Read-only documentation, not data editing |

OzzyRM does not replace Prisma Client, migrations, or Drizzle Kit. It only documents the schema structure.

## Naming and branding

- Product: **OzzyRM**
- npm package: **`ozzyrm`**
- Config file: **`ozzyrm.config.ts`**
- Default output directory: **`.ozzyrm/`**
- CLI binary: **`ozzyrm`**

Legacy scoped packages (`@ozzyrm/core`, `@ozzyrm/ui`, `@ozzyrm/react`) were unpublished in favor of the unified `ozzyrm` package.
