# OzzyRM

Schema documentation toolkit for Prisma & Drizzle.

## Packages

| Package | Description |
|---|---|
| `@ozzyrm/core` | Schema types + `defineConfig` / `defineProject` |
| `@ozzyrm/parser-prisma` | Prisma parser (multi-file supported) |
| `@ozzyrm/parser-drizzle` | Drizzle parser (import graph) |
| `@ozzyrm/ui` | Docs UI core (`mount()`) |
| `@ozzyrm/react` | React wrapper `<OzzyRMDocs />` |
| `@ozzyrm/cli` | CLI (`ozzyrm serve`) |
| `@ozzyrm/web` | Internal playground (Next.js) |

## Develop

```bash
bun install
bun run generate
bun run dev
```

Config file: `ozzyrm.config.ts`
