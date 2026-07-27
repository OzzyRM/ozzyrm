# OzzyRM

Schema documentation toolkit library.

## Install

```bash
bun add ozzyrm
# or: npm i ozzyrm
```

Styles inject automatically — no CSS setup required.

## Config (adapters)

```ts
// ozzyrm.config.ts
import { defineProject, prisma, drizzle, sql } from "ozzyrm";

export default defineProject({
  output: "./.ozzyrm",
  schemas: [
    prisma({
      id: "app-prisma",
      include: ["./prisma"],
      version: "1.0.0",
    }),
    drizzle({
      id: "app-drizzle",
      include: ["./src/db/schema.ts"],
    }),
    sql({
      id: "legacy-sql",
      include: ["./db/schema.sql"],
      // or a folder of .sql files:
      // include: ["./migrations"],
    }),
  ],
});
```

Companies often mix ORMs with hand-written SQL. OzzyRM normalizes all of them into one docs UI.

## Unified schema graph

Opt in with `unified` to merge selected sources into one validated graph. Member sources are removed from the sidebar and replaced by the unified entry. The overview lists exactly what was merged (`id` + orm).

```ts
import { defineProject, prisma, sql } from "ozzyrm";

export default defineProject({
  schemas: [
    prisma({ id: "app-prisma", include: ["./prisma/schema.prisma"] }),
    sql({ id: "legacy-sql", include: ["./db/legacy.sql"] }),
  ],
  unified: [
    {
      id: "company-schema",
      sources: ["app-prisma", "legacy-sql"],
      file: "company",
      version: "1.0.0",
    },
  ],
});
```

Rules:

- **Explicit only** — sources not listed in any `unified` group stay standalone
- **Strict conflicts** — duplicate model/table/enum identities always fail (no silent merge)
- **Cross-source relations** — a SQL FK to `users` can resolve to Prisma `User @@map("users")` when that identity has a single owner
- **Fail closed** — `loadCatalog()` / `generate` reject with aggregated diagnostics; `watch` logs them and keeps the previous valid JSON

Example conflict (two sources both own `users`):

```ts
unified: [{ id: "broken", sources: ["app-prisma", "legacy-sql"] }]
// fails with DUP_MODEL / DUP_TABLE_NAME / REL_* codes in one error
```

## Next.js (App Router)

```tsx
import { loadCatalog } from "ozzyrm";
import { OzzyRMDocs } from "ozzyrm/react";
import config from "../ozzyrm.config";

export default async function Page() {
  const { catalog, defaultSchemaId } = await loadCatalog(config);
  return <OzzyRMDocs catalog={catalog} defaultSchemaId={defaultSchemaId} />;
}
```

Or:

```tsx
import config from "../ozzyrm.config";
import { OzzyRMDocsFromConfig } from "ozzyrm/react/server";

export default async function Page() {
  return <OzzyRMDocsFromConfig config={config} />;
}
```

## CLI

```bash
npx ozzyrm generate   # write ./.ozzyrm/*.json
npx ozzyrm watch      # regenerate on schema change
```

## Develop

```bash
bun install
bun test
bun run build
```
