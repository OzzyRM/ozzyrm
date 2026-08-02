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
- **Fail closed** — `loadCatalog()` / `generate` reject with aggregated diagnostics (including invalid `scenarios` config); `watch` logs them and keeps the previous valid JSON
- **Error overlay** — `ConfigErrorOverlay` / `OzzyRMDocsFromConfig` show a Next.js-style popup with a copyable message when validation fails

Example conflict (two sources both own `users`):

```ts
unified: [{ id: "broken", sources: ["app-prisma", "legacy-sql"] }]
// fails with DUP_MODEL / DUP_TABLE_NAME / REL_* codes in one error
```

## Next.js (App Router)

```tsx
import config from "../ozzyrm.config";
import { OzzyRMDocsFromConfig } from "ozzyrm/react/server";

export const dynamic = "force-dynamic"; // pick up schema edits on refresh

export default async function Page() {
  return <OzzyRMDocsFromConfig config={config} />;
}
```

### Watch / HMR after publish (not automatic alone)

Editing `.prisma` / `.sql` is **outside** Next’s module graph, so browser HMR is **not** automatic unless you opt in:

| Mode | Setup | Behavior |
|------|--------|----------|
| Refresh | `loadCatalog(config)` + `dynamic = "force-dynamic"` | F5 reloads catalog |
| Config edits | import `ozzyrm.config.ts` | Next HMR when config changes |
| Schema file HMR | `watch: { hot: true }` + run `ozzyrm watch` beside `next dev` | watch writes `.ozzyrm/stamp.js` → bundler invalidates → docs re-render |

```ts
export default defineProject({
  schemas: [/* ... */],
  watch: {
    enabled: true,     // ozzyrm watch respects this (default true)
    debounceMs: 200,
    hot: true,         // stamp.js bridge for Next
  },
});
```

```bash
npx ozzyrm watch   # terminal 1
next dev           # terminal 2
```

`watch: false` disables the CLI watcher. Production `loadCatalog` ignores watch options.

## Develop

```bash
bun install
bun test
bun run build
```
