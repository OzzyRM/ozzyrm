<p align="center">
  <img src="./assets/ozzyrm-logo.svg" alt="OzzyRM" width="96" height="96" />
</p>

<h1 align="center">OzzyRM</h1>

<p align="center">
  Interactive schema documentation for <strong>Prisma</strong>, <strong>Drizzle</strong>, and <strong>raw SQL</strong>.
  One npm package. Zero CSS setup.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ozzyrm"><img src="https://img.shields.io/npm/v/ozzyrm.svg?style=flat-square" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/ozzyrm"><img src="https://img.shields.io/npm/dm/ozzyrm.svg?style=flat-square" alt="npm downloads" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License MIT" /></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/runtime-Bun-fbf0df?style=flat-square&logo=bun" alt="Bun" /></a>
  <a href="./.github/workflows/ci.yml"><img src="https://img.shields.io/badge/CI-typecheck%20%7C%20build%20%7C%20security-informational?style=flat-square" alt="CI" /></a>
  <a href="./SECURITY.md"><img src="https://img.shields.io/badge/security-policy-green?style=flat-square" alt="Security policy" /></a>
</p>

<p align="center">
  <a href="#install">Install</a>
  ·
  <a href="#quick-start">Quick start</a>
  ·
  <a href="#config-adapters">Config</a>
  ·
  <a href="#unified-schema-graph">Unified graph</a>
  ·
  <a href="#nextjs-app-router">Next.js</a>
  ·
  <a href="#watch--hmr">Watch</a>
  ·
  <a href="#develop">Develop</a>
  ·
  <a href="#contributing">Contributing</a>
  ·
  <a href="#security">Security</a>
  ·
  <a href="#license">License</a>
</p>

---

## Why OzzyRM

Teams often mix ORMs with hand-written SQL. OzzyRM reads those sources, normalizes them into one catalog, and renders searchable docs (models, fields, enums, ERD, scenarios) inside your React app.

## Install

```bash
bun add ozzyrm
# or
npm i ozzyrm
```

Styles inject automatically. No separate CSS import is required for the default UI.

Glossary type and attribute badges open documentation on [ozzyrm.vercel.app](https://ozzyrm.vercel.app) in a new tab (`/docs/glossary/...`).

## Quick start

1. Add `ozzyrm.config.ts` (see below)
2. Mount docs with `OzzyRMDocsFromConfig` in a React Server Component route
3. Optionally run `ozzyrm watch` next to your app for schema file hot reload

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

## Unified schema graph

Opt in with `unified` to merge selected sources into one validated graph. Member sources leave the sidebar and appear as a single unified entry. The overview lists what was merged (`id` + orm).

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

- **Explicit only**: sources not listed in any `unified` group stay standalone
- **Strict conflicts**: duplicate model, table, or enum identities always fail (no silent merge)
- **Cross-source relations**: a SQL FK to `users` can resolve to Prisma `User @@map("users")` when that identity has a single owner
- **Fail closed**: `loadCatalog()` / `generate` reject with aggregated diagnostics (including invalid `scenarios` config); `watch` logs them and keeps the previous valid JSON
- **Error overlay**: `ConfigErrorOverlay` / `OzzyRMDocsFromConfig` show a Next.js-style popup with a copyable message when validation fails

Example conflict (two sources both own `users`):

```ts
unified: [{ id: "broken", sources: ["app-prisma", "legacy-sql"] }]
// fails with DUP_MODEL / DUP_TABLE_NAME / REL_* codes in one error
```

## React (App Router)

```tsx
import config from "../ozzyrm.config";
import { OzzyRMDocsFromConfig } from "ozzyrm/react/server";

export const dynamic = "force-dynamic"; // pick up schema edits on refresh

export default async function Page() {
  return <OzzyRMDocsFromConfig config={config} />;
}
```

Works in React-based apps that can render the server helper. Next.js App Router is the primary documented path.

## Watch / HMR

Editing `.prisma` / `.sql` is outside Next's module graph, so browser HMR is not automatic unless you opt in:

| Mode | Setup | Behavior |
|------|--------|----------|
| Refresh | `loadCatalog(config)` + `dynamic = "force-dynamic"` | F5 reloads catalog |
| Config edits | import `ozzyrm.config.ts` | Next HMR when config changes |
| Schema file HMR | `watch: { hot: true }` + run `ozzyrm watch` beside `next dev` | watch writes `.ozzyrm/stamp.js`, bundler invalidates, docs re-render |

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
bun run typecheck
bun run build
# full public CI gate:
bun run ci
```

| Script | Purpose |
|--------|---------|
| `bun run check:security` | Forbid XSS / eval sinks in `src/` |
| `bun run typecheck` | `tsc` with no emit |
| `bun run build` | CSS bundle + library compile |
| `bun run ci` | security + typecheck + build |

Local playground and fixtures under `/test` and `/fixtures` are maintainer-only and gitignored.

## Contributing

OzzyRM is open source. Please read:

- [CONTRIBUTING.md](./CONTRIBUTING.md): setup, hooks, PR expectations
- [OPEN_SOURCE.md](./OPEN_SOURCE.md): readiness and quality-gate checklist
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [CHANGELOG.md](./CHANGELOG.md)

Husky runs `check:security` on pre-commit and `typecheck` on pre-push (plus local tests when `/test` exists).

## Security

This package is a **local / trusted-host** docs toolkit. Config import is high trust.

- Policy: [SECURITY.md](./SECURITY.md)
- Engineering docs: [`security/`](./security/)
- Report vulnerabilities privately (do not file public exploit issues)

## License

[MIT](./LICENSE)
