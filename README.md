# OzzyRM

Schema documentation toolkit for Prisma & Drizzle.

## Install

```bash
bun add @ozzyrm/core @ozzyrm/react @ozzyrm/ui
# or: npm i / pnpm add
```

Parsers are **bundled in `@ozzyrm/core`** — no separate prisma/drizzle packages needed.

## Config

```ts
// ozzyrm.config.ts
import { defineProject, prisma, drizzle } from "@ozzyrm/core";

export default defineProject({
  output: "./.ozzyrm",
  schemas: [
    prisma({
      id: "app-1-0-0",
      include: ["./prisma"],
      version: "1.0.0",
    }),
    drizzle({
      id: "db-1-0-0",
      include: ["./src/db/schema.ts"],
    }),
  ],
});
```

## Packages

| Package | Folder | Description |
|---|---|---|
| `@ozzyrm/core` | `core/` | Types, config, **Prisma + Drizzle parsers** |
| `@ozzyrm/ui` | `ui/` | Docs UI core (`mount()`) |
| `@ozzyrm/react` | `react/` | React wrapper `<OzzyRMDocs />` |
| `@ozzyrm/cli` | `cli/` | CLI (`ozzyrm serve`) |
| `@ozzyrm/parser-prisma` | `prisma/` | Deprecated re-export of core |
| `@ozzyrm/parser-drizzle` | `drizzle/` | Deprecated re-export of core |

## Develop

```bash
bun install
bun run build
```

Local playground (`web/`), generate scripts (`scripts/`), and `ozzyrm.config.ts` are gitignored — keep them on your machine for internal testing.
