# Infrastructure and Repository

## Repository structure

The git-tracked repository contains **library source only**:

```
/
  src/                  Package source (published as ozzyrm)
  context/              Agent documentation (this folder)
  README.md             Public consumer readme
  package.json          Single package manifest (ozzyrm)
  tsconfig.build.json   Build config
  bun.lock              Lockfile
```

Gitignored (local development only):

| Path | Purpose |
|------|---------|
| `/web` | Internal Next.js playground (workspace-linked dev UI) |
| `/test` | Consumer smoke test (`npm i ozzyrm` simulation) |
| `/scripts` | Monorepo dev scripts (generate, watch, inline-css caller) |
| `/fixtures` | Prisma/Drizzle sample schemas for local generate |
| `ozzyrm.config.ts` | Root dev config pointing at fixtures |
| `dist/` | Build output |
| `.ozzyrm/` | Generated schema JSON |

Agents should not commit playground or test artifacts unless explicitly requested.

## Package management

- **Package manager:** Bun (`bun install`, `bun run build`)
- **Published registry:** npmjs.com, package name `ozzyrm`, access public
- **Version:** 0.2.0 (unified package; replaces `@ozzyrm/*` scoped packages)

### Publish flow

```bash
bun run build
npm publish --access public
```

Account may require 2FA (security key or authenticator) for publish/unpublish operations.

### Consumer install

```bash
bun add ozzyrm
# or
npm i ozzyrm
```

For local development against source, consumers can use `"ozzyrm": "file:.."` but npm registry install is the canonical test path.

## CLI distribution

The `ozzyrm` binary ships inside the npm package:

- `ozzyrm generate` — write JSON to `./.ozzyrm` (or configured output)
- `ozzyrm watch` — watch schema files and regenerate
- `ozzyrm serve` — static file server for prebuilt docs (minimal; not full SSR)

## Next.js consumer requirements

When embedding in Next.js App Router:

```ts
// next.config.ts
const nextConfig = {
  transpilePackages: ["ozzyrm"],
  serverExternalPackages: ["@prisma/internals", "@prisma/dmmf"],
};
```

Prisma internals must run on the server (Node), not in the browser bundle.

## Local dev workflows

### Library development

```bash
bun install
bun run build
```

### Internal playground (gitignored `web/`)

Requires local `ozzyrm.config.ts`, `fixtures/`, and `scripts/`. Uses `file:..` or workspace link to source.

### Consumer smoke test (gitignored `test/`)

Simulates public install:

```
test/
  ozzyrm.config.ts
  prisma/schema.prisma
  app/page.tsx          loadCatalog + OzzyRMDocs
  package.json          "ozzyrm": "^0.2.0"
```

## Dependencies

Runtime (bundled in published package):

- `@prisma/internals`, `@prisma/dmmf` — Prisma parsing
- `lucide-react` — UI icons
- `typescript` — listed as dependency (consider moving to devDependencies in future)

Peer dependencies:

- `react`, `react-dom` ^19

Build-only (devDependencies):

- `tailwindcss`, `@tailwindcss/cli` — CSS bundling at publish time

## Environment and secrets

No secrets in repository. `.env*` is gitignored. Prisma schemas for documentation-only use do not require a live database connection.

## CI considerations (not yet implemented)

Recommended future pipeline:

1. `bun install`
2. `bun run build`
3. Parser unit tests against `fixtures/`
4. Optional: build `test/` app against published tarball (`npm pack`)
