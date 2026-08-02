# Technical Architecture

## Package exports

Published entry points (`package.json` exports):

| Export | Role |
|--------|------|
| `ozzyrm` | Types, config helpers, parsers (Prisma/Drizzle/SQL), `loadCatalog`, `generate`, `watchCatalog` |
| `ozzyrm/react` | Client component `<OzzyRMDocs />` |
| `ozzyrm/react/server` | Server helper `<OzzyRMDocsFromConfig />` and `loadCatalog` re-export |
| `ozzyrm/ui` | Framework-agnostic `mount()`, `SchemaDocs`, catalog utilities |
| `ozzyrm/styles.css` | Legacy static CSS (optional; auto-inject is preferred) |

CLI binary: `ozzyrm` maps to `dist/cli/bin.js`.

## Source layout (`src/`)

```
src/
  index.ts              Public API re-exports
  catalog/              loadCatalog, generate, watchCatalog, merge-unified, validation
  cli/                  bin, serve (static file server)
  parsers/
    prisma/             PrismaParser, load-schema, mappers
    drizzle/            DrizzleParser, AST extraction, mappers
    sql/                SqlParser, DDL parse-source, mappers
    adapters.ts         prisma(), drizzle(), sql() config helpers
  process/              postProcess, write-schema
  react/                OzzyRMDocs.tsx, server.ts
  ui/                   mount, components, styles, glossary
  utils/                adapter types, DocSchema types, Parser interface
```

## Data flow

```
ozzyrm.config.ts
  └── schemas: [prisma(), drizzle(), sql()]
  └── unified?: [{ id, sources: [...] }]   // optional merge groups
        │
        ▼
  loadCatalog(config)  OR  generate(config)  OR  CLI ozzyrm watch
        │
        ▼
  Parser (PrismaParser | DrizzleParser | SqlParser)  // per source, Promise.allSettled in groups
        │
        ▼
  DocSchema (normalized JSON) per source
        │
        ▼
  mergeUnifiedSchema (strict identity + relation validation)  // when unified configured
        │
        ▼
  postProcess (referencedBy, metadata descriptions)
        │
        ▼
  SchemaCatalogGroup[]  →  mount() / OzzyRMDocs
      (unified entry replaces consumed member sources)
```

### DocSchema

The internal canonical format lives in `src/utils/types/types.ts`. Key entities:

- `DocModel` with `DocField[]`, relations, indexes, `referencedBy`
- `DocEnum` with values
- Source metadata: `orm` (`prisma` | `drizzle` | `sql` | `unified`), `version`, `dataSource.provider`
- Unified provenance: `DocSchema.sources`, optional `source` on models/enums

Parsers map Prisma DMMF, Drizzle AST, or SQL DDL into this shape. UI components only consume `DocSchema`, never raw source syntax.

### Unified merge (catalog layer)

Parsers stay pure. Cross-source validation lives in `src/catalog/merge-unified.ts` + `validation.ts`.

- Alias registry: logical `name` plus physical `tableName` / `dbName` (normalized)
- Duplicate identities always conflict (`DUP_MODEL`, `DUP_TABLE_NAME`, `DUP_ENUM`, …)
- Relations resolve across members only when a single owner matches; also validate target fields
- Aggregate diagnostics then throw `UnifiedSchemaValidationError`
- Policy: `loadCatalog` / `generate` fail closed; `watch` logs and keeps previous JSON

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

### SQL (raw DDL)

- Lightweight statement-based DDL parser (no external SQL engine required)
- Supports `CREATE TABLE`, `CREATE TYPE ... AS ENUM`, `CREATE INDEX`, inline / table-level `FOREIGN KEY`, and `ALTER TABLE ... ADD FOREIGN KEY`
- Resolves single `.sql` files or directories of `.sql` files
- Exports: `SqlParser`, `parseSqlSource`, `resolveSqlSchemaFiles`, `expandSqlWatchPaths`
- Maps columns, enums, defaults, uniqueness, primary keys, and relations into the same `DocSchema` used by ORM adapters
- Optional provider hint (e.g. MySQL `ENGINE=InnoDB`) when detectable

Companies that mix ORMs with migration SQL or legacy dumps can document both sources in one catalog.

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
| `loadCatalog(config, { cwd })` | Parse all adapters in memory; merge unified groups; returns `{ catalog, defaultSchemaId }` |
| `generate(config, { cwd, configPath })` | Write per-schema JSON + `catalog.json` to `config.output` |
| `watchCatalog(options)` | File watch on config + schema paths; respects `config.watch` (`enabled`, `debounceMs`, `generateOnStart`, `hot`) |
| `resolveWatchConfig(watch)` | Normalize `watch: boolean | object` to defaults |

| `mergeUnifiedSchema(input)` | Pure strict merge of parsed member sources |
| `UnifiedSchemaValidationError` | Aggregated diagnostics with stable codes |

CLI commands `generate` and `watch` call these directly.

## Config types

```ts
defineProject({
  output?: string,
  schemas: OzzyRMSchemaSource[],
  unified?: UnifiedSchemaDefinition[],
  scenarios?: SchemaScenarioDefinition[],
  watch?: boolean | OzzyRMWatchConfig,
})
prisma({ id, include, version?, file?, disabled?, metadata? })
drizzle({ id, include, version?, file?, disabled?, metadata? })
sql({ id, include, version?, file?, disabled?, metadata? })

// unified group — member source ids must exist in schemas
{ id, sources: string[], file?, version?, label? }

// scenario — use-case slice attached to a catalog version by schemaId
{
  id, label, description?,
  schemaId,           // SchemaCatalogVersion.id
  models: string[],
  enums?: string[],
  path?: string[],    // ordered models for ERD path highlight
}
```

Each `OzzyRMSchemaSource` extends `OrmDocgenAdapter` with `id`, optional `label`, `file` (sidebar label), and `version` (semver display).

`loadCatalog` resolves scenarios against the matching `DocSchema`, derives `pathEdges` from adjacent path pairs that have a relation, and attaches `DocScenario[]` onto `SchemaCatalogVersion.scenarios`. Validation is **fail-closed**: invalid kebab-case ids, duplicate ids, unknown `schemaId` / model / enum, path models not listed in `models`, or missing relations between path hops throw `UnifiedSchemaValidationError` with stable diagnostic codes (`INVALID_SCENARIO_ID`, `UNKNOWN_MODEL`, `PATH_RELATION_MISSING`, …). `OzzyRMDocsFromConfig` catches that error and renders `ConfigErrorOverlay` (copyable popup).