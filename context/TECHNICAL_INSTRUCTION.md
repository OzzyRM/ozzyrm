# Technical Architecture

## Package exports

Published entry points (`package.json` exports):

| Export | Role |
|--------|------|
| `ozzyrm` | Types, config helpers, parsers, `loadCatalog`, `generate`, `watchCatalog` |
| `ozzyrm/react` | Client component `<OzzyRMDocs />` |
| `ozzyrm/react/server` | Server helper `<OzzyRMDocsFromConfig />` and `loadCatalog` re-export |
| `ozzyrm/ui` | Framework-agnostic `mount()`, `SchemaDocs`, catalog utilities |
| `ozzyrm/styles.css` | Legacy static CSS (optional; auto-inject is preferred) |

CLI binary: `ozzyrm` maps to `dist/cli/bin.js`.

## Source layout (`src/`)

```
src/
  index.ts              Public API re-exports
  catalog/              loadCatalog, generate, watchCatalog
  cli/                  bin, serve (static file server)
  parsers/
    prisma/             PrismaParser, load-schema, mappers
    drizzle/            DrizzleParser, AST extraction, mappers
    adapters.ts         prisma(), drizzle() config helpers
  process/              postProcess, write-schema
  react/                OzzyRMDocs.tsx, server.ts
  ui/                   mount, components, styles, glossary
  utils/                adapter types, DocSchema types, Parser interface
```

## Data flow

```
ozzyrm.config.ts
  └── schemas: [ prisma({ include: [...] }), drizzle({ include: [...] }) ]
        │
        ▼
  loadCatalog(config)  OR  generate(config)  OR  CLI ozzyrm watch
        │
        ▼
  Parser (PrismaParser | DrizzleParser)
        │
        ▼
  DocSchema (normalized JSON)
        │
        ▼
  postProcess (referencedBy, metadata descriptions)
        │
        ▼
  SchemaCatalogGroup[]  →  mount() / OzzyRMDocs
```

### DocSchema

The internal canonical format lives in `src/utils/types/types.ts`. Key entities:

- `DocModel` with `DocField[]`, relations, indexes, `referencedBy`
- `DocEnum` with values
- ORM metadata: `orm`, `version`, `dataSource.provider`

Parsers map Prisma DMMF or Drizzle AST into this shape. UI components only consume `DocSchema`, never raw Prisma/Drizzle syntax.

## Parsers

### Prisma

- Uses `@prisma/internals` `getDMMF` on loaded datamodel
- Supports single file, explicit paths, and multi-file schema directories
- Exports: `PrismaParser`, `loadPrismaSchema`, `expandPrismaWatchPaths`
- Prisma 7: datasource `url` in schema files is not supported by parser validation; docs-only schemas should omit `url`

### Drizzle

- TypeScript AST parsing via custom extractors (`extract-tables`, `extract-enums`)
- Resolves multi-file graphs via import following
- Exports: `DrizzleParser`, `resolveDrizzleSchemaFiles`, `expandDrizzleWatchPaths`

## UI layer

### mount()

`src/ui/mount.tsx` is the single render entry (Swagger UI pattern):

1. Calls `ensureOzzyrmStyles()` to inject bundled CSS once
2. Creates React root on host element
3. Renders `SchemaDocs` with catalog options

### React wrapper

`OzzyRMDocs` is a thin client component that manages DOM host lifecycle and delegates to `mount()`. Safe for Next.js Fast Refresh (unmount/remount on prop changes).

### Server integration

`OzzyRMDocsFromConfig` (async server component helper):

```ts
const loaded = await loadCatalog(config, { cwd });
return createElement(OzzyRMDocs, { catalog: loaded.catalog, ... });
```

Alternative explicit pattern (preferred for clarity in consumer apps):

```ts
const { catalog, defaultSchemaId } = await loadCatalog(config);
return <OzzyRMDocs catalog={catalog} defaultSchemaId={defaultSchemaId} />;
```

## CSS build

Styles use Tailwind v4 at build time only:

1. `src/ui/styles.entry.css` — Tailwind source with `@source` over UI components
2. `build:css` — outputs `dist/ui/styles.bundled.css`
3. `scripts/inline-css.ts` — inlines CSS into `src/ui/styles-css.ts` as `OZZYRM_CSS`
4. `inject-styles.ts` — injects into `<head>` at runtime

Consumers do not need Tailwind or PostCSS in their app.

## Build output

- TypeScript compiles to **CommonJS** (`tsconfig.build.json`, `module: CommonJS`)
- Published `files`: `dist/`, `src/ui/styles.css`
- Run: `bun run build` (CSS + tsc)

## Catalog module

| Function | Description |
|----------|-------------|
| `loadCatalog(config, { cwd })` | Parse all adapters in memory; returns `{ catalog, defaultSchemaId }` |
| `generate(config, { cwd, configPath })` | Write per-schema JSON + `catalog.json` to `config.output` |
| `watchCatalog(options)` | File watch on config + schema paths; debounced regenerate |

CLI commands `generate` and `watch` call these directly.

## Config types

```ts
defineProject({ output?: string, schemas: OzzyRMSchemaSource[] })
prisma({ id, include, version?, file?, disabled?, metadata? })
drizzle({ id, include, version?, file?, disabled?, metadata? })
```

Each `OzzyRMSchemaSource` extends `OrmDocgenAdapter` with `id`, optional `label`, `file` (sidebar label), and `version` (semver display).
