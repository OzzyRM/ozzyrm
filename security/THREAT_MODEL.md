# Threat Model

This document describes **security context** for OzzyRM: assets, actors, trust boundaries, and concrete attack surfaces in the codebase.

## 1. System overview

```text
  [Developer / CI]
        │
        ▼
  ozzyrm.config.ts  ──dynamic import──►  loadCatalog / generate / watch
        │                                      │
        │ include[]                            ├─► parsers (prisma|drizzle|sql)
        ▼                                      ├─► merge-unified (fail-closed)
  Schema files on disk                         ├─► resolve-scenarios (fail-closed)
                                               ▼
                                    DocSchema / catalog JSON
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         ▼                     ▼                     ▼
                   .ozzyrm/*.json      OzzyRMDocs (React)     ozzyrm serve (static)
                   stamp.js (hot)      mount / FromConfig
```

OzzyRM assumes a **trusted development or deployment host**. The library documents schema structure; it does not implement app authn/authz.

## 2. Assets to protect

| Asset | Why it matters |
|-------|----------------|
| Schema structure (models, fields, relations, enums) | May reveal internal domain model, PII fields, tenancy design |
| Datasource / connection metadata | Connection strings must never appear in docs output |
| Host filesystem | CLI/config can read/write wherever the process can |
| Consumer app integrity | Compromised package or malicious PR could inject UI XSS or RCE via config patterns |
| Generated `.ozzyrm/` artifacts | Often committed or served; treat as semi-public documentation data |
| npm package integrity | Supply-chain compromise affects all consumers |

## 3. Threat actors

| Actor | Capability | Typical goals |
|-------|------------|---------------|
| External web visitor | Hits consumer docs URL only | Read schema docs, XSS if host/library buggy |
| Malicious open-source contributor | Opens PRs, suggests deps | RCE helpers, traversal, XSS sinks, dependency confusion |
| Compromised dependency | Code in node_modules | Arbitrary code in generate/UI |
| Insider with repo write | Edits config/include | Full local RCE / FS via existing design |
| CI attacker (poisoned pipeline) | Alters publish job | Malicious package release |

## 4. Trust boundaries

### Boundary A — Config module

**Location:** `src/catalog/load-catalog.ts` → `loadConfigFile` (`await import(absoluteConfigPath)`).

- Crossing this boundary **executes** the config module.
- Equivalent trust to “run this project’s Node code.”
- `--config` CLI flag expands who controls the path.

### Boundary B — Schema include paths

**Location:** adapters `prisma()` / `drizzle()` / `sql()` `include[]`, resolved with `path.resolve(cwd, …)`.

- Reads arbitrary files the process can open (including outside project if `../` or absolute).
- Prisma uses `@prisma/internals` (large parser surface).
- Drizzle: TypeScript **AST only** (file text parsed; not executed as a program).
- SQL: text DDL parse.

### Boundary C — Generated output

**Location:** `src/catalog/generate.ts`, default `./.ozzyrm`.

- Writes JSON (+ optional `stamp.js` when `watch.hot`).
- Consumers may serve or import these files.
- Watch failures keep previous JSON (availability > corrupt overwrite).

### Boundary D — Docs UI in the browser

**Location:** `src/ui/*`, `src/react/*`.

- Catalog JSON / in-memory `DocSchema` enters React tree.
- Trust: host app decides who can load the page; library must not turn schema strings into HTML/JS sinks.

### Boundary E — Static serve

**Location:** `src/cli/serve.ts` + `src/security/paths.ts` → `resolveStaticFile`.

- Serves files from a root directory for local preview.
- Pathnames are confined: `..` segments, encoded traversal, and escapes outside root → `403 Forbidden`.

### Boundary F — Hot stamp import

**Location:** `ozzyrm/react/server` pulling `.ozzyrm/stamp.js` via dynamic import when hot reload is enabled.

- Intended content is a fixed stamp export written by generate.
- Anyone who can write that path can influence what gets imported in the Next server process.

## 5. STRIDE-style notes

| Category | Example against OzzyRM | Mitigation direction |
|----------|------------------------|----------------------|
| Spoofing | Fake package name / typosquat | Scoped publish controls, lockfiles, provenance |
| Tampering | Malicious PR changing parsers to eval schema text | Review gates, CODEOWNERS for security-sensitive paths |
| Repudiation | N/A primary (local CLI) | CI logs for releases |
| Information disclosure | Datasource URL in catalog; schema over public internet | Never persist URLs; consumer auth; redact logs |
| Denial of service | Huge schema / cyclic watch regenerate / pathological SQL | Size limits, debounce, watch fail-soft |
| Elevation of privilege | Config import RCE; serve traversal writing/reading secrets | Path confinement; document trust; optional sandbox later |

## 6. Attack surfaces (code-oriented)

### 6.1 Intentional high trust (document, don’t pretend otherwise)

1. **Dynamic import of config** — required DX for `ozzyrm.config.ts`.
2. **Reading `include` paths** — required to parse schemas.
3. **Writing `output`** — required for generate/watch.

### 6.2 Must remain fail-closed

1. Unified merge conflicts (`DUP_*`, `REL_*`, …) — `src/catalog/merge-unified.ts`
2. Project shape (`EMPTY_SCHEMAS`, `INVALID_SOURCE_ID`, `EMPTY_INCLUDE`) — `src/catalog/load-catalog.ts`
3. Scenario refs (`UNKNOWN_MODEL`, `PATH_RELATION_MISSING`, …) — `src/catalog/resolve-scenarios.ts`

### 6.3 Must stay free of HTML injection

1. Model / field / enum labels in tables and sidebar
2. Search empty states and dialog results
3. Glossary / docs placeholder titles and descriptions
4. Scenario labels and descriptions
5. Validation error overlay message text (copyable; still text, not HTML)

### 6.4 Known / historical hardening targets

1. **`ozzyrm serve` path confinement** — reject paths that resolve outside root
2. **Optional path allowlisting** for `include`/`output` under project root
3. **Hot stamp integrity** — write-only by generate; verify content shape before import
4. **Resource limits** — max files, max file size, max models for parse/UI
5. **`logoSrc` URL policy** — prefer same-origin / relative; block `javascript:` etc. if validated

## 7. Data flow of sensitive fields

```text
Prisma schema may contain:
  datasource db { url = env("DATABASE_URL") }

        │
        ▼
  @prisma/internals getConfig / getDMMF
        │
        ▼
  OzzyRM DocSchema.dataSource → provider (and intentionally not a live secret store)
        │
        ▼
  UI Badge / overview metadata
```

**Rule:** generated catalog and UI must never become a secret dump. If future fields add URLs, they must be redacted or opt-in with loud warnings.

## 8. Deployment contexts

| Context | Risk focus |
|---------|------------|
| Local `bun dev` playground | Config RCE = developer self-host; low external risk |
| CI `ozzyrm generate` | Untrusted PR must not get secrets in env when generating |
| Production Next docs route | Authz of who can see schema; CSP; dependency versions |
| Published npm package | Supply chain, min shipped attack surface |

## 9. Assumptions

1. Developers who can edit the repo can already run arbitrary code locally.
2. Consumers host docs behind their own access control when schemas are sensitive.
3. Schema file contents are semi-sensitive intellectual property, not equivalent to production DB credentials—but still deserve care.
4. React’s default escaping remains enabled (no new `dangerouslySetInnerHTML` without review).

## 10. Non-goals of this threat model

- Protecting against a fully compromised developer laptop
- Replacing consumer WAF / SSO
- Guaranteeing safety of executing untrusted third-party `ozzyrm.config.ts` in a shared multi-tenant service (do not do this)
