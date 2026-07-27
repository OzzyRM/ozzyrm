# Overview

## What is OzzyRM

OzzyRM is a schema documentation toolkit for Prisma, Drizzle, and raw SQL DDL. It parses schema sources, normalizes them into a shared `DocSchema` format, and renders an interactive documentation UI comparable to Swagger UI or Scalar for OpenAPI.

The product goal is low-friction onboarding for teams that use one ORM, multiple ORMs, or a mix of ORMs and hand-written SQL — a common pattern in larger companies where legacy SQL, migrations, and modern ORMs coexist.

## Target users

1. **Full-stack / frontend teams** using Next.js (App Router) who want in-app schema docs.
2. **Backend teams** with Prisma, Drizzle, and/or raw `.sql` schemas who want a docs route alongside their API (future: Hono/Express middleware).
3. **Monorepo maintainers** documenting multiple schema versions, multiple ORMs, or SQL dumps next to application schemas.
4. **Platform / data teams** that need a single readable map when giants combine ORMs and raw SQL across services.

## Design principles

- **Single npm package:** Consumers run `npm i ozzyrm`, not multiple scoped packages.
- **Adapter-driven config:** `prisma()`, `drizzle()`, and `sql()` helpers in `ozzyrm.config.ts` define what to parse; optional `unified` merges selected sources into one strict graph.
- **Swagger-style layering:** Framework-agnostic `mount()` in UI core; thin React wrapper for Next.js.
- **Zero CSS setup:** Styles are bundled and injected on first mount.
- **No generated TypeScript catalogs:** Runtime `loadCatalog(config)` or CLI JSON output under `.ozzyrm/`.
- **Source-agnostic docs:** ORM and SQL both map to the same `DocSchema` so mixed stacks share one UI.

## Positioning

| Comparable | OzzyRM equivalent |
|------------|-----------------|
| OpenAPI / Swagger UI | Interactive schema docs UI |
| Scalar docs | Sidebar navigation, model/enum detail, search |
| Prisma Studio | Read-only documentation, not data editing |
| SQL dump / migration folders | Parsed into the same structured docs as ORM schemas |

OzzyRM does not replace Prisma Client, migrations, Drizzle Kit, or database engines. It documents schema structure from ORM definitions and/or raw SQL DDL.

## Naming and branding

- Product: **OzzyRM**
- npm package: **`ozzyrm`**
- Config file: **`ozzyrm.config.ts`**
- Default output directory: **`.ozzyrm/`**
- CLI binary: **`ozzyrm`**

Legacy scoped packages (`@ozzyrm/core`, `@ozzyrm/ui`, `@ozzyrm/react`) were unpublished in favor of the unified `ozzyrm` package.
