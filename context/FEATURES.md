# Features (Current)

## Config and adapters

- `defineProject()` and `defineConfig()` helpers
- `prisma()` adapter: single file, directory, multi-file Prisma schemas
- `drizzle()` adapter: entry file with import graph resolution
- Per-source options: `id`, `version`, `file` label, `disabled` flags, `metadata` descriptions
- Default output directory: `./.ozzyrm`

## Parsing

- Prisma: models, enums, fields, relations, indexes, defaults, `@map`, datasource provider, ORM version from `@prisma/internals`
- Drizzle: tables, columns, enums, relations, multi-file projects
- Post-processing: populate `referencedBy`, apply external metadata descriptions

## Catalog

- `loadCatalog(config)` — runtime parse without writing files
- `generate(config)` — JSON per schema + `catalog.json` manifest
- `watchCatalog()` — debounced file watching on config and schema paths
- Version grouping in sidebar (multiple versions per schema file)

## CLI

- `ozzyrm generate [--config path]`
- `ozzyrm watch [--config path]`
- `ozzyrm serve --root <dir> [--port] [--route]` — static HTTP server

## UI

- Framework-agnostic `mount(hostElement, options)`
- React wrapper `<OzzyRMDocs catalog={...} />`
- Server helper `<OzzyRMDocsFromConfig config={...} />`
- Auto-injected bundled CSS (no consumer Tailwind setup)
- Built-in default logo (data URI); optional `logoSrc` override

### Navigation and layout

- Collapsible source sidebar (schema file tree with versions)
- Main nav sidebar with scroll spy
- Schema overview section
- Model detail: fields table, relations, indexes
- Enum detail with values
- Bottom navigation on mobile/narrow layouts

### Search and glossary

- Sidebar search across models and enums
- Glossary sheet for types and attributes (right panel)
- Type badges link to glossary sections
- Reference links between related models/fields

### UX details

- Debounced search input
- Resizable source sidebar
- Sheet animations with reduced-motion support
- Section highlighting on scroll

## React / Next.js integration

- Client component with Fast Refresh-safe mount/unmount
- Server Component compatible via `loadCatalog` or `OzzyRMDocsFromConfig`
- Props: `catalog`, `defaultSchemaId`, `basePath`, `logoSrc`, `className`

## npm package surface

Single package `ozzyrm@0.2.0` with subpath exports:

- `.` — core API
- `./react` — client components
- `./react/server` — server helpers
- `./ui` — low-level UI API
